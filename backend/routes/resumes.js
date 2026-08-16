const express = require('express');
const router = express.Router();
const multer = require('multer');
const db = require('../db');
const auth = require('../middleware/auth');
const { extractTextFromFile, parseResumeWithAI } = require('../services/resumeParser');

// Configure multer for memory storage (max 10MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.pdf', '.docx', '.doc', '.txt', '.md', '.json'];
    const ext = '.' + (file.originalname || '').split('.').pop().toLowerCase();
    if (allowedExtensions.includes(ext) || file.mimetype.includes('pdf') || file.mimetype.includes('word') || file.mimetype.includes('text') || file.mimetype.includes('json')) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Please upload a PDF, DOCX, TXT, or JSON file.'));
    }
  }
});

// @route   POST api/resumes/upload
// @desc    Upload and AI-parse a resume document into a new editable ResumeCraft resume
// @access  Private
router.post('/upload', auth, (req, res) => {
  upload.single('resumeFile')(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File is too large. Maximum allowed size is 10MB.' });
      }
      return res.status(400).json({ message: err.message || 'File upload error.' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Please select a resume file to upload.' });
    }

    try {
      // 1. Extract text from the uploaded file
      const extraction = await extractTextFromFile({
        buffer: req.file.buffer,
        mimetype: req.file.mimetype,
        originalname: req.file.originalname
      });

      let structuredResume;
      if (extraction.isDirectJson) {
        structuredResume = extraction.data;
      } else {
        // 2. Parse extracted text with Gemini AI (with heuristic fallback)
        structuredResume = await parseResumeWithAI(extraction.rawText, req.file.originalname);
      }

      // 3. Create the new resume document in the database
      const newResume = await db.Resume.create({
        userId: req.user.id,
        title: (req.body.title && req.body.title.trim()) || structuredResume.title || 'Imported Resume',
        content: structuredResume.content || structuredResume
      });

      res.status(201).json(newResume);
    } catch (parseError) {
      console.error('Resume upload & parsing failed:', parseError);
      res.status(500).json({ message: parseError.message || 'Failed to parse and import resume.' });
    }
  });
});

// @route   POST api/resumes/:id/import
// @desc    Upload and parse a resume to update/replace content of an existing resume
// @access  Private
router.post('/:id/import', auth, (req, res) => {
  upload.single('resumeFile')(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File is too large. Maximum allowed size is 10MB.' });
      }
      return res.status(400).json({ message: err.message || 'File upload error.' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Please select a resume file to upload.' });
    }

    try {
      const resume = await db.Resume.findById(req.params.id);
      if (!resume) {
        return res.status(404).json({ message: 'Resume not found' });
      }
      if (resume.userId.toString() !== req.user.id) {
        return res.status(401).json({ message: 'Not authorized to modify this resume' });
      }

      const extraction = await extractTextFromFile({
        buffer: req.file.buffer,
        mimetype: req.file.mimetype,
        originalname: req.file.originalname
      });

      let structuredResume;
      if (extraction.isDirectJson) {
        structuredResume = extraction.data;
      } else {
        structuredResume = await parseResumeWithAI(extraction.rawText, req.file.originalname);
      }

      const updated = await db.Resume.findByIdAndUpdate(
        req.params.id,
        {
          $set: {
            title: (req.body.title && req.body.title.trim()) || structuredResume.title || resume.title,
            content: structuredResume.content || structuredResume
          }
        },
        { new: true }
      );

      res.json(updated);
    } catch (parseError) {
      console.error('Resume import error:', parseError);
      res.status(500).json({ message: parseError.message || 'Failed to parse and import resume.' });
    }
  });
});

// @route   GET api/resumes
// @desc    Get all resumes of the authenticated user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const resumes = await db.Resume.find({ userId: req.user.id });
    res.json(resumes);
  } catch (error) {
    console.error('Fetch resumes error:', error);
    res.status(500).json({ message: 'Server error fetching resumes' });
  }
});

// @route   GET api/resumes/:id
// @desc    Get a specific resume by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const resume = await db.Resume.findById(req.params.id);
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }
    
    // Verify ownership
    if (resume.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to access this resume' });
    }
    
    res.json(resume);
  } catch (error) {
    console.error('Fetch resume detail error:', error);
    res.status(500).json({ message: 'Server error fetching resume details' });
  }
});

