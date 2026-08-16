const SECTION_LABELS = {
  summary: 'Professional Summary',
  experience: 'Work Experience',
  education: 'Education',
  projects: 'Projects',
  skills: 'Skills',
  languages: 'Languages',
  certificates: 'Certifications',
};

function extractTextFromItems(items = [], sectionId) {
  const lines = [];
  for (const item of items) {
    if (!item) continue;
    if (sectionId === 'experience') {
      const parts = [];
      if (item.company) parts.push(item.company);
      if (item.position) parts.push(item.position);
      if (item.startDate || item.endDate) parts.push(`${item.startDate || ''} - ${item.endDate || ''}`);
      if (parts.length) lines.push(parts.join(' | '));
      if (item.description) lines.push(item.description);
    } else if (sectionId === 'education') {
      const parts = [];
      if (item.institution) parts.push(item.institution);
      if (item.degree) parts.push(item.degree);
      if (item.fieldOfStudy) parts.push(item.fieldOfStudy);
      if (item.startDate || item.endDate) parts.push(`${item.startDate || ''} - ${item.endDate || ''}`);
      if (parts.length) lines.push(parts.join(' | '));
      if (item.description) lines.push(item.description);
    } else if (sectionId === 'projects') {
      const parts = [];
      if (item.name) parts.push(item.name);
      if (item.technologies) parts.push(`Technologies: ${item.technologies}`);
      if (item.startDate) parts.push(item.startDate);
      if (parts.length) lines.push(parts.join(' | '));
      if (item.description) lines.push(item.description);
      if (item.link) lines.push(`Link: ${item.link}`);
    } else if (sectionId === 'certificates') {
      if (item.name) lines.push(item.name);
      if (item.link) lines.push(`Link: ${item.link}`);
      if (item.description) lines.push(item.description);
    } else if (sectionId === 'skills' || sectionId === 'languages') {
      const label = item.category ? `${item.category}: ` : '';
      if (item.skills) lines.push(`${label}${item.skills}`);
    }
  }
  return lines;
}

function extractStylesSummary(styles = {}) {
  const parts = [];
  if (styles.fontFamily) parts.push(`Font: ${styles.fontFamily}`);
  if (styles.fontSize) parts.push(`Font size: ${styles.fontSize}`);
  if (styles.marginY) parts.push(`Vertical margin: ${styles.marginY}`);
  if (styles.marginX) parts.push(`Horizontal margin: ${styles.marginX}`);
  if (styles.sectionSpacing) parts.push(`Section spacing: ${styles.sectionSpacing}`);
  if (styles.itemSpacing) parts.push(`Item spacing: ${styles.itemSpacing}`);
  if (styles.template) parts.push(`Template: ${styles.template}`);
  return parts.length ? `\n[Formatting]\n${parts.join('; ')}` : '';
}

function resumeToText(resume) {
  const lines = [];
  const content = resume.content || {};

  // Personal info
  const pi = content.personalInfo || {};
  if (pi.name) lines.push(`Name: ${pi.name}`);
  if (pi.title) lines.push(`Title: ${pi.title}`);
  if (pi.email) lines.push(`Email: ${pi.email}`);
  if (pi.phone) lines.push(`Phone: ${pi.phone}`);
  if (pi.location) lines.push(`Location: ${pi.location}`);
  if (pi.website) lines.push(`Website: ${pi.website}`);
  if (pi.github) lines.push(`GitHub: ${pi.github}`);
  if (pi.linkedin) lines.push(`LinkedIn: ${pi.linkedin}`);

  // Sections
  const sections = content.sections || [];
  for (const section of sections) {
    if (!section.visible) continue;
    const label = SECTION_LABELS[section.id] || section.name;
    if (section.type === 'text' && section.text) {
      lines.push(`\n${label}`);
      lines.push(section.text);
    } else if ((section.type === 'list' || section.type === 'skills' || section.type === 'languages') && section.items?.length) {
      lines.push(`\n${label}`);
      const itemLines = extractTextFromItems(section.items, section.id);
      lines.push(...itemLines);
    }
  }

  // Styles summary for formatting audit
  if (content.styles) {
    lines.push(extractStylesSummary(content.styles));
  }

  return lines.filter(Boolean).join('\n');
}

module.exports = { resumeToText };