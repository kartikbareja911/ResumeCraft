const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { GoogleGenAI } = require('@google/genai');
const { GEMINI_API_KEY, GEMINI_MODEL } = require('../config');

const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

// Unique ID generator for resume items
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
}

/**
 * Extracts raw plain text from uploaded resume buffer.
 * Supports PDF, DOCX, TXT, MD, and JSON.
 */
async function extractTextFromFile({ buffer, mimetype, originalname }) {
  const ext = (originalname || '').split('.').pop().toLowerCase();

  // 1. JSON
  if (mimetype === 'application/json' || ext === 'json') {
    const jsonStr = buffer.toString('utf-8');
    try {
      const parsedJson = JSON.parse(jsonStr);
      // If it's already in ResumeCraft format
      if (parsedJson.content && (parsedJson.content.personalInfo || parsedJson.content.sections)) {
        return { isDirectJson: true, data: parsedJson };
      }
      return { rawText: JSON.stringify(parsedJson, null, 2) };
    } catch (e) {
      return { rawText: jsonStr };
    }
  }

  // 2. PDF
  if (mimetype === 'application/pdf' || ext === 'pdf') {
    try {
      let text = '';
      if (typeof pdfParse === 'function') {
        const pdfData = await pdfParse(buffer);
        text = pdfData.text ? pdfData.text.trim() : '';
      } else if (pdfParse && pdfParse.PDFParse) {
        const parser = new pdfParse.PDFParse({ data: buffer });
        const pdfData = await parser.getText();
        await parser.destroy?.();
        text = typeof pdfData === 'string' ? pdfData.trim() : (pdfData?.text ? pdfData.text.trim() : '');
      } else if (pdfParse && typeof pdfParse.default === 'function') {
        const pdfData = await pdfParse.default(buffer);
        text = pdfData.text ? pdfData.text.trim() : '';
      }

      // Also scan raw PDF buffer for embedded hyperlink annotations (/URI strings)
      const rawPdfStr = buffer.toString('binary');
      const uriRegex = /\/URI\s*\((https?:\/\/[^)]+)\)/gi;
      const extractedLinks = new Set();
      let match;
      while ((match = uriRegex.exec(rawPdfStr)) !== null) {
        extractedLinks.add(match[1].trim());
      }
      // Also regex scan for plain text URLs in buffer
      const plainUrlRegex = /https?:\/\/[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=%]+/gi;
      while ((match = plainUrlRegex.exec(rawPdfStr)) !== null) {
        if (!match[0].includes('w3.org') && !match[0].includes('adobe.com') && !match[0].includes('schema.org')) {
          extractedLinks.add(match[0].trim());
        }
      }

      if (extractedLinks.size > 0) {
        text += '\n\n[EMBEDDED HYPERLINKS & VERIFICATION URLS IN PDF]:\n' + Array.from(extractedLinks).join('\n');
      }

      if (!text) throw new Error('PDF has no extractable text (it might be scanned or image-only).');
      return { rawText: text };
    } catch (err) {
      console.error('PDF parsing error:', err);
      throw new Error(`Failed to parse PDF: ${err.message}`);
    }
  }

  // 3. Word Document (.docx)
  if (
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimetype === 'application/msword' ||
    ext === 'docx' ||
    ext === 'doc'
  ) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      const text = result.value ? result.value.trim() : '';
      if (!text) throw new Error('DOCX document is empty.');
      return { rawText: text };
    } catch (err) {
      console.error('DOCX parsing error:', err);
      throw new Error(`Failed to parse Word document: ${err.message}`);
    }
  }

  // 4. Plain text / Markdown
  if (mimetype?.startsWith('text/') || ext === 'txt' || ext === 'md') {
    return { rawText: buffer.toString('utf-8') };
  }

  // Default attempt plain text
  return { rawText: buffer.toString('utf-8') };
}

/**
 * Intelligent heuristic fallback parser if Gemini API is unavailable or rate-limited.
 */
