const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET } = require('../config');

// @route   POST api/auth/signup
// @desc    Register a new user
// @access  Public
router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }

  if (typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({ message: 'Name must be at least 2 characters long' });
  }

  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'Please enter a valid email address' });
  }

  if (typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long' });
  }

  try {
    // Check for existing user
    const existingUser = await db.User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await db.User.create({
      name,
      email,
      password: hashedPassword
    });

    // Sign JWT
    const secret = JWT_SECRET;
    jwt.sign(
      { id: newUser._id },
      secret,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.status(201).json({
          token,
          user: {
            id: newUser._id,
            name: newUser.name,
            email: newUser.email
          }
        });
      }
    );
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error during signup' });
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user and get token
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }

  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ message: 'Invalid request format' });
  }

  try {
    // Check for user
    const user = await db.User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Sign JWT
    const secret = JWT_SECRET;
    jwt.sign(
      { id: user._id },
      secret,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email
          }
        });
      }
    );
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// @route   GET api/auth/user
// @desc    Get user data using token
// @access  Private
const auth = require('../middleware/auth');
router.get('/user', auth, async (req, res) => {
  try {
    const user = await db.User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Return user without password
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Fetch user error:', error);
    res.status(500).json({ message: 'Server error fetching user details' });
  }
});

module.exports = router;
