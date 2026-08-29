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
  ArrowRight
} from 'lucide-react';

export default function Landing() {
  const [atsScore, setAtsScore] = useState(0);

  useEffect(() => {
    // Trigger the circular progress animation on mount
    const timer = setTimeout(() => {
      setAtsScore(82);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="bg-[#F8FAFC] text-[#131b2e] min-h-screen font-sans overflow-x-hidden relative selection:bg-[#00685f]/10 selection:text-[#00685f]">
      
      {/* Google Fonts Pre-load Effect */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Inter:wght@400;500;600;700&display=swap');
        
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
          background: radial-gradient(circle, rgba(0, 104, 95, 0.06) 0%, rgba(248, 250, 252, 0) 70%);
          top: -100px;
          left: -100px;
          z-index: 0;
          pointer-events: none;
        }

        .glow-bg-2 {
          position: absolute;
          width: 800px;
          height: 800px;
          background: radial-gradient(circle, rgba(75, 65, 225, 0.05) 0%, rgba(248, 250, 252, 0) 70%);
          bottom: -200px;
          right: -200px;
          z-index: 0;
          pointer-events: none;
        }

        /* Animations from Stitch */
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

      {/* Atmospheric Glows */}
      <div className="glow-bg" />
      <div className="glow-bg-2" />

      {/* Header Navigation */}
      <header className="fixed top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="font-sans text-xl font-bold text-[#131b2e] flex items-center gap-2">
            <div className="h-9 w-9 bg-[#00685f]/10 text-[#00685f] rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <span>ResumeCraft</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-[#00685f] transition">Features</a>
            <a href="#how-it-works" className="hover:text-[#00685f] transition">How it Works</a>
            <a href="#ats-check" className="hover:text-[#00685f] transition">ATS Check</a>
            <a href="#pricing" className="hover:text-[#00685f] transition">Pricing</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link 
              to="/login" 
              className="text-sm font-semibold text-slate-600 hover:text-[#131b2e] transition"
            >
              Login
            </Link>
            <Link 
              to="/login" 
              className="text-xs font-semibold px-5 py-2.5 rounded-full bg-[#00685f] text-white hover:bg-[#008378] transition shadow-md shadow-[#00685f]/10 hover:scale-[1.03] active:scale-[0.98] duration-200"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="pt-32 pb-24 max-w-[1200px] mx-auto px-6 relative z-10">
        
        {/* Hero Section */}
        <section className="flex flex-col lg:flex-row items-center gap-16 mb-32">
          
          {/* Left Hero Description */}
          <div className="flex-1 text-left flex flex-col items-start gap-6">
            <div className="bg-[#00685f]/10 border border-[#00685f]/20 text-[#00685f] px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00685f] animate-pulse" />
              <span>Resume Desk</span>
            </div>
            
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight text-[#131b2e]">
              Build a single-page resume that <span className="text-gradient">beats the ATS.</span>
            </h1>
            
            <p className="text-base md:text-lg text-slate-600 leading-relaxed max-w-xl">
              Upload your document, parse it in 5 seconds with Gemini AI, run live ATS checks, and export print-ready clickable PDFs with zero formatting lag.
            </p>
            
            <div className="flex flex-wrap items-center gap-4 mt-2">
              <Link 
                to="/login" 
                className="bg-[#00685f] hover:bg-[#008378] text-white text-sm font-semibold px-8 py-4 rounded-full transition shadow-lg shadow-[#00685f]/10 hover:-translate-y-0.5"
              >
                Create My Resume
              </Link>
              <Link 
                to="/login" 
                className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-semibold px-8 py-4 rounded-full transition flex items-center gap-2"
              >
                <Play className="w-4 h-4 text-[#00685f]" />
                <span>Watch Demo</span>
              </Link>
            </div>
          </div>
          
          {/* Right Hero Interactive Mockup */}
          <div className="flex-1 w-full relative">
            <div className="bg-white border border-slate-200 shadow-xl rounded-2xl p-4 flex flex-col md:flex-row gap-4 h-[440px] animate-float-editor hover:rotate-0 transition-transform duration-500 ease-out relative">
              
              {/* Mock Sliders Editor */}
              <div className="w-full md:w-1/3 bg-slate-50 rounded-xl p-4 flex flex-col gap-4 border border-slate-100">
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
                
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <span>Margins</span>
                    <span>24px</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="w-2/3 h-full bg-[#00685f] animate-slider" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <span>Line Height</span>
                    <span>1.6</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="w-1/2 h-full bg-[#4b41e1] animate-slider-2" />
                  </div>
                </div>
                
                <div className="mt-auto">
                  <div className="h-10 bg-[#00685f]/5 rounded-lg flex items-center justify-center gap-2 text-[#00685f] text-xs font-semibold border border-[#00685f]/15 hover:bg-[#00685f]/10 transition">
                    <Download className="w-3.5 h-3.5" /> 
                    <span>Export PDF</span>
                  </div>
                </div>
              </div>
              
              {/* Mock Canvas Preview */}
              <div className="w-full md:w-2/3 bg-white rounded-xl p-5 flex flex-col gap-4 overflow-hidden relative shadow-sm border border-slate-100">
                <div className="h-5 bg-slate-200 rounded w-1/2 mx-auto" />
                <div className="h-1.5 bg-slate-150 rounded w-3/4 mx-auto mb-2" />
                
                <div className="space-y-3">
                  <div>
                    <div className="h-3 bg-slate-200 rounded w-1/4 mb-1.5 animate-ghost-type" />
                    <div className="h-1.5 bg-slate-100 rounded w-full mb-1" />
                    <div className="h-1.5 bg-slate-100 rounded w-5/6 animate-ghost-type-2" />
                  </div>
                  
                  <div>
                    <div className="h-3 bg-slate-200 rounded w-1/5 mb-1.5 animate-ghost-type" style={{ animationDelay: '1s' }} />
                    <div className="h-1.5 bg-slate-100 rounded w-full mb-1" />
                    <div className="h-1.5 bg-slate-100 rounded w-4/5 animate-ghost-type-2" style={{ animationDelay: '1.5s' }} />
                  </div>
                </div>
                
                {/* Simulated Scanning Laser */}
                <div className="absolute top-0 left-0 w-full h-0.5 bg-[#00685f] shadow-[0_0_12px_#00685f] animate-scan" />
              </div>

            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="mb-32">
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-center mb-16 text-[#131b2e]">
            Engineered for <span className="text-gradient">Precision</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* feature 1 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-8 hover:border-[#00685f]/30 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 flex flex-col items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#00685f]/10 flex items-center justify-center text-[#00685f]">
                <UploadCloud className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-[#131b2e]">AI Gemini Parser</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Upload your existing PDF or Word document. Our advanced Gemini integration accurately extracts and structures your history instantly.
              </p>
            </div>
            
            {/* feature 2 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-8 hover:border-[#00685f]/30 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 flex flex-col items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#4b41e1]/10 flex items-center justify-center text-[#4b41e1]">
                <Sliders className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-[#131b2e]">Layout & Spacing</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Fine-tune every pixel. Adjust margins, letter spacing, and line heights with visual sliders to ensure your content fits perfectly on one page.
              </p>
            </div>
            
            {/* feature 3 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-8 hover:border-[#00685f]/30 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 flex flex-col items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#00685f]/10 flex items-center justify-center text-[#00685f]">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-[#131b2e]">ATS Scanner Engine</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Paste a job description and instantly see your match rate. Identify missing keywords and optimize your content before applying.
              </p>
            </div>

          </div>
        </section>

        {/* ATS Interactive Showcase Section */}
        <section id="ats-check" className="mb-24 flex flex-col items-center">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 md:p-12 w-full max-w-4xl flex flex-col md:flex-row items-center gap-12 shadow-sm">
            
            <div className="flex-1 text-center md:text-left">
              <h2 className="font-serif text-3xl font-semibold mb-4 text-[#131b2e]">Live ATS Match Scoring</h2>
              <p className="text-sm md:text-base text-slate-500 leading-relaxed mb-6">
                Stop guessing. Our analyzer cross-references your resume against the target job description in real-time, highlighting exact keywords you need to add.
              </p>
              
              <ul className="text-left space-y-3 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#00685f] flex-shrink-0" />
                  <span>Industry standard keyword matching</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#00685f] flex-shrink-0" />
                  <span>Action verb analysis</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#00685f] flex-shrink-0" />
                  <span>Formatting compliance check</span>
                </li>
              </ul>
            </div>
            
            {/* ATS Score Card mockup */}
            <div className="w-full md:w-80 bg-white rounded-2xl p-6 border border-slate-200 shadow-md relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-[#00685f]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="flex justify-center mb-6 relative">
                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                  <circle 
                    className="text-slate-100" 
                    cx="50" 
                    cy="50" 
                    fill="transparent" 
                    r="40" 
                    stroke="currentColor" 
                    strokeWidth="8" 
                  />
                  <circle 
                    className="text-[#00685f] transition-all duration-1000 ease-out" 
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
                  <span className="font-serif text-3xl font-bold text-[#00685f]">{atsScore}</span>
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Score</span>
                </div>
              </div>
              
              <div className="space-y-4 text-sm">
                <div>
                  <div className="text-[10px] text-slate-400 mb-1.5 uppercase font-bold tracking-wider">Matched Keywords</div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="px-2 py-0.5 bg-[#00685f]/10 text-[#00685f] rounded text-[11px] border border-[#00685f]/20 font-medium">React</span>
                    <span className="px-2 py-0.5 bg-[#00685f]/10 text-[#00685f] rounded text-[11px] border border-[#00685f]/20 font-medium">TypeScript</span>
                    <span className="px-2 py-0.5 bg-[#00685f]/10 text-[#00685f] rounded text-[11px] border border-[#00685f]/20 font-medium">UI Design</span>
                  </div>
                </div>
                
                <div>
                  <div className="text-[10px] text-slate-400 mb-1.5 uppercase font-bold tracking-wider">Missing Keywords</div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="px-2 py-0.5 bg-[#ba1a1a]/10 text-[#ba1a1a] rounded text-[11px] border border-[#ba1a1a]/20 font-medium">GraphQL</span>
                    <span className="px-2 py-0.5 bg-[#ba1a1a]/10 text-[#ba1a1a] rounded text-[11px] border border-[#ba1a1a]/20 font-medium">Redux</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="w-full py-12 px-6 flex flex-col md:flex-row justify-between items-center max-w-[1200px] mx-auto border-t border-slate-200 bg-white/60 relative z-10">
        <div className="font-sans text-lg font-bold text-[#00685f] mb-4 md:mb-0">
          ResumeCraft
        </div>
        
        <div className="text-center md:text-left mb-4 md:mb-0">
          <p className="text-xs text-slate-400">© 2024 ResumeCraft. Precision-engineered for professionals.</p>
        </div>
        
        <nav className="flex flex-wrap justify-center gap-6 text-xs font-semibold text-slate-500">
          <a href="#" className="hover:text-[#00685f] transition">Privacy Policy</a>
          <a href="#" className="hover:text-[#00685f] transition">Terms of Service</a>
          <a href="#" className="hover:text-[#00685f] transition">Contact Us</a>
          <a href="#" className="hover:text-[#00685f] transition">Twitter</a>
          <a href="#" className="hover:text-[#00685f] transition">LinkedIn</a>
        </nav>
      </footer>

    </div>
  );
}
