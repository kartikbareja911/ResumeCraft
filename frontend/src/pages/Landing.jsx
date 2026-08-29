import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Play, 
  Download, 
  UploadCloud, 
  Sliders, 
  Sparkles, 
  CheckCircle,
  X,
  ArrowRight,
  Sun,
  Moon,
  Menu,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

export default function Landing() {
  const [atsScore, setAtsScore] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [showCookieBanner, setShowCookieBanner] = useState(false);
  const [activeFaqIndex, setActiveFaqIndex] = useState(null);

  // Dark Mode State
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : false;
  });

  // Track user scroll for header state and back-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Sync Dark Mode state to DOM
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Sync ATS progress ring on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setAtsScore(82);
    }, 600);
    
    // Show cookie banner if not accepted previously
    const accepted = localStorage.getItem('resumecraft_cookies_accepted');
    if (!accepted) {
      setShowCookieBanner(true);
    }

    return () => clearTimeout(timer);
  }, []);

  const handleAcceptCookies = () => {
    localStorage.setItem('resumecraft_cookies_accepted', 'true');
    setShowCookieBanner(false);
  };

  const handleDeclineCookies = () => {
    localStorage.setItem('resumecraft_cookies_accepted', 'declined');
    setShowCookieBanner(false);
  };

  const toggleFaq = (index) => {
    setActiveFaqIndex(prevIndex => prevIndex === index ? null : index);
  };

  const faqs = [
    {
      q: "How does the AI Gemini Resume Parser work?",
      a: "Simply upload your current PDF or Word resume. Our integration with Google Gemini extracts your work experiences, contact information, education, and technical skills automatically, formatting them into your preferred template layout."
    },
    {
      q: "Will my resume fit on exactly one page?",
      a: "Yes! Our custom-designed single-page layout system tracks your page height in real-time. By utilizing the vertical spacing and margins sliders, you can tweak font sizing and padding to keep your layout strictly locked to a single page."
    },
    {
      q: "How is the ATS Match Score calculated?",
      a: "When you paste a target job description, ResumeCraft runs keyword analysis checks against your resume. It identifies missing keywords, evaluates action verbs, and checks structure compatibility to score your resume matching standard ATS parsing engines."
    },
    {
      q: "Is ResumeCraft free to use?",
      a: "Yes! You can design, style, auto-save, parse resumes, run ATS keyword matching checks, and export highly optimized PDFs for free."
    }
  ];

  return (
    <div className="bg-[#F8FAFC] dark:bg-slate-950 text-[#131b2e] dark:text-slate-100 min-h-screen font-sans overflow-x-hidden relative selection:bg-[#00685f]/10 selection:text-[#00685f] transition-colors duration-300">
      
      {/* Accessibility Skip Link */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Embedded Custom Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Inter:wght@400;500;600;700;800&display=swap');
        
        .font-serif {
          font-family: 'EB Garamond', Georgia, serif;
        }
        
        .font-sans {
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }

        .text-gradient {
          background: linear-gradient(135deg, #00685f 0%, #4b41e1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          color: transparent;
        }

        /* Ambient Glow Blobs */
        .glow-bg {
          position: absolute;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(0, 104, 95, 0.05) 0%, rgba(248, 250, 252, 0) 70%);
          top: -100px;
          left: -100px;
          z-index: 0;
          pointer-events: none;
        }
        .dark .glow-bg {
          background: radial-gradient(circle, rgba(45, 212, 191, 0.05) 0%, rgba(2, 6, 23, 0) 70%);
        }

        .glow-bg-2 {
          position: absolute;
          width: 800px;
          height: 800px;
          background: radial-gradient(circle, rgba(75, 65, 225, 0.04) 0%, rgba(248, 250, 252, 0) 70%);
          bottom: -200px;
          right: -200px;
          z-index: 0;
          pointer-events: none;
        }
        .dark .glow-bg-2 {
          background: radial-gradient(circle, rgba(99, 102, 241, 0.04) 0%, rgba(2, 6, 23, 0) 70%);
        }

        /* Animations */
        @keyframes scan {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(320px); opacity: 0; }
        }

        @keyframes float-editor {
          0%, 100% { transform: translateY(0) rotate(1.5deg); }
          50% { transform: translateY(-8px) rotate(0.5deg); }
        }
        
        @keyframes slider-move {
          0%, 100% { width: 60%; }
          50% { width: 85%; }
        }

        @keyframes slider-move-2 {
          0%, 100% { width: 45%; }
          50% { width: 75%; }
        }

        @keyframes ghost-type {
          0%, 100% { width: 25%; opacity: 0.5; }
          50% { width: 90%; opacity: 1; }
        }
        
        @keyframes ghost-type-2 {
          0%, 100% { width: 66%; opacity: 0.5; }
          50% { width: 95%; opacity: 1; }
        }

        .animate-float-editor {
          animation: float-editor 6s ease-in-out infinite;
        }

        .animate-slider {
          animation: slider-move 4s ease-in-out infinite;
        }

        .animate-slider-2 {
          animation: slider-move-2 5s ease-in-out infinite;
        }

        .animate-ghost-type {
          animation: ghost-type 4s ease-in-out infinite;
        }

        .animate-ghost-type-2 {
          animation: ghost-type-2 5s ease-in-out infinite;
        }

        .animate-scan {
          animation: scan 3.5s ease-in-out infinite;
        }
      `}</style>

      {/* Ambient Glows */}
      <div className="glow-bg" />
      <div className="glow-bg-2" />

      {/* Sticky Header Nav */}
      <header className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/90 dark:bg-slate-900/90 shadow-md border-b border-slate-200/80 dark:border-slate-800/80 py-3' 
          : 'bg-transparent border-b border-transparent py-4'
      }`}>
        <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between">
          <div className="font-sans text-xl font-bold flex items-center gap-2">
            <div className="h-9 w-9 bg-[#00685f]/10 dark:bg-teal-500/10 text-[#00685f] dark:text-teal-400 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-slate-900 dark:text-white">ResumeCraft</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600 dark:text-slate-350">
            <a href="#features" className="hover:text-[#00685f] dark:hover:text-teal-450 transition">Features</a>
            <a href="#how-it-works" className="hover:text-[#00685f] dark:hover:text-teal-450 transition">How it Works</a>
            <a href="#faq-section" className="hover:text-[#00685f] dark:hover:text-teal-450 transition">FAQs</a>
            <a href="#pricing" className="hover:text-[#00685f] dark:hover:text-teal-450 transition">Pricing</a>
          </nav>

          <div className="flex items-center gap-3">
            {/* Dark Mode Toggle Button */}
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-350 transition-colors"
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Login Link */}
            <Link 
              to="/login" 
              className="text-sm font-semibold text-slate-600 dark:text-slate-350 hover:text-slate-900 dark:hover:text-white transition hidden md:block"
            >
              Login
            </Link>

            {/* Get Started Button */}
            <Link 
              to="/login" 
              className="text-xs font-semibold px-5 py-2.5 rounded-full bg-[#00685f] text-white hover:bg-[#008378] transition shadow-md shadow-[#00685f]/15 hover:scale-[1.02] active:scale-[0.98] duration-200"
            >
              Get Started
            </Link>

            {/* Mobile hamburger menu toggle */}
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-850 md:hidden transition"
              aria-label="Open mobile menu"
            >
              <Menu className="w-5.5 h-5.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex justify-end">
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-sm bg-white dark:bg-slate-900 p-6 flex flex-col gap-6 shadow-2xl h-full animate-fade-in border-l border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white">Navigation</span>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <nav className="flex flex-col gap-4 text-base font-semibold text-slate-700 dark:text-slate-300">
              <a 
                href="#features" 
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 hover:text-[#00685f] transition border-b border-slate-100 dark:border-slate-800"
              >
                Features
              </a>
              <a 
                href="#how-it-works" 
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 hover:text-[#00685f] transition border-b border-slate-100 dark:border-slate-800"
              >
                How it Works
              </a>
              <a 
                href="#faq-section" 
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 hover:text-[#00685f] transition border-b border-slate-100 dark:border-slate-800"
              >
                FAQs
              </a>
              <Link 
                to="/login" 
                className="py-2 hover:text-[#00685f] transition"
              >
                Log In
              </Link>
            </nav>

            <Link 
              to="/login" 
              className="mt-auto w-full py-3 bg-[#00685f] hover:bg-[#008378] text-white rounded-xl text-center font-bold text-sm"
            >
              Create My Resume
            </Link>
          </div>
        </div>
      )}

      {/* Main Section */}
      <main id="main-content" className="pt-32 pb-24 max-w-[1200px] mx-auto px-6 relative z-10">
        
        {/* Hero Section */}
        <section className="flex flex-col lg:flex-row items-center gap-16 mb-32">
          
          {/* Left Hero Description */}
          <div className="flex-1 text-left flex flex-col items-start gap-6">
            <div className="bg-[#00685f]/10 dark:bg-teal-500/10 border border-[#00685f]/20 dark:border-teal-500/20 text-[#00685f] dark:text-teal-400 px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00685f] dark:bg-teal-400 animate-pulse" />
              <span>Resume Desk</span>
            </div>
            
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight text-slate-900 dark:text-white">
              Build a single-page resume that <span className="text-gradient">beats the ATS.</span>
            </h1>
            
            <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl">
              Upload your document, parse it in 5 seconds with Gemini AI, run live ATS checks, and export print-ready clickable PDFs with zero formatting lag.
            </p>
            
            <div className="flex flex-wrap items-center gap-4 mt-2">
              <Link 
                to="/login" 
                className="bg-[#00685f] hover:bg-[#008378] text-white text-sm font-semibold px-8 py-4 rounded-full transition shadow-lg shadow-[#00685f]/15 hover:-translate-y-0.5"
              >
                Create My Resume
              </Link>
              <Link 
                to="/login" 
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-semibold px-8 py-4 rounded-full transition flex items-center gap-2 shadow-sm"
              >
                <Play className="w-4 h-4 text-[#00685f] dark:text-teal-400" />
                <span>Watch Demo</span>
              </Link>
            </div>
          </div>
          
          {/* Right Hero Interactive Mockup */}
          <div className="flex-1 w-full relative">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl p-4 flex flex-col md:flex-row gap-4 h-[440px] animate-float-editor hover:rotate-0 transition-transform duration-500 ease-out relative">
              
              {/* Mock Sliders Editor */}
              <div className="w-full md:w-1/3 bg-slate-50 dark:bg-slate-950 rounded-xl p-4 flex flex-col gap-4 border border-slate-100 dark:border-slate-800">
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4 mb-2" />
                
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">
                    <span>Margins</span>
                    <span>24px</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="w-2/3 h-full bg-[#00685f] dark:bg-teal-500 animate-slider" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">
                    <span>Line Height</span>
                    <span>1.6</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="w-1/2 h-full bg-[#4b41e1] dark:bg-indigo-500 animate-slider-2" />
                  </div>
                </div>
                
                <div className="mt-auto">
                  <div className="h-10 bg-[#00685f]/5 dark:bg-teal-500/5 rounded-lg flex items-center justify-center gap-2 text-[#00685f] dark:text-teal-400 text-xs font-semibold border border-[#00685f]/15 dark:border-teal-500/15 hover:bg-[#00685f]/10 dark:hover:bg-teal-500/10 transition">
                    <Download className="w-3.5 h-3.5" /> 
                    <span>Export PDF</span>
                  </div>
                </div>
              </div>
              
              {/* Mock Canvas Preview */}
              <div className="w-full md:w-2/3 bg-white dark:bg-slate-900 rounded-xl p-5 flex flex-col gap-4 overflow-hidden relative shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="h-5 bg-slate-200 dark:bg-slate-850 rounded w-1/2 mx-auto" />
                <div className="h-1.5 bg-slate-150 dark:bg-slate-800 rounded w-3/4 mx-auto mb-2" />
                
                <div className="space-y-3">
                  <div>
                    <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/4 mb-1.5 animate-ghost-type" />
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-850 rounded w-full mb-1" />
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-850 rounded w-5/6 animate-ghost-type-2" />
                  </div>
                  
                  <div>
                    <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/5 mb-1.5 animate-ghost-type" style={{ animationDelay: '1s' }} />
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-850 rounded w-full mb-1" />
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-850 rounded w-4/5 animate-ghost-type-2" style={{ animationDelay: '1.5s' }} />
                  </div>
                </div>
                
                {/* Simulated Scanning Laser */}
                <div className="absolute top-0 left-0 w-full h-0.5 bg-[#00685f] dark:bg-teal-400 shadow-[0_0_12px_#00685f] animate-scan" />
              </div>

            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="mb-32 scroll-mt-24">
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-center mb-16 text-slate-900 dark:text-white">
            Engineered for <span className="text-gradient">Precision</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* feature 1 */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 hover:border-[#00685f]/30 dark:hover:border-teal-500/30 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 flex flex-col items-start gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-[#00685f]/10 dark:bg-teal-500/10 flex items-center justify-center text-[#00685f] dark:text-teal-450">
                <UploadCloud className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-slate-900 dark:text-white">AI Gemini Parser</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Upload your existing PDF or Word document. Our advanced Gemini integration accurately extracts and structures your history instantly.
              </p>
            </div>
            
            {/* feature 2 */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 hover:border-[#00685f]/30 dark:hover:border-teal-500/30 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 flex flex-col items-start gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-[#4b41e1]/10 dark:bg-indigo-500/10 flex items-center justify-center text-[#4b41e1] dark:text-indigo-400">
                <Sliders className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-slate-900 dark:text-white">Layout & Spacing</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Fine-tune every pixel. Adjust margins, letter spacing, and line heights with visual sliders to ensure your content fits perfectly on one page.
              </p>
            </div>
            
            {/* feature 3 */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 hover:border-[#00685f]/30 dark:hover:border-teal-500/30 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 flex flex-col items-start gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-[#00685f]/10 dark:bg-teal-500/10 flex items-center justify-center text-[#00685f] dark:text-teal-450">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-slate-900 dark:text-white">ATS Scanner Engine</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Paste a job description and instantly see your match rate. Identify missing keywords and optimize your content before applying.
              </p>
            </div>

          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="mb-32 scroll-mt-24">
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-center mb-16 text-slate-900 dark:text-white">
            How It <span className="text-gradient">Works</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm relative z-10 hover:border-[#00685f]/30 dark:hover:border-teal-500/30 transition-all duration-300">
              <div className="w-10 h-10 rounded-full bg-[#00685f]/10 dark:bg-teal-500/10 text-[#00685f] dark:text-teal-400 flex items-center justify-center font-bold text-lg mb-4">
                1
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Upload or Start Fresh</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Paste your experiences, upload a PDF/DOCX to parse with Gemini AI, or construct a template from scratch.
              </p>
            </div>
            
            {/* Step 2 */}
            <div className="flex flex-col items-center text-center p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative z-10 hover:border-[#00685f]/30 dark:hover:border-teal-500/30 transition-all duration-300">
              <div className="w-10 h-10 rounded-full bg-[#4b41e1]/10 dark:bg-indigo-500/10 text-[#4b41e1] dark:text-indigo-400 flex items-center justify-center font-bold text-lg mb-4">
                2
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Fine-Tune Layout</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Tweak font pairings, vertical margins, and line heights with visual sliders. Guarantee a perfect single-page fit.
              </p>
            </div>
            
            {/* Step 3 */}
            <div className="flex flex-col items-center text-center p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative z-10 hover:border-[#00685f]/30 dark:hover:border-teal-500/30 transition-all duration-300">
              <div className="w-10 h-10 rounded-full bg-[#00685f]/10 dark:bg-teal-500/10 text-[#00685f] dark:text-teal-400 flex items-center justify-center font-bold text-lg mb-4">
                3
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">ATS Scan & Export</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Analyze content against job requirements, repair missing keyword alerts, and export your print-ready PDF.
              </p>
            </div>
          </div>
        </section>

        {/* ATS Interactive Showcase Section */}
        <section id="ats-check" className="mb-32 scroll-mt-24 flex flex-col items-center">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 md:p-12 w-full max-w-4xl flex flex-col md:flex-row items-center gap-12 shadow-sm">
            
            <div className="flex-1 text-center md:text-left">
              <h2 className="font-serif text-3xl font-semibold mb-4 text-slate-900 dark:text-white">Live ATS Match Scoring</h2>
              <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                Stop guessing. Our analyzer cross-references your resume against the target job description in real-time, highlighting exact keywords you need to add.
              </p>
              
              <ul className="text-left space-y-3 text-sm text-slate-600 dark:text-slate-400">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#00685f] dark:text-teal-400 flex-shrink-0" />
                  <span>Industry standard keyword matching</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#00685f] dark:text-teal-400 flex-shrink-0" />
                  <span>Action verb analysis</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#00685f] dark:text-teal-400 flex-shrink-0" />
                  <span>Formatting compliance check</span>
                </li>
              </ul>
            </div>
            
            {/* ATS Score Card mockup */}
            <div className="w-full md:w-80 bg-white dark:bg-slate-950 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-md relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-[#00685f]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="flex justify-center mb-6 relative">
                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                  <circle 
                    className="text-slate-100 dark:text-slate-850" 
                    cx="50" 
                    cy="50" 
                    fill="transparent" 
                    r="40" 
                    stroke="currentColor" 
                    strokeWidth="8" 
                  />
                  <circle 
                    className="text-[#00685f] dark:text-teal-400 transition-all duration-1000 ease-out" 
                    cx="50" 
                    cy="50" 
                    fill="transparent" 
                    r="40" 
                    stroke="currentColor" 
                    strokeLinecap="round" 
                    strokeWidth="8" 
                    style={{
                      strokeDasharray: '251.2',
                      strokeDashoffset: `${251.2 * (1 - atsScore / 100)}`
                    }}
                  />
                </svg>
                
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-serif text-3xl font-bold text-[#00685f] dark:text-teal-400">{atsScore}</span>
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Score</span>
                </div>
              </div>
              
              <div className="space-y-4 text-sm">
                <div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 mb-1.5 uppercase font-bold tracking-wider">Matched Keywords</div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="px-2 py-0.5 bg-[#00685f]/10 dark:bg-teal-500/10 text-[#00685f] dark:text-teal-400 rounded text-[11px] border border-[#00685f]/20 dark:border-teal-500/20 font-medium">React</span>
                    <span className="px-2 py-0.5 bg-[#00685f]/10 dark:bg-teal-500/10 text-[#00685f] dark:text-teal-400 rounded text-[11px] border border-[#00685f]/20 dark:border-teal-500/20 font-medium">TypeScript</span>
                    <span className="px-2 py-0.5 bg-[#00685f]/10 dark:bg-teal-500/10 text-[#00685f] dark:text-teal-400 rounded text-[11px] border border-[#00685f]/20 dark:border-teal-500/20 font-medium">UI Design</span>
                  </div>
                </div>
                
                <div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 mb-1.5 uppercase font-bold tracking-wider">Missing Keywords</div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="px-2 py-0.5 bg-[#ba1a1a]/10 dark:bg-rose-500/15 text-[#ba1a1a] dark:text-rose-400 rounded text-[11px] border border-[#ba1a1a]/20 dark:border-rose-500/20 font-medium">GraphQL</span>
                    <span className="px-2 py-0.5 bg-[#ba1a1a]/10 dark:bg-rose-500/15 text-[#ba1a1a] dark:text-rose-400 rounded text-[11px] border border-[#ba1a1a]/20 dark:border-rose-500/20 font-medium">Redux</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* Expandable FAQs Accordion Section */}
        <section id="faq-section" className="mb-24 scroll-mt-24">
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-center mb-12 text-slate-900 dark:text-white">
            Frequently Asked <span className="text-gradient">Questions</span>
          </h2>
          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = activeFaqIndex === index;
              return (
                <div 
                  key={index} 
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden transition-all duration-300"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-55 dark:hover:bg-slate-850 transition-colors"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-[#00685f] dark:text-teal-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-sm text-slate-500 dark:text-slate-450 leading-relaxed border-t border-slate-100 dark:border-slate-800/50 animate-slide-down">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer id="pricing" className="w-full py-12 px-6 flex flex-col md:flex-row justify-between items-center max-w-[1200px] mx-auto border-t border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/60 relative z-10">
        <div className="font-sans text-lg font-bold text-[#00685f] dark:text-teal-400 mb-4 md:mb-0">
          ResumeCraft
        </div>
        
        <div className="text-center md:text-left mb-4 md:mb-0">
          <p className="text-xs text-slate-400 dark:text-slate-500">© 2024 ResumeCraft. Precision-engineered for professionals.</p>
        </div>
        
        <nav className="flex flex-wrap justify-center gap-6 text-xs font-semibold text-slate-500 dark:text-slate-450">
          <a href="#" className="hover:text-[#00685f] transition">Privacy Policy</a>
          <a href="#" className="hover:text-[#00685f] transition">Terms of Service</a>
          <a href="#" className="hover:text-[#00685f] transition">Contact Us</a>
          <a href="#" className="hover:text-[#00685f] transition">Twitter</a>
          <a href="#" className="hover:text-[#00685f] transition">LinkedIn</a>
        </nav>
      </footer>

      {/* Back to Top Button */}
      {showBackToTop && (
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-40 bg-[#00685f] hover:bg-[#008378] text-white p-3 rounded-full shadow-lg hover:scale-108 active:scale-95 duration-200 transition-all flex items-center justify-center"
          aria-label="Back to top"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      )}

      {/* Cookie Consent Banner */}
      {showCookieBanner && (
        <div className="fixed bottom-0 left-0 w-full z-50 p-4 animate-slide-up">
          <div className="max-w-xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex-1 text-center sm:text-left">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2 justify-center sm:justify-start">
                <span>🍪 Cookie Preferences</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-405 leading-relaxed">
                We use cookies to save your user sessions and resume formatting settings. By accepting, you consent to our use of local cache files.
              </p>
            </div>
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <button 
                onClick={handleDeclineCookies}
                className="text-xs font-semibold text-slate-500 dark:text-slate-350 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg transition"
              >
                Decline
              </button>
              <button 
                onClick={handleAcceptCookies}
                className="text-xs font-semibold bg-[#00685f] hover:bg-[#008378] text-white px-4 py-2.5 rounded-lg transition"
              >
                Accept All
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
