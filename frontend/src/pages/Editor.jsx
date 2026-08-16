import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import AtsPanel from '../components/AtsPanel';
import UploadResumeModal from '../components/UploadResumeModal';
import { 
  ArrowLeft, Save, Printer, Eye, Palette, 
  ListOrdered, Plus, Trash2, ChevronDown, ChevronUp, 
  Sliders, User, Briefcase, GraduationCap, Award, Sparkles, Check, Download, FileText, UploadCloud, ExternalLink
} from 'lucide-react';

const FONT_CATEGORIES = {
  Serif: [
    'Times New Roman',
    'Lora', 'Source Serif Pro', 'Zilla Slab', 'PT Serif', 'Literata', 
    'EB Garamond', 'Aleo', 'Crimson Pro', 'Cormorant Garamond', 
    'Vollkorn', 'Amiri', 'Crimson Text', 'Alegreya'
  ],
  Sans: [
    'Source Sans Pro', 'Karla', 'Mulish', 'Lato', 'Titillium Web', 
    'Work Sans', 'Barlow', 'Jost', 'Fira Sans', 'Roboto', 'Rubik', 
    'Asap', 'Nunito', 'Open Sans', 'IBM Plex Sans'
  ],
  Mono: [
    'Inconsolata', 'Source Code Pro', 'IBM Plex Mono', 'Overpass Mono', 
    'Space Mono', 'Courier Prime'
  ]
};

const getFontFamilyCSS = (fontName) => {
  if (!fontName || fontName === 'same-as-body') return '"EB Garamond", Garamond, Georgia, serif';
  if (fontName === 'Times New Roman') {
    return '"Times New Roman", Times, serif';
  }
  if (fontName === 'Source Sans Pro') {
    return '"Source Sans 3", sans-serif';
  }
  if (fontName === 'Source Serif Pro') {
    return '"Source Serif 4", serif';
  }
  if (FONT_CATEGORIES.Mono.includes(fontName)) {
    return `"${fontName}", monospace`;
  }
  if (FONT_CATEGORIES.Serif.includes(fontName)) {
    return `"${fontName}", serif`;
  }
  return `"${fontName}", sans-serif`;
};

