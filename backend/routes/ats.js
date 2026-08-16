const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const { resumeToText } = require('../utils/resumeText');
const { runATSScan } = require('../services/gemini');

// POST /api/ats/scan
// Body: { resumeId, jobDescription }
router.post('/scan', auth, async (req, res) => {
  const { resumeId, jobDescription } = req.body;

  if (!resumeId || typeof resumeId !== 'string') {
    return res.status(400).json({ message: 'resumeId is required' });
  }
  if (!jobDescription || typeof jobDescription !== 'string' || !jobDescription.trim()) {
    return res.status(400).json({ message: 'Job description is required' });
  }
  if (jobDescription.length > 10000) {
    return res.status(400).json({ message: 'Job description too long (max 10000 characters)' });
  }

  try {
    // Verify resume ownership
    const resume = await db.Resume.findById(resumeId);
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }
    if (resume.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to access this resume' });
    }

    // Extract text from resume
    const resumeText = resumeToText(resume);

    // Run ATS scan
    const result = await runATSScan({ resumeText, jobDescription: jobDescription.trim() });

    // Attach resume reference for context
    res.json({
      resumeId: resume._id,
      resumeTitle: resume.title,
      ...result,
    });
  } catch (error) {
    console.error('ATS scan error:', error);
    if (error.message.includes('Gemini API not configured')) {
      return res.status(502).json({ message: 'ATS service not configured. Contact administrator.' });
    }
    if (error.message.includes('empty') || error.message.includes('required')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(502).json({ message: 'ATS analysis failed. Please try again.' });
  }
});

module.exports = router;