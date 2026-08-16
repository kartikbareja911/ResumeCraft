const { GoogleGenAI } = require('@google/genai');
const { GEMINI_API_KEY, GEMINI_MODEL } = require('../config');

const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

const SYSTEM_PROMPT = `You are an expert ATS (Applicant Tracking System) analyzer and career coach. 
Given a resume text and a target job description, evaluate the resume for ATS compatibility and provide actionable feedback.

Return ONLY a valid JSON object with this exact structure:
{
  "overallScore": number (0-100),
  "sections": {
    "keywords": { "score": number, "notes": string },
    "impact": { "score": number, "notes": string },
    "completeness": { "score": number, "notes": string }
  },
  "matchedKeywords": string[],
  "missingKeywords": string[],
  "formattingIssues": [ { "severity": "high"|"medium"|"low", "note": string } ],
  "suggestions": [ { "priority": "high"|"medium"|"low", "text": string } ]
}

Guidelines:
- overallScore: weighted aggregate (keywords 40%, impact 30%, completeness 20%, formatting 10%)
- keywords: keyword density & relevance to job description
- impact: quantified achievements, action verbs, results-oriented language
- completeness: all standard sections present, no critical gaps
- matchedKeywords: keywords from JD found in resume
- missingKeywords: important JD keywords absent from resume
- formattingIssues: font choices, margins, section structure, tables/columns that break ATS parsers
- suggestions: prioritized, specific, actionable improvements

Be strict but fair. If resume is empty or minimal, score accordingly.`;

const STOPWORDS = new Set([
  'and', 'the', 'for', 'with', 'you', 'will', 'are', 'this', 'that', 'from', 'have',
  'our', 'your', 'about', 'more', 'their', 'they', 'what', 'which', 'who', 'whom',
  'can', 'all', 'into', 'some', 'such', 'than', 'them', 'then', 'these', 'were',
  'been', 'being', 'having', 'should', 'would', 'could', 'must', 'shall', 'work',
  'role', 'team', 'company', 'experience', 'year', 'years', 'skills', 'ability',
  'responsibilities', 'qualifications', 'requirements', 'preferred', 'plus', 'job',
  'description', 'opportunity', 'looking', 'join', 'candidate', 'position'
]);

const ACTION_VERBS = [
  'developed', 'built', 'designed', 'architected', 'led', 'managed', 'deployed',
  'created', 'implemented', 'optimized', 'reduced', 'increased', 'improved',
  'engineered', 'maintained', 'integrated', 'refactored', 'spearheaded', 'executed',
  'automated', 'authored', 'established', 'delivered', 'collaborated', 'scaled'
];