// @route   POST api/resumes
// @desc    Create a new resume
// @access  Private
router.post('/', auth, async (req, res) => {
  const { title, content } = req.body;

  if (title !== undefined && (typeof title !== 'string' || title.trim().length > 120)) {
    return res.status(400).json({ message: 'Title must be a string of at most 120 characters' });
  }
  if (content !== undefined && (content === null || typeof content !== 'object' || Array.isArray(content))) {
    return res.status(400).json({ message: 'Content must be an object' });
  }

  try {
    const newResume = await db.Resume.create({
      userId: req.user.id,
      title: title || 'Untitled Resume',
      content: content || {
        personalInfo: {
          name: '',
          title: '',
          email: '',
          phone: '',
          location: '',
          website: '',
          github: '',
          linkedin: ''
        },
        styles: {
          fontFamily: 'EB Garamond',
          fontSize: '14px',
          marginY: '24px',
          marginX: '24px',
          sectionSpacing: '16px',
          itemSpacing: '8px',
          primaryColor: '#0f172a'
        },
        sections: [
          {
            id: 'summary',
            name: 'Professional Summary',
            visible: true,
            type: 'text',
            text: ''
          },
          {
            id: 'experience',
            name: 'Work Experience',
            visible: true,
            type: 'list',
            items: []
          },
          {
            id: 'education',
            name: 'Education',
            visible: true,
            type: 'list',
            items: []
          },
          {
            id: 'projects',
            name: 'Projects',
            visible: true,
            type: 'list',
            items: []
          },
          {
            id: 'skills',
            name: 'Skills',
            visible: true,
            type: 'skills',
            items: []
          },
          {
            id: 'languages',
            name: 'Languages',
            visible: true,
            type: 'languages',
            items: []
          },
          {
            id: 'certificates',
            name: 'Certifications',
            visible: true,
            type: 'list',
            items: []
          }
        ]
      }
    });
    
    res.status(201).json(newResume);
  } catch (error) {
    console.error('Create resume error:', error);
    res.status(500).json({ message: 'Server error creating resume' });
  }
});

// @route   PUT api/resumes/:id
// @desc    Update a resume
// @access  Private
router.put('/:id', auth, async (req, res) => {
  const { title, content } = req.body;

  if (title !== undefined && (typeof title !== 'string' || title.trim().length > 120)) {
    return res.status(400).json({ message: 'Title must be a string of at most 120 characters' });
  }
  if (content !== undefined && (content === null || typeof content !== 'object' || Array.isArray(content))) {
    return res.status(400).json({ message: 'Content must be an object' });
  }

  try {
    let resume = await db.Resume.findById(req.params.id);
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }
    
    // Verify ownership
    if (resume.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to modify this resume' });
    }
    
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    
    const updatedResume = await db.Resume.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );
    
    res.json(updatedResume);
  } catch (error) {
    console.error('Update resume error:', error);
    res.status(500).json({ message: 'Server error updating resume' });
  }
});

// @route   DELETE api/resumes/:id
// @desc    Delete a resume
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const resume = await db.Resume.findById(req.params.id);
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }
    
    // Verify ownership
    if (resume.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to delete this resume' });
    }
    
    await db.Resume.findByIdAndDelete(req.params.id);
    res.json({ message: 'Resume deleted successfully' });
  } catch (error) {
    console.error('Delete resume error:', error);
    res.status(500).json({ message: 'Server error deleting resume' });
  }
});

// @route   POST api/resumes/:id/duplicate
// @desc    Duplicate an existing resume
// @access  Private
router.post('/:id/duplicate', auth, async (req, res) => {
  try {
    const resume = await db.Resume.findById(req.params.id);
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }
    
    // Verify ownership
    if (resume.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to duplicate this resume' });
    }
    
    const duplicatedResume = await db.Resume.create({
      userId: req.user.id,
      title: `${resume.title} (Copy)`,
      content: JSON.parse(JSON.stringify(resume.content)) // deep clone content
    });
    
    res.status(201).json(duplicatedResume);
  } catch (error) {
    console.error('Duplicate resume error:', error);
    res.status(500).json({ message: 'Server error duplicating resume' });
  }
});

module.exports = router;