function heuristicParseResume(text, originalFilename = 'Imported Resume') {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  
  // Basic personal info extraction
  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
  const phoneMatch = text.match(/(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/);
  const linkedinMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w-]+/i);
  const githubMatch = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[\w-]+/i);
  const websiteMatch = text.match(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/i);

  const nameCandidate = lines[0] && lines[0].length < 50 && !lines[0].includes('@') ? lines[0] : 'Your Name';
  const titleCandidate = lines[1] && lines[1].length < 60 && !lines[1].includes('@') ? lines[1] : '';

  // Extract sections
  let currentSection = 'summary';
  const sectionContent = {
    summary: [],
    experience: [],
    education: [],
    projects: [],
    skills: [],
    certificates: [],
    languages: []
  };

  const sectionHeaders = {
    summary: /^(professional\s+summary|summary|profile|about\s+me|objective)/i,
    experience: /^(work\s+experience|experience|employment|work\s+history|professional\s+experience)/i,
    education: /^(education|academic\s+background|degrees)/i,
    projects: /^(projects|personal\s+projects|key\s+projects)/i,
    skills: /^(skills|technical\s+skills|core\s+competencies|technologies)/i,
    certificates: /^(certifications|certificates|licenses)/i,
    languages: /^(languages|language\s+proficiency)/i,
  };

  for (const line of lines.slice(2)) {
    let matchedHeader = false;
    for (const [sec, regex] of Object.entries(sectionHeaders)) {
      if (regex.test(line)) {
        currentSection = sec;
        matchedHeader = true;
        break;
      }
    }
    if (!matchedHeader) {
      sectionContent[currentSection].push(line);
    }
  }

  // Format parsed sections
  const summaryText = sectionContent.summary.join(' ').trim();

  // Experience
  const expItems = [];
  let curExp = null;
  for (const l of sectionContent.experience) {
    if (l.length > 3 && l.length < 80 && (l.includes('|') || l.includes(' - ') || l.includes(' at ') || !curExp)) {
      if (curExp) expItems.push(curExp);
      const parts = l.split(/\||–|-/).map(p => p.trim());
      curExp = {
        id: generateId(),
        position: parts[0] || 'Role',
        company: parts[1] || '',
        startDate: '',
        endDate: '',
        description: ''
      };
    } else if (curExp) {
      curExp.description = (curExp.description ? curExp.description + '\n' : '') + l;
    }
  }
  if (curExp) expItems.push(curExp);

  // Education
  const eduItems = [];
  let curEdu = null;
  for (const l of sectionContent.education) {
    if (l.length > 3 && l.length < 90 && (l.includes('|') || l.includes('University') || l.includes('College') || l.includes('Degree') || !curEdu)) {
      if (curEdu) eduItems.push(curEdu);
      const parts = l.split(/\||–|-/).map(p => p.trim());
      curEdu = {
        id: generateId(),
        institution: parts[0] || 'Institution',
        degree: parts[1] || 'Degree',
        fieldOfStudy: parts[2] || '',
        startDate: '',
        endDate: '',
        description: ''
      };
    } else if (curEdu) {
      curEdu.description = (curEdu.description ? curEdu.description + '\n' : '') + l;
    }
  }
  if (curEdu) eduItems.push(curEdu);

  // Skills
  const skillsText = sectionContent.skills.join(', ');
  const skillItems = skillsText ? [
    { id: generateId(), category: 'Technical Skills', skills: skillsText }
  ] : [];

  // Projects
  const projectItems = [];
  if (sectionContent.projects.length > 0) {
    projectItems.push({
      id: generateId(),
      name: sectionContent.projects[0] || 'Featured Project',
      technologies: '',
      link: '',
      startDate: '',
      description: sectionContent.projects.slice(1).join('\n')
    });
  }

  // Certificates & Achievements
  const certItems = [];
  let curCert = null;
  for (const l of sectionContent.certificates) {
    if (l.length > 2) {
      const urlMatch = l.match(/https?:\/\/[^\s)]+/);
      const isSubtitleOrDesc = l.toLowerCase().startsWith('co-authored') || l.toLowerCase().startsWith('published') || l.toLowerCase().startsWith('presented') || (curCert && l.length > 50);
      if (isSubtitleOrDesc && curCert) {
        curCert.description = (curCert.description ? curCert.description + '\n' : '') + l;
      } else {
        const cleanTitle = l.replace(/https?:\/\/[^\s)]+/g, '').replace(/[|–-]/g, ' ').trim();
        curCert = {
          id: generateId(),
          name: cleanTitle || 'Certification',
          link: urlMatch ? urlMatch[0] : '',
          description: ''
        };
        certItems.push(curCert);
      }
    }
  }

  const cleanFilename = originalFilename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
  const resumeTitle = nameCandidate !== 'Your Name' ? `${nameCandidate}'s Resume` : cleanFilename || 'Imported Resume';

  return formatIntoResumeCraftSchema({
    title: resumeTitle,
    personalInfo: {
      name: nameCandidate,
      title: titleCandidate,
      email: emailMatch ? emailMatch[0] : '',
      phone: phoneMatch ? phoneMatch[0] : '',
      location: '',
      website: websiteMatch ? websiteMatch[0] : '',
      github: githubMatch ? githubMatch[0] : '',
      linkedin: linkedinMatch ? linkedinMatch[0] : ''
    },
    summary: summaryText,
    experience: expItems,
    education: eduItems,
    projects: projectItems,
    skills: skillItems,
    languages: [],
    certificates: certItems
  });
}