const isValidDateString = (str) => {
  if (!str) return true;
  const s = str.trim().toLowerCase();
  if (s === 'present' || s === 'current') return true;
  
  const regexes = [
    /^\d{4}$/,
    /^\d{1,2}\/\d{2,4}$/,
    /^(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{2,4}$/i,
    /^(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{2}$/i,
  ];
  return regexes.some(r => r.test(s));
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const parseDateString = (dateStr) => {
  if (!dateStr) return { month: '', year: '', isPresent: false };
  if (dateStr.toLowerCase() === 'present') return { month: '', year: '', isPresent: true };
  
  const slashMatch = dateStr.match(/^(\d{1,2})\/(\d{2,4})$/);
  if (slashMatch) {
    const mNum = parseInt(slashMatch[1], 10);
    const month = MONTHS[mNum - 1] || '';
    let year = slashMatch[2];
    if (year.length === 2) year = '20' + year;
    return { month, year, isPresent: false };
  }
  
  const parts = dateStr.trim().split(/\s+/);
  if (parts.length === 2) {
    const mStr = parts[0].substring(0, 3).toLowerCase();
    const month = MONTHS.find(m => m.toLowerCase().substring(0, 3) === mStr) || '';
    const year = parts[1];
    return { month, year, isPresent: false };
  }
  if (parts.length === 1 && /^\d{4}$/.test(parts[0])) {
    return { month: '', year: parts[0], isPresent: false };
  }
  
  return { month: '', year: '', isPresent: false };
};

const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;

export default function Editor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const [resume, setResume] = useState(null);
  const [showAtsPanel, setShowAtsPanel] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('Saved'); // Saved, Saving, Error
  const [activeTab, setActiveTab] = useState('content'); // content, styles
  const [canvasScale, setCanvasScale] = useState(0.85); // A4 canvas scale factor
  const [autoFitPreview, setAutoFitPreview] = useState(false);
  const [error, setError] = useState('');
  const [sidebarWidth, setSidebarWidth] = useState(390);
  const [previewFont, setPreviewFont] = useState(null);       // live hover preview for body font
  const [previewNameFont, setPreviewNameFont] = useState(null); // live hover preview for name font
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(390);

  const handleDragStart = (e) => {
    isDragging.current = true;
    dragStartX.current = e.clientX;
    dragStartWidth.current = sidebarWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    const onMove = (moveEvent) => {
      if (!isDragging.current) return;
      const delta = moveEvent.clientX - dragStartX.current;
      const newWidth = Math.min(600, Math.max(280, dragStartWidth.current + delta));
      setSidebarWidth(newWidth);
    };
    const onUp = () => {
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  useEffect(() => {
    if (!autoFitPreview) return;

    const fitPreviewToViewport = () => {
      const headerHeight = 64;
      const workspacePadding = 64;
      const dragHandleWidth = 6;
      const availableWidth = window.innerWidth - sidebarWidth - dragHandleWidth - workspacePadding;
      const widthScale = availableWidth / A4_WIDTH_PX;
      const nextScale = Math.min(0.95, Math.max(0.65, widthScale));
      setCanvasScale(Number(nextScale.toFixed(2)));
    };

    fitPreviewToViewport();
    window.addEventListener('resize', fitPreviewToViewport);
    return () => window.removeEventListener('resize', fitPreviewToViewport);
  }, [autoFitPreview, sidebarWidth]);

  const [contentHeight, setContentHeight] = useState(A4_HEIGHT_PX);
  const canvasRef = useRef(null);

  const [darkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : false;
  });

  // Local state copy of resume properties
  const [title, setTitle] = useState('');
  const [personalInfo, setPersonalInfo] = useState({
    name: '',
    title: '',
    email: '',
    phone: '',
    location: '',
    website: '',
    github: '',
    linkedin: ''
  });
  const [styles, setStyles] = useState({
    fontFamily: 'EB Garamond',
    nameFontFamily: 'same-as-body',
    fontSize: '14px',
    marginY: '24px',
    marginX: '24px',
    sectionSpacing: '16px',
    itemSpacing: '8px',
    primaryColor: '#0f172a',
    template: 'classic'
  });
  const [sections, setSections] = useState([]);

  const contentRef = useRef(null);

  useEffect(() => {
    const measureHeight = () => {
      const contentEl = contentRef.current || document.getElementById('resume-canvas-content-root');
      if (!contentEl) return;
      const padY = parseInt(styles.marginY) || 24;
      const totalNaturalHeight = contentEl.scrollHeight + (padY * 2);
      setContentHeight(totalNaturalHeight);
    };

    measureHeight();
    const contentEl = contentRef.current || document.getElementById('resume-canvas-content-root');
    if (contentEl) {
      const observer = new ResizeObserver(measureHeight);
      observer.observe(contentEl);
      return () => observer.disconnect();
    }
  }, [sections, personalInfo, styles, previewFont, previewNameFont]);

  // Strictly 1 page if content fits within standard A4 height with tolerance
  const pageCount = contentHeight <= A4_HEIGHT_PX + 25 
    ? 1 
    : Math.max(1, Math.ceil(contentHeight / A4_HEIGHT_PX));

  // Fetch Resume Data on load
  useEffect(() => {
    const fetchResume = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/resumes/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setResume(data);
          setTitle(data.title);
          
          const content = data.content || {};
          if (content.personalInfo) setPersonalInfo(content.personalInfo);
          if (content.styles) {
            setStyles({ 
              ...styles, 
              ...content.styles, 
              template: content.styles.template || 'classic',
              fontFamily: content.styles.fontFamily || 'Inter',
              nameFontFamily: content.styles.nameFontFamily || 'same-as-body'
            });
          }
          const defaultSections = [
            { id: 'summary', name: 'Professional Summary', visible: true, type: 'text', text: '' },
            { id: 'experience', name: 'Work Experience', visible: true, type: 'list', items: [] },
            { id: 'education', name: 'Education', visible: true, type: 'list', items: [] },
            { id: 'projects', name: 'Projects', visible: true, type: 'list', items: [] },
            { id: 'skills', name: 'Skills', visible: true, type: 'skills', items: [] },
            { id: 'languages', name: 'Languages', visible: true, type: 'languages', items: [] },
            { id: 'certificates', name: 'Certifications', visible: true, type: 'list', items: [] }
          ];
          const loadedSections = content.sections || [];
          const mergedSections = defaultSections.map(defSec => {
            const found = loadedSections.find(s => s.id === defSec.id);
            return found ? { ...defSec, ...found } : defSec;
          });
          setSections(mergedSections);
        } else {
          setError('Could not load the resume details.');
        }
      } catch (err) {
        console.error(err);
        setError('Network error fetching resume details.');
      } finally {
        setLoading(false);
      }
    };
    fetchResume();
  }, [id, token]);

  const handleImportSuccess = (updatedData) => {
    if (!updatedData) return;
    setResume(updatedData);
    if (updatedData.title) setTitle(updatedData.title);
    const content = updatedData.content || {};
    if (content.personalInfo) setPersonalInfo(content.personalInfo);
    if (content.styles) {
      setStyles(prev => ({
        ...prev,
        ...content.styles,
        template: content.styles.template || prev.template || 'classic',
        fontFamily: content.styles.fontFamily || prev.fontFamily || 'Inter',
        nameFontFamily: content.styles.nameFontFamily || prev.nameFontFamily || 'same-as-body'
      }));
    }
    const defaultSections = [
      { id: 'summary', name: 'Professional Summary', visible: true, type: 'text', text: '' },
      { id: 'experience', name: 'Work Experience', visible: true, type: 'list', items: [] },
      { id: 'education', name: 'Education', visible: true, type: 'list', items: [] },
      { id: 'projects', name: 'Projects', visible: true, type: 'list', items: [] },
      { id: 'skills', name: 'Skills', visible: true, type: 'skills', items: [] },
      { id: 'languages', name: 'Languages', visible: true, type: 'languages', items: [] },
      { id: 'certificates', name: 'Certifications', visible: true, type: 'list', items: [] }
    ];
    const loadedSections = content.sections || [];
    const mergedSections = defaultSections.map(defSec => {
      const found = loadedSections.find(s => s.id === defSec.id);
      return found ? { ...defSec, ...found } : defSec;
    });
    setSections(mergedSections);
    setSaveStatus('Saved');
  };

  // Handle saving to database
  const handleSave = async (silent = false) => {
    if (!silent) setSaveStatus('Saving');
    try {
      const response = await fetch(`/api/resumes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          content: {
            personalInfo,
            styles,
            sections
          }
        })
      });
      if (response.ok) {
        setSaveStatus('Saved');
      } else {
        setSaveStatus('Error');
      }
    } catch (err) {
      console.error(err);
      setSaveStatus('Error');
    }
  };

  // Debounced auto-save
  useEffect(() => {
    if (loading || !resume) return;
    const delayDebounceFn = setTimeout(() => {
      handleSave(true);
    }, 1500);

    return () => clearTimeout(delayDebounceFn);
  }, [title, personalInfo, styles, sections]);

  // General field handlers
  const handlePersonalInfoChange = (field, val) => {
    setPersonalInfo(prev => ({ ...prev, [field]: val }));
    setSaveStatus('Unsaved Changes');
  };

  const handleStyleChange = (field, val) => {
    setStyles(prev => ({ ...prev, [field]: val }));
    setSaveStatus('Unsaved Changes');
  };

  // List section CRUD (Experience / Education)
  const addListItem = (sectionId) => {
    setSections(prev => prev.map(sec => {
      if (sec.id === sectionId) {
        let newItem;
        if (sectionId === 'education') {
          newItem = { id: Date.now().toString(), institution: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '', description: '' };
        } else if (sectionId === 'projects') {
          newItem = { id: Date.now().toString(), name: '', technologies: '', link: '', startDate: '', description: '' };
        } else if (sectionId === 'certificates') {
          newItem = { id: Date.now().toString(), name: '', link: '', description: '' };
        } else {
          newItem = { id: Date.now().toString(), company: '', position: '', startDate: '', endDate: '', description: '' };
        }
        return {
          ...sec,
          items: [...(sec.items || []), newItem]
        };
      }
      return sec;
    }));
    setSaveStatus('Unsaved Changes');
  };

  const updateListItem = (sectionId, itemId, field, val) => {
    setSections(prev => prev.map(sec => {
      if (sec.id === sectionId) {
        return {
          ...sec,
          items: sec.items.map(item => item.id === itemId ? { ...item, [field]: val } : item)
        };
      }
      return sec;
    }));
    setSaveStatus('Unsaved Changes');
  };

  const deleteListItem = (sectionId, itemId) => {
    setSections(prev => prev.map(sec => {
      if (sec.id === sectionId) {
        return {
          ...sec,
          items: sec.items.filter(item => item.id !== itemId)
        };
      }
      return sec;
    }));
    setSaveStatus('Unsaved Changes');
  };

  // Skill Section CRUD
  const addSkillCategory = (sectionId) => {
    setSections(prev => prev.map(sec => {
      if (sec.id === sectionId) {
        return {
          ...sec,
          items: [...(sec.items || []), { id: Date.now().toString(), category: '', skills: '' }]
        };
      }
      return sec;
    }));
    setSaveStatus('Unsaved Changes');
  };

  const updateSkillItem = (sectionId, itemId, field, val) => {
    setSections(prev => prev.map(sec => {
      if (sec.id === sectionId) {
        return {
          ...sec,
          items: sec.items.map(item => item.id === itemId ? { ...item, [field]: val } : item)
        };
      }
      return sec;
    }));
    setSaveStatus('Unsaved Changes');
  };

  const deleteSkillItem = (sectionId, itemId) => {
    setSections(prev => prev.map(sec => {
      if (sec.id === sectionId) {
        return {
          ...sec,
          items: sec.items.filter(item => item.id !== itemId)
        };
      }
      return sec;
    }));
    setSaveStatus('Unsaved Changes');
  };

  // Text Section CRUD (Summary)
  const handleTextChange = (sectionId, val) => {
    setSections(prev => prev.map(sec => {
      if (sec.id === sectionId) {
        return { ...sec, text: val };
      }
      return sec;
    }));
    setSaveStatus('Unsaved Changes');
  };

  // Toggle Visibility of Sections
  const toggleSectionVisibility = (sectionId) => {
    setSections(prev => prev.map(sec => {
      if (sec.id === sectionId) {
        return { ...sec, visible: !sec.visible };
      }
      return sec;
    }));
    setSaveStatus('Unsaved Changes');
  };

  // Direct Client-side PDF Download with dynamic multi-page slicing
  const handleDownload = async () => {
    // Save first to be up to date
    handleSave(true);
    
    const element = document.getElementById('resume-canvas-print-target');
    if (!element) return;
    
    const exportNode = element.cloneNode(true);
    exportNode.removeAttribute('id');
    exportNode.classList.remove('absolute', 'transition-all');
    exportNode.style.transform = 'none';
    exportNode.style.position = 'static';
    exportNode.style.left = 'auto';
    exportNode.style.top = 'auto';
    exportNode.style.width = '210mm';
    exportNode.style.height = 'auto';
    exportNode.style.minHeight = '297mm';
    exportNode.style.maxHeight = 'none';
    exportNode.style.margin = '0';
    exportNode.style.boxShadow = 'none';
    exportNode.style.overflow = 'visible';

    // Remove any visual page guide overlays from the cloned node
    const guides = exportNode.querySelectorAll('.page-guide-line');
    guides.forEach(g => g.remove());

    const exportHost = document.createElement('div');
    exportHost.style.position = 'fixed';
    exportHost.style.left = '-10000px';
    exportHost.style.top = '0';
    exportHost.style.width = '210mm';
    exportHost.style.overflow = 'visible';
    exportHost.style.background = '#ffffff';
    exportHost.appendChild(exportNode);
    document.body.appendChild(exportHost);
    
    try {
      const canvas = await html2canvas(exportNode, {
        scale: 2,
        useCORS: true,
        logging: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: exportNode.scrollWidth,
        windowHeight: exportNode.scrollHeight,
      });

      const pdf = new jsPDF({
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait',
        compress: true,
      });

      const pageCanvasHeight = Math.round(canvas.width * (297 / 210));
      const totalPages = Math.max(1, Math.ceil((canvas.height - 10) / pageCanvasHeight));

      for (let p = 0; p < totalPages; p++) {
        if (p > 0) {
          pdf.addPage('a4', 'portrait');
        }

        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = pageCanvasHeight;
        const ctx = pageCanvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

        const sourceY = p * pageCanvasHeight;
        const sourceHeight = Math.min(pageCanvasHeight, canvas.height - sourceY);

        if (sourceHeight > 0) {
          ctx.drawImage(
            canvas,
            0, sourceY, canvas.width, sourceHeight,
            0, 0, canvas.width, sourceHeight
          );
        }

        const pageImg = pageCanvas.toDataURL('image/jpeg', 0.98);
        pdf.addImage(pageImg, 'JPEG', 0, 0, 210, 297);
      }

      // Add interactive clickable hyperlinks for all <a> tags across all pages
      const exportRect = exportNode.getBoundingClientRect();
      const anchors = exportNode.querySelectorAll('a[href]');
      
      anchors.forEach((a) => {
        const rawHref = a.getAttribute('href');
        if (!rawHref) return;
        const url = rawHref.startsWith('http') || rawHref.startsWith('mailto:') ? rawHref : `https://${rawHref}`;
        
        const aRect = a.getBoundingClientRect();
        const relX = aRect.left - exportRect.left;
        const relY = aRect.top - exportRect.top;
        const widthPx = aRect.width;
        const heightPx = aRect.height;
        
        // Convert pixels to millimeters (A4 width = 210mm)
        const scaleToMm = 210 / exportNode.offsetWidth;
        const xMm = relX * scaleToMm;
        const yTotalMm = relY * scaleToMm;
        const wMm = Math.max(widthPx * scaleToMm, 2);
        const hMm = Math.max(heightPx * scaleToMm, 2);
        
        const pageIndex = Math.floor(yTotalMm / 297);
        const yPageMm = yTotalMm - (pageIndex * 297);
        
        if (pageIndex >= 0 && pageIndex < totalPages) {
          pdf.setPage(pageIndex + 1);
          pdf.link(xMm, yPageMm, wMm, hMm, { url });
        }
      });

      pdf.save(`${title || 'resume'}.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
    } finally {
      document.body.removeChild(exportHost);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-400 font-medium">Loading workspace...</p>
      </div>
    );
  }

  if (error || !resume) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="glass-premium p-8 rounded-2xl text-center max-w-md">
          <p className="text-rose-400 font-medium">{error || 'Resume not found.'}</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="mt-6 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-850"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const editorShellClass = darkMode ? 'workspace-shell text-slate-100' : 'app-shell text-slate-900';
  const headerClass = darkMode
    ? 'border-teal-300/15 bg-slate-950/82 text-slate-100 shadow-lg shadow-teal-950/20'
    : 'border-white/80 bg-white/82 text-slate-900 shadow-sm shadow-slate-200/80';
  const ghostButtonClass = darkMode
    ? 'border-teal-300/15 bg-slate-900/72 text-slate-100 shadow-sm shadow-black/20 hover:border-teal-300/35 hover:bg-slate-800/90 hover:text-white'
    : 'border-slate-200 bg-white text-slate-600 shadow-sm shadow-slate-200/70 hover:bg-slate-50 hover:text-slate-950';
  const sidebarClass = darkMode
    ? 'border-teal-300/15 bg-slate-950/92 text-slate-100 shadow-2xl shadow-teal-950/25'
    : 'border-slate-200 bg-white/88 text-slate-900 shadow-xl shadow-slate-300/30';
  const tabWrapClass = darkMode
    ? 'border-teal-300/15 bg-slate-900/55'
    : 'border-slate-200 bg-slate-100/80';
  const tabClass = (tab) => `flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
    activeTab === tab
      ? darkMode
        ? 'bg-gradient-to-r from-teal-300 to-emerald-300 text-slate-950 shadow-lg shadow-teal-950/30'
        : 'bg-slate-950 text-white shadow-md shadow-slate-300'
      : darkMode
        ? 'text-slate-300 hover:bg-teal-300/10 hover:text-teal-50'
        : 'text-slate-500 hover:text-slate-950 hover:bg-white'
  }`;
  const panelClass = darkMode
    ? 'rounded-2xl border border-teal-300/15 bg-slate-900/62 p-4 shadow-lg shadow-black/20 backdrop-blur'
    : 'rounded-2xl border border-slate-200 bg-white p-4 shadow-lg shadow-slate-200/70';
  const inputClass = darkMode
    ? 'w-full rounded-lg border border-slate-600/80 bg-slate-950/55 px-3 py-2 text-xs text-slate-50 placeholder-slate-500 shadow-inner shadow-black/10 transition focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-300/20 mt-1.5'
    : 'w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 transition focus:border-teal-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-100 mt-1.5';
  const labelClass = darkMode
    ? 'text-[10px] font-bold uppercase text-slate-300'
    : 'text-[10px] font-bold uppercase text-slate-500';
  const headingTextClass = darkMode ? 'text-white' : 'text-slate-950';
  const mutedTextClass = darkMode ? 'text-slate-300' : 'text-slate-500';
  const subMutedTextClass = darkMode ? 'text-slate-400' : 'text-slate-400';
  const iconBadgeClass = darkMode
    ? 'flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-300/18 to-amber-300/12 text-teal-100 ring-1 ring-teal-200/20'
    : 'flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700 ring-1 ring-teal-100';
  const sectionIconClass = darkMode ? 'w-4 h-4 text-teal-100' : 'w-4 h-4 text-teal-700';
  const itemCardClass = darkMode
    ? 'rounded-xl border border-teal-300/12 bg-slate-950/48 p-3.5 space-y-3 relative group shadow-sm shadow-black/20'
    : 'rounded-xl border border-slate-200 bg-slate-50/90 p-3.5 space-y-3 relative group shadow-sm shadow-slate-200/80';
  const deleteButtonClass = darkMode
    ? 'absolute top-2.5 right-2.5 rounded-md p-1.5 text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-300'
    : 'absolute top-2.5 right-2.5 rounded-md p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600';
  const addButtonClass = darkMode
    ? 'w-full flex items-center justify-center gap-1.5 py-2.5 border border-dashed border-teal-300/35 rounded-xl text-xs text-teal-100 hover:text-slate-950 hover:bg-gradient-to-r hover:from-teal-300 hover:to-emerald-300 hover:border-transparent transition-all font-bold'
    : 'w-full flex items-center justify-center gap-1.5 py-2.5 border border-dashed border-teal-300 rounded-xl text-xs text-teal-700 hover:text-teal-900 hover:bg-teal-50 hover:border-teal-500 transition-all font-bold';
  const templatePreviewClass = darkMode
    ? 'h-10 w-full bg-slate-950/62 border border-teal-300/12 rounded-lg flex gap-1.5 p-1.5 mt-1'
    : 'h-10 w-full bg-white border border-slate-200 rounded-lg flex gap-1.5 p-1.5 mt-1';

  const renderBulletDescription = (description) => {
    if (!description) return null;
    const lines = description
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(Boolean);

    if (lines.length === 0) return null;

    return (
      <ul className="space-y-1 mt-1 text-[0.88em] text-slate-950 leading-relaxed">
        {lines.map((line, idx) => {
          const cleanLine = line.replace(/^[•\-\*\u2022\u2023\u25E6\u2043\u2219]\s*/, '').trim();
          if (!cleanLine) return null;

          const isTechStack = /^tech stack\s*:/i.test(cleanLine);

          return (
            <li key={idx} className="flex items-start gap-1.5 pl-0.5">
              <span className="select-none text-[0.9em] leading-tight text-slate-950 font-bold flex-shrink-0">•</span>
              <span className="flex-1 text-justify">
                {isTechStack ? (
                  <>
                    <strong className="font-bold text-slate-950">Tech Stack:</strong>
                    <span>{cleanLine.replace(/^tech stack\s*:\s*/i, ' ')}</span>
                  </>
                ) : (
                  cleanLine
                )}
              </span>
            </li>
          );
        })}
      </ul>
    );
  };

  const renderSection = (sectionId) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section || !section.visible) return null;
    
    return (
      <div key={section.id} className="space-y-2.5 text-[1em]" style={{ marginTop: styles.sectionSpacing }}>
        <h3 
          className="text-[0.95em] font-extrabold uppercase tracking-wider border-b-2 pb-1 text-slate-950 flex items-center gap-1.5"
          style={{ color: styles.primaryColor, borderColor: styles.primaryColor }}
        >
          {section.name}
        </h3>

        {section.id === 'summary' && section.text && (
          <p className="text-[0.9em] text-slate-950 leading-relaxed text-justify">
            {section.text}
          </p>
        )}

        {section.id === 'experience' && (
          <div className="space-y-3" style={{ gap: styles.itemSpacing }}>
            {section.items?.map((item) => (
              <div 
                key={item.id} 
                className="space-y-1"
                style={{ marginTop: styles.itemSpacing }}
              >
                <div className="flex justify-between items-baseline">
                  <span className="text-[0.92em] font-bold text-slate-950">
                    {item.position || 'Position Title'}{item.company ? <span className="font-normal italic text-slate-800">, {item.company}</span> : ''}
                  </span>
                  <span className="text-[0.85em] text-slate-800 font-medium tracking-tight">
                    {item.startDate
                      ? `${item.startDate}${item.endDate ? ` – ${item.endDate}` : item.endDate === '' ? ' – Present' : ''}`
                      : ''}
                  </span>
                </div>
                {renderBulletDescription(item.description)}
              </div>
            ))}
          </div>
        )}

        {section.id === 'education' && (
          <div className="space-y-3" style={{ gap: styles.itemSpacing }}>
            {section.items?.map((item) => (
              <div 
                key={item.id} 
                className="space-y-0.5"
                style={{ marginTop: styles.itemSpacing }}
              >
                <div className="flex justify-between items-baseline">
                  <span className="text-[0.92em] font-bold text-slate-950">
                    {item.degree || 'Degree and Field'}{item.institution ? <span className="font-normal italic text-slate-800">, {item.institution}</span> : ''}
                  </span>
                  <span className="text-[0.85em] text-slate-800 font-medium tracking-tight">
                    {item.startDate
                      ? `${item.startDate}${item.endDate ? ` – ${item.endDate}` : ''}`
                      : ''}
                  </span>
                </div>
                {item.description && (
                  <p className="text-[0.88em] text-slate-950 leading-relaxed whitespace-pre-line pl-1 mt-0.5">
                    {item.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {section.id === 'projects' && (
          <div className="space-y-3" style={{ gap: styles.itemSpacing }}>
            {section.items?.map((item) => (
              <div 
                key={item.id} 
                className="space-y-1"
                style={{ marginTop: styles.itemSpacing }}
              >
                <div className="flex justify-between items-baseline">
                  <span className="text-[0.92em] font-bold text-slate-950 flex items-center gap-1.5">
                    {item.link ? (
                      <a
                        href={item.link.startsWith('http') ? item.link : `https://${item.link}`}
                        target="_blank"
                        rel="noreferrer"
                        className="underline hover:text-indigo-600 transition inline-flex items-center gap-1 group text-slate-950 font-bold"
                      >
                        <span>{item.name || 'Project Name'}</span>
                        <ExternalLink className="w-3 h-3 text-slate-600 group-hover:text-indigo-600 inline flex-shrink-0" />
                      </a>
                    ) : (
                      <span>{item.name || 'Project Name'}</span>
                    )}
                    {item.technologies && <span className="text-[0.85em] font-semibold text-slate-800"> ({item.technologies})</span>}
                  </span>
                  <span className="text-[0.85em] text-slate-800 font-medium tracking-tight">
                    {item.startDate
                      ? `${item.startDate}${item.endDate ? ` – ${item.endDate}` : ''}`
                      : ''}
                  </span>
                </div>
                {renderBulletDescription(item.description)}
              </div>
            ))}
          </div>
        )}

        {section.id === 'skills' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-[0.88em]">
            {section.items?.map((item) => (
              <div key={item.id} className="flex flex-col">
                <span className="font-bold text-slate-950">
                  {item.category || 'Category'}:
                </span>
                <span className="text-slate-950 font-normal leading-snug">
                  {item.skills || 'Comma, separated, skills'}
                </span>
              </div>
            ))}
          </div>
        )}

        {section.id === 'languages' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-[0.88em]">
            {section.items?.map((item) => (
              <div key={item.id} className="flex items-baseline gap-2">
                <span className="font-bold text-slate-950">
                  {item.category || 'Language'}:
                </span>
                <span className="text-slate-950 font-medium">
                  {item.skills || 'Proficiency'}
                </span>
              </div>
            ))}
          </div>
        )}

        {section.id === 'certificates' && (
          <div className="space-y-2" style={{ gap: styles.itemSpacing }}>
            {section.items?.map((item) => (
              <div 
                key={item.id} 
                className="space-y-0.5"
                style={{ marginTop: styles.itemSpacing }}
              >
                <div className="flex items-center gap-1.5">
                  {item.link ? (
                    <a
                      href={item.link.startsWith('http') ? item.link : `https://${item.link}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[0.92em] font-bold text-slate-950 underline hover:text-indigo-600 transition inline-flex items-center gap-1.5 group"
                    >
                      <span>{item.name || 'Certificate Title'}</span>
                      <ExternalLink className="w-3 h-3 text-slate-600 group-hover:text-indigo-600 inline flex-shrink-0" />
                    </a>
                  ) : (
                    <span className="text-[0.92em] font-bold text-slate-950">
                      {item.name || 'Certificate Title'}
                    </span>
                  )}
                </div>
                {item.description && (
                  <p className="text-[0.88em] text-slate-950 leading-relaxed whitespace-pre-line pl-1">
                    {item.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`${editorShellClass} fixed inset-0 flex flex-col overflow-hidden`}>
      {/* Top Header Controls Panel (no-print) */}
      <header className={`h-16 border-b backdrop-blur-xl flex items-center justify-between px-6 z-20 no-print select-none ${headerClass}`}>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className={`p-2 rounded-lg border transition-colors ${ghostButtonClass}`}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setSaveStatus('Unsaved Changes');
              }}
              className={`bg-transparent border-b border-transparent hover:border-slate-400 focus:border-teal-500 focus:outline-none text-lg font-heading font-bold px-1 py-0.5 max-w-[240px] sm:max-w-[320px] transition-all ${headingTextClass}`}
            />
            <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 font-medium ${
              saveStatus === 'Saved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15' :
              saveStatus === 'Saving' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/15' :
              'bg-amber-500/10 text-amber-400 border border-amber-500/15'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                saveStatus === 'Saved' ? 'bg-emerald-400' :
                saveStatus === 'Saving' ? 'bg-indigo-400 animate-ping' :
                'bg-amber-400'
              }`}></span>
              {saveStatus}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Canvas Scale Indicator */}
          <div className={`hidden md:flex items-center gap-2 rounded-lg border px-2.5 py-1 text-xs ${darkMode ? 'border-teal-300/15 bg-slate-900/70 text-slate-300 shadow-sm shadow-black/20' : 'border-slate-200 bg-white text-slate-500 shadow-sm shadow-slate-200/60'}`}>
            <span>Zoom:</span>
            <input 
              type="range" 
              min="0.5" 
              max="1.2" 
              step="0.05" 
              value={canvasScale}
              onChange={(e) => {
                setAutoFitPreview(false);
                setCanvasScale(parseFloat(e.target.value));
              }}
              className="w-16 accent-teal-500 bg-slate-800"
            />
            <span className="w-8 text-right font-mono">{Math.round(canvasScale * 100)}%</span>
            <button
              type="button"
              onClick={() => setAutoFitPreview(true)}
              className={`rounded px-1.5 py-0.5 font-bold transition ${
                autoFitPreview
                  ? darkMode ? 'bg-teal-300/15 text-teal-100' : 'bg-teal-50 text-teal-700'
                  : darkMode ? 'text-slate-400 hover:text-teal-100' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              Fit
            </button>
          </div>

          {/* Dynamic Page Count Indicator */}
          <div 
            className={`hidden sm:flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${
              pageCount === 1 
                ? darkMode ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300' : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : darkMode ? 'border-amber-500/25 bg-amber-500/15 text-amber-300' : 'border-amber-200 bg-amber-50 text-amber-700'
            }`}
            title={pageCount === 1 ? 'Fits on a single page' : 'Spans multiple pages — adjust spacing or margins to fit on 1 page'}
          >
            <span>{pageCount === 1 ? '1 Page' : `${pageCount} Pages`}</span>
          </div>

          <button
            onClick={() => setShowUploadModal(true)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg border text-sm font-semibold transition-all active:translate-y-0.5 ${ghostButtonClass}`}
            title="Upload and parse resume file (PDF, DOCX, TXT)"
          >
            <UploadCloud className="w-4 h-4 text-teal-400" />
            <span>Import</span>
          </button>

          <button
            onClick={() => handleSave(false)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-semibold transition-all active:translate-y-0.5 ${ghostButtonClass}`}
          >
            <Save className="w-4 h-4" />
            <span>Save</span>
          </button>
          
          <button
            onClick={() => setShowAtsPanel(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all active:translate-y-0.5 shadow-lg ${darkMode ? 'bg-gradient-to-r from-teal-400 to-emerald-300 text-slate-950 shadow-teal-950/40 hover:from-teal-300 hover:to-amber-300' : 'bg-teal-600 text-white shadow-teal-950/30 hover:bg-teal-700'}`}
          >
            <Sparkles className="w-4 h-4" />
            <span>ATS Score</span>
          </button>
          
          <button
            onClick={handleDownload}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all active:translate-y-0.5 shadow-lg ${darkMode ? 'bg-gradient-to-r from-teal-400 to-emerald-300 text-slate-950 shadow-teal-950/40 hover:from-teal-300 hover:to-amber-300' : 'bg-teal-600 text-white shadow-teal-950/30 hover:bg-teal-700'}`}
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>
        </div>
      </header>

      {/* Workspace Panel Split */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Control Deck (no-print) */}
        <aside style={{ width: sidebarWidth + 'px', minWidth: '280px', maxWidth: '600px' }} className={`border-r flex flex-col h-full z-10 no-print select-none flex-shrink-0 ${sidebarClass}`}>
          <div className={`px-5 py-4 border-b ${darkMode ? 'border-teal-300/15 bg-gradient-to-r from-teal-300/8 to-amber-300/8' : 'border-slate-200'}`}>
            <p className={`text-[11px] font-bold uppercase ${darkMode ? 'text-teal-100' : 'text-teal-700'}`}>Resume builder</p>
            <div className="mt-1 flex items-center justify-between gap-3">
              <h2 className={`font-heading text-xl font-extrabold ${headingTextClass}`}>Craft the content</h2>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${darkMode ? 'bg-amber-300/10 text-amber-100 ring-1 ring-amber-200/10' : 'bg-slate-100 text-slate-600'}`}>
                {sections.filter((section) => section.visible).length}/{sections.length} active
              </span>
            </div>
          </div>
          {/* Deck Navigation Tabs */}
          <div className={`flex border-b p-2 gap-1 ${tabWrapClass}`}>
            <button
              onClick={() => setActiveTab('templates')}
              className={tabClass('templates')}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Templates
            </button>
            <button
              onClick={() => setActiveTab('content')}
              className={tabClass('content')}
            >
              <User className="w-3.5 h-3.5" />
              Content
            </button>
            <button
              onClick={() => setActiveTab('styles')}
              className={tabClass('styles')}
            >
              <Palette className="w-3.5 h-3.5" />
              Formatting
            </button>
          </div>

          {/* Configuration Scroll Panel */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            
            {/* TAB: CONTENT SECTIONS */}
            {activeTab === 'content' && (
              <>
                {/* Personal Information */}
                <div className={panelClass}>
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <h3 className={`font-heading text-sm font-extrabold flex items-center gap-2 ${headingTextClass}`}>
                        <span className={iconBadgeClass}>
                          <User className="w-4 h-4" />
                        </span>
                        Personal details
                      </h3>
                      <p className={`mt-1 text-[11px] leading-5 ${mutedTextClass}`}>This powers the header and contact area in every template.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className={labelClass}>Full Name</label>
                      <input
                        type="text"
                        value={personalInfo.name}
                        onChange={(e) => handlePersonalInfoChange('name', e.target.value)}
                        className={inputClass}
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className={labelClass}>Job Title</label>
                      <input
                        type="text"
                        value={personalInfo.title}
                        onChange={(e) => handlePersonalInfoChange('title', e.target.value)}
                        className={inputClass}
                        placeholder="Senior Software Engineer"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Email</label>
                      <input
                        type="email"
                        value={personalInfo.email}
                        onChange={(e) => handlePersonalInfoChange('email', e.target.value)}
                        className={inputClass}
                        placeholder="john@example.com"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Phone</label>
                      <input
                        type="text"
                        value={personalInfo.phone}
                        onChange={(e) => handlePersonalInfoChange('phone', e.target.value)}
                        className={inputClass}
                        placeholder="+1 555-0199"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Location</label>
                      <input
                        type="text"
                        value={personalInfo.location}
                        onChange={(e) => handlePersonalInfoChange('location', e.target.value)}
                        className={inputClass}
                        placeholder="San Francisco, CA"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Website</label>
                      <input
                        type="text"
                        value={personalInfo.website}
                        onChange={(e) => handlePersonalInfoChange('website', e.target.value)}
                        className={inputClass}
                        placeholder="johndoe.com"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>GitHub</label>
                      <input
                        type="text"
                        value={personalInfo.github}
                        onChange={(e) => handlePersonalInfoChange('github', e.target.value)}
                        className={inputClass}
                        placeholder="github.com/johndoe"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>LinkedIn</label>
                      <input
                        type="text"
                        value={personalInfo.linkedin}
                        onChange={(e) => handlePersonalInfoChange('linkedin', e.target.value)}
                        className={inputClass}
                        placeholder="linkedin.com/in/johndoe"
                      />
                    </div>
                  </div>
                </div>

                {/* Resume Sections Builders */}
                {sections.map((section) => (
                  <div key={section.id} className={panelClass}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className={iconBadgeClass}>
                          {section.id === 'summary' && <Sliders className={sectionIconClass} />}
                          {section.id === 'experience' && <Briefcase className={sectionIconClass} />}
                          {section.id === 'education' && <GraduationCap className={sectionIconClass} />}
                          {section.id === 'skills' && <Award className={sectionIconClass} />}
                          {section.id === 'projects' && <FileText className={sectionIconClass} />}
                          {section.id === 'languages' && <ListOrdered className={sectionIconClass} />}
                          {section.id === 'certificates' && <Check className={sectionIconClass} />}
                        </span>
                        <div>
                          <span className={`block text-sm font-extrabold font-heading ${headingTextClass}`}>{section.name}</span>
                          <span className={`text-[10px] ${subMutedTextClass}`}>
                            {section.visible ? 'Shown on resume' : 'Hidden from resume'}
                          </span>
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => toggleSectionVisibility(section.id)}
                        aria-pressed={section.visible}
                        title={section.visible ? 'Hide section' : 'Show section'}
                        className={`inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full border p-0.5 transition focus:outline-none focus:ring-2 focus:ring-teal-400/40 ${
                          section.visible
                            ? darkMode
                              ? 'border-teal-300/60 bg-gradient-to-r from-teal-400 to-emerald-300'
                              : 'border-teal-500 bg-teal-500'
                            : darkMode
                              ? 'border-slate-600 bg-slate-800/90'
                              : 'border-slate-300 bg-slate-200'
                        }`}
                      >
                        <span
                          className={`h-6 w-6 rounded-full bg-white shadow-sm ring-1 ring-black/5 transition-transform ${
                            section.visible ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                        <span className="sr-only">{section.visible ? 'Visible' : 'Hidden'}</span>
                      </button>
                    </div>

                    {section.visible && (
                      <div className="mt-4 space-y-4">
                        
                        {/* Text type: Professional Summary */}
                        {section.type === 'text' && (
                          <div>
                            <label className={labelClass}>Summary Description</label>
                            <textarea
                              rows="4"
                              value={section.text || ''}
                              onChange={(e) => handleTextChange(section.id, e.target.value)}
                              className={`${inputClass} resize-none`}
                              placeholder="Describe your career highlights..."
                            />
                          </div>
                        )}

                        {/* List type: Experience / Education */}
                        {section.type === 'list' && (
                          <div className="space-y-4">
                            {section.items?.map((item) => (
                              <div key={item.id} className={itemCardClass}>
                                <button
                                  onClick={() => deleteListItem(section.id, item.id)}
                                  className={deleteButtonClass}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                                
                                {section.id === 'experience' && (
                                  <>
                                    <div>
                                      <label className={labelClass}>Company</label>
                                      <input
                                        type="text"
                                        value={item.company || ''}
                                        onChange={(e) => updateListItem(section.id, item.id, 'company', e.target.value)}
                                        className={inputClass}
                                        placeholder="Google"
                                      />
                                    </div>
                                    <div>
                                      <label className={labelClass}>Position</label>
                                      <input
                                        type="text"
                                        value={item.position || ''}
                                        onChange={(e) => updateListItem(section.id, item.id, 'position', e.target.value)}
                                        className={inputClass}
                                        placeholder="Software Engineer"
                                      />
                                    </div>
                                  </>
                                )}
                                {section.id === 'education' && (
                                  <>
                                    <div>
                                      <label className={labelClass}>Institution / School</label>
                                      <input
                                        type="text"
                                        value={item.institution || ''}
                                        onChange={(e) => updateListItem(section.id, item.id, 'institution', e.target.value)}
                                        className={inputClass}
                                        placeholder="Stanford University"
                                      />
                                    </div>
                                    <div>
                                      <label className={labelClass}>Degree & Major</label>
                                      <input
                                        type="text"
                                        value={item.degree || ''}
                                        onChange={(e) => updateListItem(section.id, item.id, 'degree', e.target.value)}
                                        className={inputClass}
                                        placeholder="B.S. Computer Science"
                                      />
                                    </div>
                                  </>
                                )}
                                {section.id === 'projects' && (
                                  <>
                                    <div>
                                      <label className={labelClass}>Project Name</label>
                                      <input
                                        type="text"
                                        value={item.name || ''}
                                        onChange={(e) => updateListItem(section.id, item.id, 'name', e.target.value)}
                                        className={inputClass}
                                        placeholder="E-Commerce Platform"
                                      />
                                    </div>
                                    <div>
                                      <label className={labelClass}>Technologies</label>
                                      <input
                                        type="text"
                                        value={item.technologies || ''}
                                        onChange={(e) => updateListItem(section.id, item.id, 'technologies', e.target.value)}
                                        className={inputClass}
                                        placeholder="React, Express, MongoDB"
                                      />
                                    </div>
                                    <div>
                                      <label className={labelClass}>Link</label>
                                      <input
                                        type="text"
                                        value={item.link || ''}
                                        onChange={(e) => updateListItem(section.id, item.id, 'link', e.target.value)}
                                        className={inputClass}
                                        placeholder="github.com/username/project"
                                      />
                                    </div>
                                  </>
                                )}
                                {section.id === 'certificates' && (
                                  <>
                                    <div>
                                      <label className={labelClass}>Certificate Title</label>
                                      <input
                                        type="text"
                                        value={item.name || ''}
                                        onChange={(e) => updateListItem(section.id, item.id, 'name', e.target.value)}
                                        className={inputClass}
                                        placeholder="e.g. Introduction to Modern AI"
                                      />
                                    </div>
                                    <div>
                                      <label className={labelClass}>Certificate Link / URL</label>
                                      <input
                                        type="text"
                                        value={item.link || ''}
                                        onChange={(e) => updateListItem(section.id, item.id, 'link', e.target.value)}
                                        className={inputClass}
                                        placeholder="https://coursera.org/verify/... or credly.com"
                                      />
                                    </div>
                                  </>
                                )}

                                {section.id !== 'certificates' && (() => {
                                    const parsedStart = parseDateString(item.startDate);
                                    const parsedEnd = parseDateString(item.endDate);

                                    const handleDateChangeLocal = (field, isMonth, val) => {
                                      const currentVal = item[field] || '';
                                      const parsed = parseDateString(currentVal);
                                      let newMonth = parsed.month;
                                      let newYear = parsed.year;
                                      
                                      if (isMonth) {
                                        newMonth = val;
                                      } else {
                                        newYear = val.replace(/\D/g, '').substring(0, 4); // strictly digits, max 4
                                      }
                                      
                                      const combined = newMonth ? (newYear ? `${newMonth} ${newYear}` : newMonth) : newYear;
                                      updateListItem(section.id, item.id, field, combined);
                                    };

                                    return (
                                      <div className="space-y-3 pt-1">
                                        {/* Start Date */}
                                        <div className="space-y-1.5">
                                          <span className={`${labelClass} block`}>Start Date</span>
                                          <div className="grid grid-cols-2 gap-2">
                                            <select
                                              value={parsedStart.month}
                                              onChange={(e) => handleDateChangeLocal('startDate', true, e.target.value)}
                                              className={inputClass}
                                            >
                                              <option value="">Month</option>
                                              {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                                            </select>
                                            <input
                                              type="text"
                                              value={parsedStart.year}
                                              onChange={(e) => handleDateChangeLocal('startDate', false, e.target.value)}
                                              className={inputClass}
                                              placeholder="Year (e.g. 2021)"
                                              maxLength={4}
                                            />
                                          </div>
                                        </div>

                                        {/* End Date */}
                                        <div className="space-y-2">
                                          <span className={`${labelClass} block`}>End Date</span>
                                          
                                          {!parsedEnd.isPresent && (
                                            <div className="grid grid-cols-2 gap-2 animate-fadeIn">
                                              <select
                                                value={parsedEnd.month}
                                                onChange={(e) => handleDateChangeLocal('endDate', true, e.target.value)}
                                                className={inputClass}
                                              >
                                                <option value="">Month</option>
                                                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                                              </select>
                                              <input
                                                type="text"
                                                value={parsedEnd.year}
                                                onChange={(e) => handleDateChangeLocal('endDate', false, e.target.value)}
                                                className={inputClass}
                                                placeholder="Year (e.g. 2024)"
                                                maxLength={4}
                                              />
                                            </div>
                                          )}

                                          <button
                                            type="button"
                                            onClick={() => {
                                              updateListItem(section.id, item.id, 'endDate', parsedEnd.isPresent ? '' : 'Present');
                                            }}
                                            className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400 cursor-pointer select-none mt-1 group"
                                          >
                                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                                              parsedEnd.isPresent 
                                                ? 'bg-teal-600 border-teal-600 text-white shadow-sm' 
                                                : 'border-slate-300 dark:border-teal-300/20 bg-white dark:bg-slate-900 group-hover:border-teal-500'
                                            }`}>
                                              {parsedEnd.isPresent && (
                                                <svg className="w-2.5 h-2.5 stroke-[3.5px] stroke-current" fill="none" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                </svg>
                                              )}
                                            </div>
                                            <span>
                                              {section.id === 'projects' && 'I am currently working on this project'}
                                              {section.id !== 'projects' && 'I currently work or study here'}
                                            </span>
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })()}

                                <div>
                                  <label className={labelClass}>
                                    {section.id === 'certificates' ? 'Details / Description (Optional)' : 'Details (Bullet points)'}
                                  </label>
                                  <textarea
                                    rows={section.id === 'certificates' ? 2 : 4}
                                    value={item.description || ''}
                                    onChange={(e) => updateListItem(section.id, item.id, 'description', e.target.value)}
                                    className={`${inputClass} resize-none font-sans`}
                                    placeholder={
                                      section.id === 'certificates'
                                        ? 'e.g. Co-authored a Research Paper titled "..."'
                                        : section.id === 'projects'
                                        ? '• Developed a responsive website to showcase...\n• Designed multiple webpages displaying menu items...\n• Tech Stack: HTML, CSS'
                                        : '• Spearheaded development of core features...\n• Optimized performance and reduced latency by 25%'
                                    }
                                  />
                                </div>
                              </div>
                            ))}

                            <button
                              onClick={() => addListItem(section.id)}
                              className={addButtonClass}
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Add Item
                            </button>
                          </div>
                        )}

                        {/* Skills / Languages type */}
                        {(section.type === 'skills' || section.type === 'languages') && (
                          <div className="space-y-4">
                            {section.items?.map((item) => (
                              <div key={item.id} className={itemCardClass}>
                                <button
                                  onClick={() => deleteSkillItem(section.id, item.id)}
                                  className={deleteButtonClass}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                                <div>
                                  <label className={labelClass}>
                                    {section.id === 'languages' ? 'Language' : 'Category'}
                                  </label>
                                  <input
                                    type="text"
                                    value={item.category || ''}
                                    onChange={(e) => updateSkillItem(section.id, item.id, 'category', e.target.value)}
                                    className={inputClass}
                                    placeholder={section.id === 'languages' ? 'English' : 'Languages'}
                                  />
                                </div>
                                <div>
                                  <label className={labelClass}>
                                    {section.id === 'languages' ? 'Proficiency' : 'Skills (Comma-separated)'}
                                  </label>
                                  <input
                                    type="text"
                                    value={item.skills || ''}
                                    onChange={(e) => updateSkillItem(section.id, item.id, 'skills', e.target.value)}
                                    className={inputClass}
                                    placeholder={section.id === 'languages' ? 'Fluent' : 'JavaScript, Python, C++'}
                                  />
                                </div>
                              </div>
                            ))}

                            <button
                              onClick={() => addSkillCategory(section.id)}
                              className={addButtonClass}
                            >
                              <Plus className="w-3.5 h-3.5" />
                              {section.id === 'languages' ? 'Add Language' : 'Add Skill Category'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}

            {/* TAB: TEMPLATES */}
            {activeTab === 'templates' && (
              <div className={`${panelClass} animate-fade-in`}>
                <div>
                  <h4 className={`font-heading text-sm font-extrabold mb-1 flex items-center gap-2 ${headingTextClass}`}>
                    <span className={iconBadgeClass}>
                      <Sparkles className="w-4 h-4" />
                    </span>
                    Layout templates
                  </h4>
                  <p className={`text-[11px] leading-5 mb-4 ${mutedTextClass}`}>Choose the document structure that best fits the role and your experience.</p>
                  
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { id: 'classic', label: 'Classic Clear', desc: 'Centered header profile with vertical content stacking.' },
                      { id: 'sidebar-left', label: 'Atlantic Blue', desc: 'Dark solid sidebar profile with white experience layout.' },
                      { id: 'header-accent', label: 'True Blue', desc: 'Modern left-aligned header profile with colored dividers.' },
                      { id: 'sidebar-right', label: 'Editorial Rule', desc: 'Serif academic styling with top-and-bottom structural headers.' }
                    ].map((tpl) => (
                      <button
                        key={tpl.id}
                        onClick={() => handleStyleChange('template', tpl.id)}
                        className={`p-3.5 rounded-xl border text-left text-xs transition-all relative overflow-hidden group flex flex-col gap-2 ${
                          styles.template === tpl.id
                            ? darkMode
                              ? 'border-teal-300/50 bg-gradient-to-r from-teal-300/14 to-amber-300/10 text-white font-semibold shadow-lg shadow-teal-950/20'
                              : 'border-teal-500 bg-teal-50 text-slate-950 font-semibold shadow-md shadow-teal-100'
                            : darkMode
                              ? 'border-teal-300/12 bg-slate-950/42 text-slate-300 hover:border-teal-300/35 hover:bg-slate-900/80 hover:text-white'
                              : 'border-slate-200 bg-slate-50/90 text-slate-600 hover:border-teal-300 hover:bg-white hover:text-slate-950'
                        }`}
                      >
                        <div className="flex justify-between items-center w-full">
                          <span className={`font-heading font-bold text-sm ${darkMode ? 'text-slate-100 group-hover:text-white' : 'text-slate-800 group-hover:text-slate-950'}`}>{tpl.label}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium ${
                            styles.template === tpl.id
                              ? darkMode ? 'bg-teal-300/15 text-teal-100' : 'bg-teal-100 text-teal-800'
                              : darkMode ? 'bg-slate-950/80 text-slate-400 ring-1 ring-teal-300/10' : 'bg-white text-slate-500'
                          }`}>
                            {styles.template === tpl.id ? 'Active' : 'Select'}
                          </span>
                        </div>
                        <p className={`text-[10px] leading-normal ${mutedTextClass}`}>{tpl.desc}</p>
                        
                        {/* Minimalist layout preview box */}
                        <div className={templatePreviewClass}>
                          {tpl.id === 'classic' && (
                            <div className="w-full flex flex-col gap-1 items-center justify-center">
                              <div className="h-1.5 w-1/3 bg-teal-500/50 rounded-sm"></div>
                              <div className="h-1 w-2/3 bg-slate-700 rounded-sm"></div>
                              <div className="h-1 w-2/3 bg-slate-700 rounded-sm"></div>
                            </div>
                          )}
                          {tpl.id === 'header-accent' && (
                            <div className="w-full flex flex-col gap-1 items-center">
                              <div className="h-2 w-full bg-teal-500/80 rounded-sm"></div>
                              <div className="h-1 w-2/3 bg-slate-700 rounded-sm mt-0.5"></div>
                              <div className="h-1 w-2/3 bg-slate-700 rounded-sm"></div>
                            </div>
                          )}
                          {tpl.id === 'sidebar-left' && (
                            <div className="w-full flex gap-1.5">
                              <div className="w-[30%] bg-teal-500/20 rounded flex flex-col gap-1 items-center p-1 justify-center">
                                <div className="h-1 w-full bg-teal-500/50 rounded-sm"></div>
                                <div className="h-1 w-full bg-teal-500/50 rounded-sm"></div>
                              </div>
                              <div className="flex-1 flex flex-col gap-1 justify-center">
                                <div className="h-1 w-full bg-slate-700 rounded-sm"></div>
                                <div className="h-1 w-full bg-slate-700 rounded-sm"></div>
                              </div>
                            </div>
                          )}
                          {tpl.id === 'sidebar-right' && (
                            <div className="w-full flex flex-col gap-1 justify-center text-center font-serif text-slate-500 select-none text-[8px] items-center">
                              <div className="border-t border-b border-teal-500/40 py-0.5 leading-none w-2/3 mt-1">RULED CONTENT</div>
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: STYLING & FONTS */}
            {activeTab === 'styles' && (
              <div className={`${panelClass} space-y-5`}>
                <div>
                  <h4 className={`font-heading text-sm font-extrabold flex items-center gap-2 ${headingTextClass}`}>
                    <span className={iconBadgeClass}>
                      <Palette className="w-4 h-4" />
                    </span>
                    Resume formatting
                  </h4>
                  <p className={`mt-1 text-[11px] leading-5 ${mutedTextClass}`}>Fine tune typography, spacing, and accent color for the current template.</p>
                </div>

                {/* Body Font Picker */}
                <div>
                  <h4 className={labelClass}>Body Font</h4>
                  <p className={`text-[10px] ${mutedTextClass} mb-1`}>Hover to preview · click to apply</p>
                  <div className={`rounded-xl border overflow-hidden ${darkMode ? 'border-teal-300/15 bg-slate-950/35' : 'border-slate-200'}`}>
                    <div className={`px-2 py-1.5 text-xs font-semibold flex items-center justify-between ${darkMode ? 'bg-teal-300/10 text-teal-100' : 'bg-slate-50 text-teal-700'}`}>
                      <span>Current: <span style={{ fontFamily: getFontFamilyCSS(styles.fontFamily) }}>{styles.fontFamily}</span></span>
                    </div>
                    <div className={`max-h-52 overflow-y-auto divide-y ${darkMode ? 'divide-teal-300/10' : 'divide-slate-100'}`}>
                      {Object.entries(FONT_CATEGORIES).map(([category, fonts]) => (
                        <div key={category}>
                          <div className={`px-3 py-1 text-[9px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-400 bg-slate-950/55' : 'text-slate-400 bg-slate-50'}`}>{category}</div>
                          {fonts.map(font => (
                            <button
                              key={font}
                              onMouseEnter={() => setPreviewFont(font)}
                              onMouseLeave={() => setPreviewFont(null)}
                              onClick={() => { handleStyleChange('fontFamily', font); setPreviewFont(null); }}
                              style={{ fontFamily: getFontFamilyCSS(font) }}
                              className={`w-full text-left px-3 py-2 text-sm transition-all ${
                                styles.fontFamily === font
                                  ? darkMode ? 'bg-teal-300/15 text-teal-100' : 'bg-teal-50 text-teal-900 font-semibold'
                                  : darkMode ? 'text-slate-200 hover:bg-teal-300/10 hover:text-white' : 'text-slate-700 hover:bg-teal-50 hover:text-slate-950'
                              }`}
                            >
                              {font}
                              {styles.fontFamily === font && <span className="ml-2 text-[10px] opacity-60">✓ active</span>}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Name Font Picker */}
                <div>
                  <h4 className={labelClass}>Name / Heading Font</h4>
                  <p className={`text-[10px] ${mutedTextClass} mb-1`}>Hover to preview · click to apply</p>
                  <div className={`rounded-xl border overflow-hidden ${darkMode ? 'border-teal-300/15 bg-slate-950/35' : 'border-slate-200'}`}>
                    <div className={`px-2 py-1.5 text-xs font-semibold flex items-center justify-between ${darkMode ? 'bg-teal-300/10 text-teal-100' : 'bg-slate-50 text-teal-700'}`}>
                      <span>Current: <span style={{ fontFamily: styles.nameFontFamily === 'same-as-body' ? getFontFamilyCSS(styles.fontFamily) : getFontFamilyCSS(styles.nameFontFamily) }}>{styles.nameFontFamily === 'same-as-body' ? 'Same as body' : styles.nameFontFamily}</span></span>
                    </div>
                    <div className={`max-h-52 overflow-y-auto divide-y ${darkMode ? 'divide-teal-300/10' : 'divide-slate-100'}`}>
                      <button
                        onMouseEnter={() => setPreviewNameFont('same-as-body')}
                        onMouseLeave={() => setPreviewNameFont(null)}
                        onClick={() => { handleStyleChange('nameFontFamily', 'same-as-body'); setPreviewNameFont(null); }}
                        className={`w-full text-left px-3 py-2 text-xs italic transition-all ${
                          styles.nameFontFamily === 'same-as-body'
                            ? darkMode ? 'bg-teal-300/15 text-teal-100' : 'bg-teal-50 text-teal-900 font-semibold'
                            : darkMode ? 'text-slate-300 hover:bg-teal-300/10 hover:text-white' : 'text-slate-500 hover:bg-teal-50'
                        }`}
                      >
                        Same as body font
                        {styles.nameFontFamily === 'same-as-body' && <span className="ml-2 text-[10px] opacity-60">✓ active</span>}
                      </button>
                      {Object.entries(FONT_CATEGORIES).map(([category, fonts]) => (
                        <div key={category}>
                          <div className={`px-3 py-1 text-[9px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-400 bg-slate-950/55' : 'text-slate-400 bg-slate-50'}`}>{category}</div>
                          {fonts.map(font => (
                            <button
                              key={font}
                              onMouseEnter={() => setPreviewNameFont(font)}
                              onMouseLeave={() => setPreviewNameFont(null)}
                              onClick={() => { handleStyleChange('nameFontFamily', font); setPreviewNameFont(null); }}
                              style={{ fontFamily: getFontFamilyCSS(font) }}
                              className={`w-full text-left px-3 py-2 text-sm transition-all ${
                                styles.nameFontFamily === font
                                  ? darkMode ? 'bg-teal-300/15 text-teal-100' : 'bg-teal-50 text-teal-900 font-semibold'
                                  : darkMode ? 'text-slate-200 hover:bg-teal-300/10 hover:text-white' : 'text-slate-700 hover:bg-teal-50 hover:text-slate-950'
                              }`}
                            >
                              {font}
                              {styles.nameFontFamily === font && <span className="ml-2 text-[10px] opacity-60">✓ active</span>}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Font Size Choices */}
                <div>
                  <h4 className={`${labelClass} mb-2`}>Font Size</h4>
                  <div className="grid grid-cols-4 gap-1.5">
                    {['12px', '13px', '14px', '15px'].map((sz) => (
                      <button
                        key={sz}
                        onClick={() => handleStyleChange('fontSize', sz)}
                        className={`py-1.5 text-xs rounded border transition-all ${
                          styles.fontSize === sz
                            ? darkMode
                              ? 'border-teal-300/60 bg-teal-300/12 text-white'
                              : 'border-teal-500 bg-teal-50 text-teal-900'
                            : darkMode
                              ? 'border-teal-300/12 bg-slate-950/55 text-slate-300 hover:border-teal-300/35 hover:text-white'
                              : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-teal-300 hover:bg-white'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Layout Margins */}
                <div>
                  <h4 className={`text-xs font-semibold mb-3 flex items-center gap-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    <Sliders className="w-4 h-4 text-teal-300" />
                    Canvas Layout Spacings
                  </h4>
                  
                  <div className={`space-y-4 p-3 rounded-xl border ${darkMode ? 'bg-slate-950/45 border-teal-300/15' : 'bg-slate-50 border-slate-200'}`}>
                    <div>
                      <div className={`flex justify-between text-[10px] ${mutedTextClass}`}>
                        <span>Vertical Margins</span>
                        <span className={darkMode ? 'font-mono text-teal-300' : 'font-mono text-teal-700'}>{styles.marginY}</span>
                      </div>
                      <input
                        type="range"
                        min={12}
                        max={48}
                        step={2}
                        value={parseInt(styles.marginY) || 24}
                        onChange={(e) => handleStyleChange('marginY', e.target.value + 'px')}
                        className="w-full accent-teal-500 bg-slate-800 mt-1 h-1 rounded"
                      />
                    </div>

                    <div>
                      <div className={`flex justify-between text-[10px] ${mutedTextClass}`}>
                        <span>Horizontal Margins</span>
                        <span className={darkMode ? 'font-mono text-teal-300' : 'font-mono text-teal-700'}>{styles.marginX}</span>
                      </div>
                      <input
                        type="range"
                        min={12}
                        max={48}
                        step={2}
                        value={parseInt(styles.marginX) || 24}
                        onChange={(e) => handleStyleChange('marginX', e.target.value + 'px')}
                        className="w-full accent-teal-500 bg-slate-800 mt-1 h-1 rounded"
                      />
                    </div>

                    <div>
                      <div className={`flex justify-between text-[10px] ${mutedTextClass}`}>
                        <span>Section Spacing</span>
                        <span className={darkMode ? 'font-mono text-teal-300' : 'font-mono text-teal-700'}>{styles.sectionSpacing}</span>
                      </div>
                      <input
                        type="range"
                        min={8}
                        max={32}
                        step={2}
                        value={parseInt(styles.sectionSpacing) || 16}
                        onChange={(e) => handleStyleChange('sectionSpacing', e.target.value + 'px')}
                        className="w-full accent-teal-500 bg-slate-800 mt-1 h-1 rounded"
                      />
                    </div>

                    <div>
                      <div className={`flex justify-between text-[10px] ${mutedTextClass}`}>
                        <span>Item Spacing</span>
                        <span className={darkMode ? 'font-mono text-teal-300' : 'font-mono text-teal-700'}>{styles.itemSpacing}</span>
                      </div>
                      <input
                        type="range"
                        min={4}
                        max={20}
                        step={2}
                        value={parseInt(styles.itemSpacing) || 8}
                        onChange={(e) => handleStyleChange('itemSpacing', e.target.value + 'px')}
                        className="w-full accent-teal-500 bg-slate-800 mt-1 h-1 rounded"
                      />
                    </div>
                  </div>
                </div>

                {/* Primary Accent Color */}
                <div>
                  <h4 className={`${labelClass} mb-2`}>Accent Highlight Color</h4>
                  <div className="flex flex-wrap items-center gap-2">
                    {[
                      '#0f172a', // Deep Black / Slate 900
                      '#000000', // Pure Black
                      '#1e293b', // Slate
                      '#4f46e5', // Indigo
                      '#0d9488', // Teal
                      '#0891b2', // Cyan
                      '#dc2626', // Red
                      '#d97706'  // Amber
                    ].map((col) => (
                      <button
                        key={col}
                        onClick={() => handleStyleChange('primaryColor', col)}
                        style={{ backgroundColor: col }}
                        className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center ${
                          styles.primaryColor === col ? 'border-white scale-110 shadow' : 'border-transparent hover:scale-105'
                        }`}
                      >
                        {styles.primaryColor === col && <Check className="w-4 h-4 text-white drop-shadow" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Drag Handle to resize sidebar */}
        <div
          onMouseDown={handleDragStart}
          title="Drag to resize sidebar"
          className={`group w-1.5 flex-shrink-0 cursor-col-resize relative z-20 no-print flex items-center justify-center transition-colors ${
            darkMode
              ? 'bg-white/5 hover:bg-teal-500/40'
              : 'bg-slate-200/60 hover:bg-teal-400/50'
          }`}
        >
          <div className={`w-0.5 h-10 rounded-full transition-colors ${
            darkMode ? 'bg-white/20 group-hover:bg-teal-300' : 'bg-slate-400/50 group-hover:bg-teal-500'
          }`} />
        </div>

        {/* Center Design Workspace Canvas */}
        <main className="flex-1 overflow-auto bg-slate-100 p-8 flex justify-center items-start relative select-text">
          {/* Scaled A4 wrapper reserves the exact visual size for all pages */}
          <div
            className="relative flex-shrink-0 transition-all"
            style={{
              width: `${A4_WIDTH_PX * canvasScale}px`,
              height: `${(pageCount * A4_HEIGHT_PX) * canvasScale}px`,
            }}
          >
            {/* A4 Sheet Paper */}
            <div 
              ref={canvasRef}
              id="resume-canvas-print-target"
              className="a4-canvas absolute left-0 top-0 origin-top-left transition-all"
              style={{
                transform: `scale(${canvasScale})`,
                minHeight: `${pageCount * 297}mm`,
                height: pageCount > 1 ? `${pageCount * 297}mm` : '297mm',
                '--padding-y': styles.marginY,
                '--padding-x': styles.marginX,
                '--font-family': getFontFamilyCSS(previewFont || styles.fontFamily),
                '--name-font-family': (() => {
                  const nf = previewNameFont || styles.nameFontFamily;
                  const bf = previewFont || styles.fontFamily;
                  return nf === 'same-as-body' ? getFontFamilyCSS(bf) : getFontFamilyCSS(nf);
                })(),
                '--font-size': styles.fontSize,
              }}
            >
              {/* Visual Page Break Guidelines when spanning multiple pages */}
              {pageCount > 1 && Array.from({ length: pageCount - 1 }).map((_, idx) => (
                <div
                  key={idx}
                  className="page-guide-line no-print pointer-events-none absolute left-0 right-0 z-30 flex items-center justify-between"
                  style={{ top: `${(idx + 1) * A4_HEIGHT_PX}px` }}
                >
                  <div className="h-[2px] w-full border-b-2 border-dashed border-rose-400/80 bg-rose-50/50" />
                  <span className="absolute right-4 -top-3 rounded-full bg-rose-600 text-[10px] font-bold text-white px-2.5 py-0.5 shadow-md">
                    Page {idx + 2} starts here
                  </span>
                </div>
              ))}

              {/* A4 Content Wrapper */}
              <div 
                ref={contentRef}
                id="resume-canvas-content-root" 
                className="w-full flex flex-col h-auto min-h-0 text-slate-950"
              >
              
              {/* RENDER LAYOUT TEMPLATE 1: CLASSIC CLEAR (DEFAULT) */}
              {(styles.template === 'classic' || !styles.template) && (
                <div className="w-full flex flex-col h-full text-slate-950">
                  {/* HEADER: Personal Information */}
                  <div className="text-center border-b-2 pb-4 mb-4" style={{ borderColor: styles.primaryColor }}>
                    <h1 className="text-[2.2em] font-extrabold tracking-tight uppercase text-slate-950" style={{ color: styles.primaryColor, fontFamily: 'var(--name-font-family)' }}>
                      {personalInfo.name || 'Your Full Name'}
                    </h1>
                    <h2 className="text-[1em] font-semibold tracking-wider text-slate-800 uppercase mt-0.5">
                      {personalInfo.title || 'Target Job Title'}
                    </h2>
                    <div className="flex flex-wrap items-center justify-center gap-y-1.5 gap-x-3 text-[0.88em] mt-3 text-slate-900">
                      {personalInfo.email && <span>{personalInfo.email}</span>}
                      {personalInfo.phone && <><span className="text-slate-400">•</span><span>{personalInfo.phone}</span></>}
                      {personalInfo.location && <><span className="text-slate-400">•</span><span>{personalInfo.location}</span></>}
                      {personalInfo.website && <><span className="text-slate-400">•</span><a href={`https://${personalInfo.website}`} target="_blank" rel="noreferrer" className="hover:underline text-slate-900 font-medium">{personalInfo.website}</a></>}
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-x-3 text-[0.85em] mt-1 text-slate-900 font-mono">
                      {personalInfo.github && <a href={`https://${personalInfo.github}`} target="_blank" rel="noreferrer" className="hover:underline">{personalInfo.github}</a>}
                      {personalInfo.linkedin && <>{personalInfo.github && <span className="text-slate-400 font-sans">•</span>}<a href={`https://${personalInfo.linkedin}`} target="_blank" rel="noreferrer" className="hover:underline">{personalInfo.linkedin}</a></>}
                    </div>
                  </div>

                  {/* BODY SECTIONS */}
                  <div className="space-y-4">
                    {renderSection('summary')}
                    {renderSection('experience')}
                    {renderSection('education')}
                    {renderSection('projects')}
                    {renderSection('skills')}
                    {renderSection('languages')}
                    {renderSection('certificates')}
                  </div>
                </div>
              )}

              {/* RENDER LAYOUT TEMPLATE 2: ATLANTIC BLUE (SIDEBAR LEFT COLORED BACKGROUND) */}
              {styles.template === 'sidebar-left' && (
                <div className="w-full flex h-full flex-1 gap-6 text-slate-950">
                  {/* Sidebar Left Column */}
                  <div 
                    className="w-[32%] flex flex-col gap-6" 
                    style={{ 
                      backgroundColor: styles.primaryColor,
                      color: '#f8fafc',
                      fontFamily: 'var(--font-family)',
                      margin: `calc(-1 * var(--padding-y)) 0 calc(-1 * var(--padding-y)) calc(-1 * var(--padding-x))`,
                      padding: `var(--padding-y) 1.25rem`
                    }}
                  >
                    {/* Name and Job Title */}
                    <div className="space-y-1 select-none border-b pb-4 mb-2" style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
                      <h1 className="text-[1.8em] font-extrabold tracking-tight uppercase leading-tight text-white" style={{ fontFamily: 'var(--name-font-family)' }}>
                        {personalInfo.name || 'Your Name'}
                      </h1>
                      <h2 className="text-[0.85em] font-semibold tracking-wider text-slate-200 uppercase">
                        {personalInfo.title || 'Job Title'}
                      </h2>
                    </div>

                    {/* Contact info details styled in sidebar */}
                    <div className="space-y-3">
                      <h4 className="text-[0.75em] font-bold uppercase tracking-wider border-b pb-1 text-white" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>Contact</h4>
                      <div className="space-y-2.5 text-[0.8em] text-slate-200 break-all">
                        {personalInfo.email && (
                          <div className="flex flex-col"><span className="text-[0.7em] text-slate-300 font-semibold uppercase">Email</span><span>{personalInfo.email}</span></div>
                        )}
                        {personalInfo.phone && (
                          <div className="flex flex-col"><span className="text-[0.7em] text-slate-300 font-semibold uppercase">Phone</span><span>{personalInfo.phone}</span></div>
                        )}
                        {personalInfo.location && (
                          <div className="flex flex-col"><span className="text-[0.7em] text-slate-300 font-semibold uppercase">Location</span><span>{personalInfo.location}</span></div>
                        )}
                        {personalInfo.website && (
                          <div className="flex flex-col"><span className="text-[0.7em] text-slate-300 font-semibold uppercase">Website</span><a href={`https://${personalInfo.website}`} target="_blank" rel="noreferrer" className="hover:underline">{personalInfo.website}</a></div>
                        )}
                        {personalInfo.github && (
                          <div className="flex flex-col"><span className="text-[0.7em] text-slate-300 font-semibold uppercase">GitHub</span><a href={`https://${personalInfo.github}`} target="_blank" rel="noreferrer" className="hover:underline">{personalInfo.github.replace('github.com/', '')}</a></div>
                        )}
                        {personalInfo.linkedin && (
                          <div className="flex flex-col"><span className="text-[0.7em] text-slate-300 font-semibold uppercase">LinkedIn</span><a href={`https://${personalInfo.linkedin}`} target="_blank" rel="noreferrer" className="hover:underline">{personalInfo.linkedin.replace('linkedin.com/in/', '')}</a></div>
                        )}
                      </div>
                    </div>

                    {/* Render Skills & Languages inside sidebar (colored headers and styling) */}
                    <div className="space-y-5 custom-sidebar-widgets text-slate-200 select-text">
                      <style dangerouslySetInnerHTML={{__html: `
                        .custom-sidebar-widgets h3 {
                          color: #ffffff !important;
                          border-bottom-color: rgba(255,255,255,0.2) !important;
                        }
                        .custom-sidebar-widgets span {
                          color: #e2e8f0 !important;
                        }
                      `}} />
                      {renderSection('skills')}
                      {renderSection('languages')}
                    </div>
                  </div>

                  {/* Main Right Column */}
                  <div className="flex-1 flex flex-col gap-4 py-1.5 pl-2 text-slate-950">
                    {renderSection('summary')}
                    {renderSection('experience')}
                    {renderSection('education')}
                    {renderSection('projects')}
                    {renderSection('certificates')}
                  </div>
                </div>
              )}

              {/* RENDER LAYOUT TEMPLATE 3: TRUE BLUE */}
              {styles.template === 'header-accent' && (
                <div className="w-full flex flex-col h-full text-slate-950">
                  {/* HEADER: Left-aligned modern layout */}
                  <div className="flex justify-between items-start border-b-2 pb-4 mb-4" style={{ borderColor: styles.primaryColor }}>
                    <div>
                      <h1 className="text-[2.2em] font-extrabold tracking-tight uppercase text-slate-950" style={{ color: styles.primaryColor, fontFamily: 'var(--name-font-family)' }}>
                        {personalInfo.name || 'Your Full Name'}
                      </h1>
                      <h2 className="text-[1em] font-semibold tracking-wider text-slate-800 uppercase mt-0.5">
                        {personalInfo.title || 'Target Job Title'}
                      </h2>
                    </div>
                    <div className="text-right text-[0.85em] text-slate-900 space-y-1">
                      {personalInfo.email && <div>{personalInfo.email}</div>}
                      {personalInfo.phone && <div>{personalInfo.phone}</div>}
                      {personalInfo.location && <div>{personalInfo.location}</div>}
                      {personalInfo.website && <a href={`https://${personalInfo.website}`} target="_blank" rel="noreferrer" className="hover:underline block">{personalInfo.website}</a>}
                      {(personalInfo.github || personalInfo.linkedin) && (
                        <div className="flex gap-2 justify-end font-mono text-[0.95em] text-slate-900">
                          {personalInfo.github && <a href={`https://${personalInfo.github}`} target="_blank" rel="noreferrer" className="hover:underline">{personalInfo.github.replace('github.com/', '')}</a>}
                          {personalInfo.linkedin && <a href={`https://${personalInfo.linkedin}`} target="_blank" rel="noreferrer" className="hover:underline">{personalInfo.linkedin.replace('linkedin.com/in/', '')}</a>}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* BODY SECTIONS */}
                  <div className="space-y-4">
                    {renderSection('summary')}
                    {renderSection('experience')}
                    {renderSection('education')}
                    {renderSection('projects')}
                    {renderSection('skills')}
                    {renderSection('languages')}
                    {renderSection('certificates')}
                  </div>
                </div>
              )}

              {/* RENDER LAYOUT TEMPLATE 4: EDITORIAL RULE */}
              {styles.template === 'sidebar-right' && (
                <div className="w-full flex flex-col h-full text-slate-950">
                  {/* HEADER: Elegant serif style */}
                  <div className="text-center border-t-2 border-b-2 py-4 mb-4" style={{ borderColor: styles.primaryColor }}>
                    <h1 className="text-[2.2em] font-extrabold tracking-wide uppercase text-slate-950" style={{ color: styles.primaryColor, fontFamily: 'var(--name-font-family)' }}>
                      {personalInfo.name || 'Your Full Name'}
                    </h1>
                    <h2 className="text-[1em] font-semibold tracking-wider text-slate-800 uppercase mt-0.5">
                      {personalInfo.title || 'Target Job Title'}
                    </h2>
                    <div className="flex flex-wrap items-center justify-center gap-y-1.5 gap-x-4 text-[0.88em] mt-3 text-slate-900">
                      {personalInfo.email && <span>{personalInfo.email}</span>}
                      {personalInfo.phone && <span>{personalInfo.phone}</span>}
                      {personalInfo.location && <span>{personalInfo.location}</span>}
                      {personalInfo.website && <a href={`https://${personalInfo.website}`} target="_blank" rel="noreferrer" className="hover:underline">{personalInfo.website}</a>}
                    </div>
                  </div>

                  {/* BODY SECTIONS */}
                  <div className="space-y-4">
                    {renderSection('summary')}
                    {renderSection('experience')}
                    {renderSection('education')}
                    {renderSection('projects')}
                    {renderSection('skills')}
                    {renderSection('languages')}
                    {renderSection('certificates')}
                  </div>
                </div>
              )}

            </div>
          </div>
          </div>
</main>
       </div>
       {showAtsPanel && (
         <AtsPanel resume={resume} onClose={() => setShowAtsPanel(false)} />
       )}

       <UploadResumeModal
         isOpen={showUploadModal}
         onClose={() => setShowUploadModal(false)}
         targetResumeId={id}
         onSuccess={handleImportSuccess}
       />
     </div>
   );
 }