function runLocalHeuristicScan({ resumeText, jobDescription }) {
  const resumeLower = resumeText.toLowerCase();
  const jdLower = jobDescription.toLowerCase();

  // 1. Extract potential keywords from Job Description
  const rawJdWords = jdLower
    .replace(/[^\w\s\+#\.\-]/g, ' ')
    .split(/\s+/)
    .map(w => w.trim())
    .filter(w => w.length >= 2 && !STOPWORDS.has(w) && !/^\d+$/.test(w));

  // Count word frequencies to find significant keywords
  const freq = {};
  for (const w of rawJdWords) {
    freq[w] = (freq[w] || 0) + 1;
  }

  // Also check common tech stacks & multi-word terms
  const commonTech = [
    'javascript', 'typescript', 'react', 'node.js', 'nodejs', 'express', 'mongodb',
    'python', 'java', 'c++', 'c#', 'sql', 'nosql', 'postgresql', 'mysql', 'docker',
    'kubernetes', 'aws', 'azure', 'gcp', 'ci/cd', 'git', 'github', 'rest', 'api',
    'graphql', 'html', 'css', 'tailwind', 'redux', 'next.js', 'nextjs', 'system design',
    'agile', 'scrum', 'data structures', 'algorithms', 'microservices', 'unit testing'
  ];

  const matchedKeywords = new Set();
  const missingKeywords = new Set();

  for (const tech of commonTech) {
    if (jdLower.includes(tech)) {
      if (resumeLower.includes(tech)) {
        matchedKeywords.add(tech.charAt(0).toUpperCase() + tech.slice(1));
      } else {
        missingKeywords.add(tech.charAt(0).toUpperCase() + tech.slice(1));
      }
    }
  }

  // Sort top JD keywords by frequency
  const sortedJdWords = Object.keys(freq).sort((a, b) => freq[b] - freq[a]);
  for (const w of sortedJdWords.slice(0, 15)) {
    const display = w.charAt(0).toUpperCase() + w.slice(1);
    if (resumeLower.includes(w)) {
      matchedKeywords.add(display);
    } else {
      if (missingKeywords.size < 8) {
        missingKeywords.add(display);
      }
    }
  }

  const matchedList = Array.from(matchedKeywords).slice(0, 12);
  const missingList = Array.from(missingKeywords).slice(0, 8);

  const totalTerms = matchedList.length + missingList.length;
  const keywordScore = totalTerms > 0 ? Math.min(100, Math.round((matchedList.length / totalTerms) * 100)) : 70;

  // 2. Impact & Action Verbs Analysis
  const sentences = resumeText.split(/[\n\.\•]/).map(s => s.trim()).filter(s => s.length > 15);
  let actionVerbCount = 0;
  let metricsCount = 0;

  for (const s of sentences) {
    const sLower = s.toLowerCase();
    if (ACTION_VERBS.some(v => sLower.includes(v))) {
      actionVerbCount++;
    }
    if (/\d+[%kKmM]?|\$\d+/.test(s)) {
      metricsCount++;
    }
  }

  const totalSentences = Math.max(1, sentences.length);
  const verbRatio = actionVerbCount / totalSentences;
  const metricRatio = metricsCount / totalSentences;
  const impactScore = Math.min(100, Math.max(30, Math.round(verbRatio * 50 + metricRatio * 50 + 20)));

  // 3. Completeness & Structural Analysis
  const hasSummary = /summary|profile|about/i.test(resumeText);
  const hasExperience = /experience|work history|employment/i.test(resumeText);
  const hasEducation = /education|degree|university|college|b\.s|b\.tech/i.test(resumeText);
  const hasSkills = /skills|technologies|proficiencies/i.test(resumeText);
  const hasProjects = /projects|portfolio/i.test(resumeText);
  const hasContact = /@|linkedin|github|\+?\d{10}/i.test(resumeText);

  let completenessCount = [hasSummary, hasExperience, hasEducation, hasSkills, hasProjects, hasContact].filter(Boolean).length;
  const completenessScore = Math.min(100, Math.round((completenessCount / 6) * 100));

  // 4. Overall Weighted Score
  const overallScore = Math.min(100, Math.max(20, Math.round(
    keywordScore * 0.40 +
    impactScore * 0.30 +
    completenessScore * 0.20 +
    80 * 0.10 // baseline formatting score
  )));

  // 5. Formatting & Suggestions
  const formattingIssues = [];
  if (resumeText.length > 5000) {
    formattingIssues.push({ severity: 'medium', note: 'Resume length is quite long; aim for a concise 1-page format for standard ATS parsers.' });
  }
  if (!hasContact) {
    formattingIssues.push({ severity: 'high', note: 'Missing key contact information (Email, LinkedIn, or Phone) in header.' });
  }
  if (formattingIssues.length === 0) {
    formattingIssues.push({ severity: 'low', note: 'Clean structure and standard single-column text layout parsable by all modern ATS systems.' });
  }

  const suggestions = [];
  if (missingList.length > 0) {
    suggestions.push({
      priority: 'high',
      text: `Incorporate key missing job requirements: ${missingList.slice(0, 4).join(', ')} into your Skills or Experience bullet points.`
    });
  }
  if (metricRatio < 0.25) {
    suggestions.push({
      priority: 'medium',
      text: 'Add more quantified metrics and business impact results (e.g. "% performance gain", "X users scaled", "$ revenue").'
    });
  }
  if (!hasProjects && !hasExperience) {
    suggestions.push({
      priority: 'high',
      text: 'Add detailed project or work experience entries demonstrating hands-on technical execution.'
    });
  }
  if (suggestions.length === 0) {
    suggestions.push({
      priority: 'low',
      text: 'Strong overall alignment. Tailor your professional summary directly to the target job title.'
    });
  }

  return {
    overallScore,
    sections: {
      keywords: {
        score: keywordScore,
        notes: keywordScore >= 70 
          ? 'Solid keyword overlap with the target job description.' 
          : 'Low keyword match density. Consider including more domain-specific terminology.'
      },
      impact: {
        score: impactScore,
        notes: impactScore >= 70 
          ? 'Strong use of strong action verbs and quantified achievements.' 
          : 'Bullet points could be strengthened with more quantified business impact metrics.'
      },
      completeness: {
        score: completenessScore,
        notes: completenessScore >= 80 
          ? 'All essential resume sections are well-represented.' 
          : 'Some standard resume sections are missing or could be expanded.'
      }
    },
    matchedKeywords: matchedList,
    missingKeywords: missingList,
    formattingIssues,
    suggestions
  };
}

async function runATSScan({ resumeText, jobDescription }) {
  if (!resumeText || !resumeText.trim()) {
    throw new Error('Resume content is empty');
  }
  if (!jobDescription || !jobDescription.trim()) {
    throw new Error('Job description is required');
  }

  if (ai) {
    try {
      const prompt = `${SYSTEM_PROMPT}

=== RESUME ===
${resumeText}

=== JOB DESCRIPTION ===
${jobDescription}

Return the JSON evaluation now.`;

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL || 'gemini-3.5-flash-lite',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
          maxOutputTokens: 2048,
        },
      });

      const text = response.text;

      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch (e) {
        const match = text.match(/\{[\s\S]*\}/);
        if (!match) throw new Error('Failed to parse Gemini response as JSON');
        parsed = JSON.parse(match[0]);
      }

      // Validate required fields
      const required = ['overallScore', 'sections', 'matchedKeywords', 'missingKeywords', 'formattingIssues', 'suggestions'];
      for (const field of required) {
        if (!(field in parsed)) {
          throw new Error(`Gemini response missing required field: ${field}`);
        }
      }

      // Clamp scores
      parsed.overallScore = Math.max(0, Math.min(100, Math.round(parsed.overallScore)));
      for (const key of ['keywords', 'impact', 'completeness']) {
        if (parsed.sections[key]?.score !== undefined) {
          parsed.sections[key].score = Math.max(0, Math.min(100, Math.round(parsed.sections[key].score)));
        }
      }

      return parsed;
    } catch (apiError) {
      console.warn('Gemini API request failed (rate limit/quota/network), falling back to local ATS engine:', apiError.message);
      return runLocalHeuristicScan({ resumeText, jobDescription });
    }
  }

  // Fallback if no Gemini key configured
  return runLocalHeuristicScan({ resumeText, jobDescription });
}

module.exports = { runATSScan };