/**
 * Converts extracted raw text to structured ResumeCraft JSON using Gemini AI
 */
async function parseResumeWithAI(rawText, originalFilename = 'Imported Resume') {
  if (!rawText || !rawText.trim()) {
    throw new Error('No readable text found in document');
  }

  const PARSER_PROMPT = `You are a world-class resume parser and career document analyzer.
Convert the following resume text into a clean, structured JSON format for a modern resume builder.

Extract and structure all details accurately. If a field is not found in the resume, leave it as an empty string ("") or empty array ([]).

Return ONLY a valid JSON object matching this exact schema:
{
  "title": string (suggested resume title like "John Doe - Software Engineer" or similar based on name and role),
  "personalInfo": {
    "name": string,
    "title": string (job title or professional headline),
    "email": string,
    "phone": string,
    "location": string (city, state or country),
    "website": string (portfolio or personal site),
    "github": string,
    "linkedin": string
  },
  "summary": string (professional summary or objective paragraph),
  "experience": [
    {
      "position": string,
      "company": string,
      "startDate": string (e.g. "Jan 2022" or "2021"),
      "endDate": string (e.g. "Present" or "Dec 2023"),
      "description": string (bullet points of achievements/responsibilities, each line starting with "• ")
    }
  ],
  "education": [
    {
      "institution": string,
      "degree": string (e.g. "Bachelor of Science"),
      "fieldOfStudy": string (e.g. "Computer Science"),
      "startDate": string,
      "endDate": string,
      "description": string (honors, GPA, coursework)
    }
  ],
  "projects": [
    {
      "name": string,
      "technologies": string (comma-separated tech stack, e.g. "React, Node.js, Tailwind"),
      "link": string,
      "startDate": string,
      "description": string (multi-line bullet points starting with "• ". E.g. "• Developed responsive website...\n• Implemented features...\n• Tech Stack: HTML, CSS")
    }
  ],
  "skills": [
    {
      "category": string (e.g. "Languages", "Frameworks & Tools", "Cloud & DevOps", or "Core Competencies"),
      "skills": string (comma-separated list of skills, e.g. "JavaScript, Python, React, Docker")
    }
  ],
  "languages": [
    {
      "language": string,
      "proficiency": string (e.g. "Native", "Fluent", "Conversational", "Professional")
    }
  ],
  "certificates": [
    {
      "name": string (certification, credential, award, achievement, research paper, or publication title),
      "link": string (credential verification link or URL if found in text or under EMBEDDED HYPERLINKS, else empty string),
      "description": string (details, co-authored description, publication citation, summary, or description if any, else empty string)
    }
  ]
}

SPECIAL INSTRUCTIONS:
- For project descriptions and work experience descriptions, ALWAYS format achievements as clean multi-line bullet points where each bullet starts with "• ".
- If a project contains tech stack details, include it as a bullet point (e.g. "• Tech Stack: HTML, CSS").
- Include ALL items from "Achievements & Certifications", "Certifications", "Awards & Honors", "Research Papers", and "Publications" in the "certificates" array.
- For items like research papers, awards, or achievements that have subtitles or descriptions (such as "Co-authored a Research Paper titled..."), put the title (e.g. "Research Paper") in "name" and the full text/details in "description".
- Extract all credential URLs, Coursera/Credly/Google/AWS/Udemy certificates links, GitHub project links, and portfolios.
- If URLs are found in the document (including those listed under [EMBEDDED HYPERLINKS & VERIFICATION URLS IN PDF]), carefully associate each URL with its corresponding certification, project, or personalInfo website/github/linkedin field.

RESUME TEXT TO PARSE:
${rawText.slice(0, 15000)}`;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL || 'gemini-3.5-flash-lite',
        contents: PARSER_PROMPT,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
          maxOutputTokens: 4096,
        }
      });

      const text = response.text;
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch (e) {
        const match = text.match(/\{[\s\S]*\}/);
        if (!match) throw new Error('Could not parse AI response as JSON');
        parsed = JSON.parse(match[0]);
      }

      return formatIntoResumeCraftSchema(parsed, originalFilename);
    } catch (aiErr) {
      console.warn('Gemini AI resume parsing failed or timed out, falling back to heuristic parser:', aiErr.message);
      return heuristicParseResume(rawText, originalFilename);
    }
  }

  // Fallback if no AI key configured
  return heuristicParseResume(rawText, originalFilename);
}

