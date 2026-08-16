const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');

module.exports = function (req, res, next) {
  // Get token from header
  const authHeader = req.header('Authorization');

  if (!authHeader) {
    return res.status(401).json({ message: 'No authorization token, access denied' });
  }

  // Token format: "Bearer <token>"
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ message: 'Token format is invalid, must be Bearer <token>' });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Attach decoded user information (specifically id) to the request object
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid or has expired' });
  }
};