/**
 * Normalizes any structured resume object into ResumeCraft's exact Mongoose schema
 */
function formatIntoResumeCraftSchema(data, originalFilename = 'Imported Resume') {
  const cleanFilename = originalFilename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
  const title = data.title || (data.personalInfo?.name ? `${data.personalInfo.name}'s Resume` : cleanFilename) || 'Imported Resume';

  const personalInfo = {
    name: data.personalInfo?.name || '',
    title: data.personalInfo?.title || '',
    email: data.personalInfo?.email || '',
    phone: data.personalInfo?.phone || '',
    location: data.personalInfo?.location || '',
    website: data.personalInfo?.website || '',
    github: data.personalInfo?.github || '',
    linkedin: data.personalInfo?.linkedin || ''
  };

  const styles = {
    fontFamily: 'EB Garamond',
    nameFontFamily: 'same-as-body',
    fontSize: '14px',
    marginY: '24px',
    marginX: '24px',
    sectionSpacing: '16px',
    itemSpacing: '8px',
    primaryColor: '#0f172a',
    template: 'classic'
  };

  function normalizeBulletDescription(desc) {
    if (!desc) return '';
    const raw = Array.isArray(desc) ? desc.join('\n') : String(desc);
    return raw
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(Boolean)
      .map(l => {
        const clean = l.replace(/^[•\-\*\u2022\u2023\u25E6\u2043\u2219]\s*/, '').trim();
        return clean ? `• ${clean}` : '';
      })
      .filter(Boolean)
      .join('\n');
  }

  // Convert array items ensuring each has a unique string id
  const experienceItems = (Array.isArray(data.experience) ? data.experience : []).map(item => ({
    id: item.id || generateId(),
    position: item.position || '',
    company: item.company || '',
    startDate: item.startDate || '',
    endDate: item.endDate || '',
    description: normalizeBulletDescription(item.description)
  }));

  const educationItems = (Array.isArray(data.education) ? data.education : []).map(item => ({
    id: item.id || generateId(),
    institution: item.institution || '',
    degree: item.degree || '',
    fieldOfStudy: item.fieldOfStudy || '',
    startDate: item.startDate || '',
    endDate: item.endDate || '',
    description: item.description || ''
  }));

  const projectItems = (Array.isArray(data.projects) ? data.projects : []).map(item => ({
    id: item.id || generateId(),
    name: item.name || '',
    technologies: item.technologies || '',
    link: item.link || '',
    startDate: item.startDate || '',
    description: normalizeBulletDescription(item.description)
  }));

  const skillItems = (Array.isArray(data.skills) ? data.skills : []).map(item => ({
    id: item.id || generateId(),
    category: item.category || 'Skills',
    skills: item.skills || (Array.isArray(item.list) ? item.list.join(', ') : '') || ''
  }));

  const languageItems = (Array.isArray(data.languages) ? data.languages : []).map(item => ({
    id: item.id || generateId(),
    language: item.language || '',
    proficiency: item.proficiency || ''
  }));

  const certificateItems = (Array.isArray(data.certificates) ? data.certificates : []).map(item => ({
    id: item.id || generateId(),
    name: item.name || '',
    link: item.link || item.url || '',
    description: item.description || ''
  }));

  const summaryText = typeof data.summary === 'string' ? data.summary : '';

  const sections = [
    {
      id: 'summary',
      name: 'Professional Summary',
      visible: !!summaryText.trim(),
      type: 'text',
      text: summaryText
    },
    {
      id: 'experience',
      name: 'Work Experience',
      visible: true,
      type: 'list',
      items: experienceItems
    },
    {
      id: 'education',
      name: 'Education',
      visible: true,
      type: 'list',
      items: educationItems
    },
    {
      id: 'projects',
      name: 'Projects',
      visible: projectItems.length > 0,
      type: 'list',
      items: projectItems
    },
    {
      id: 'skills',
      name: 'Skills',
      visible: skillItems.length > 0,
      type: 'skills',
      items: skillItems
    },
    {
      id: 'languages',
      name: 'Languages',
      visible: languageItems.length > 0,
      type: 'languages',
      items: languageItems
    },
    {
      id: 'certificates',
      name: 'Certifications',
      visible: certificateItems.length > 0,
      type: 'list',
      items: certificateItems
    }
  ];

  return {
    title,
    content: {
      personalInfo,
      styles,
      sections
    }
  };
}

module.exports = {
  extractTextFromFile,
  parseResumeWithAI,
  heuristicParseResume,
  formatIntoResumeCraftSchema
};
