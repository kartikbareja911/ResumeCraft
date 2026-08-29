import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LogoIcon from '../components/LogoIcon';
import UploadResumeModal from '../components/UploadResumeModal';
import {
  AlertCircle,
  Calendar,
  Copy,
  Eye,
  FileQuestion,
  FileText,
  LogOut,
  Moon,
  MoreHorizontal,
  Plus,
  Sun,
  Trash2,
  UploadCloud,
  Sparkles,
  CheckCircle2,
  X,
  Share2
} from 'lucide-react';

export default function Dashboard() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : false;
  });
  const [resumes, setResumes] = useState(() => {
    try {
      const cached = sessionStorage.getItem('resumecraft_resumes_cache');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(() => {
    try {
      const cached = sessionStorage.getItem('resumecraft_resumes_cache');
      return !(cached && JSON.parse(cached).length > 0);
    } catch {
      return true;
    }
  });
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [previewResume, setPreviewResume] = useState(null);
  const [showWakeupWarning, setShowWakeupWarning] = useState(false);
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Sync Dark Mode state to DOM
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const firstName = (user && user.name) ? user.name.split(' ')[0] : 'there';
  const stats = useMemo(() => {
    const latest = resumes[0]?.updatedAt ? new Date(resumes[0].updatedAt) : null;
    const isInitialLoad = loading && resumes.length === 0;
    return [
      { label: 'Resumes', value: isInitialLoad ? '—' : resumes.length },
      { label: 'Templates', value: '4' },
      { label: 'Last edit', value: isInitialLoad ? '—' : (latest ? latest.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'None') },
    ];
  }, [resumes, loading]);

  const toggleTheme = () => {
    setDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem('theme', next ? 'dark' : 'light');
      return next;
    });
  };

  const fetchResumes = async (silent = false) => {
    let warningTimer;
    try {
      if (!silent && resumes.length === 0) {
        setLoading(true);
        warningTimer = setTimeout(() => {
          setShowWakeupWarning(true);
        }, 1500);
      }
      const response = await fetch('/api/resumes', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        data.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        setResumes(data);
        sessionStorage.setItem('resumecraft_resumes_cache', JSON.stringify(data));
      } else {
        if (resumes.length === 0) setError('Failed to load resumes. Please try again.');
      }
    } catch (err) {
      console.error(err);
      if (resumes.length === 0) setError('Network error loading resumes.');
    } finally {
      clearTimeout(warningTimer);
      setShowWakeupWarning(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes(resumes.length > 0);
  }, [token]);

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl + / to toggle Theme
      if (e.ctrlKey && e.key === '/') {
        e.preventDefault();
        toggleTheme();
        showToast('Theme toggled!', 'success');
      }
      // Alt + N to create new resume
      if (e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleCreateResume();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [resumes, actionLoading, darkMode]);

  const handleCreateResume = async () => {
    if (actionLoading) return;
    try {
      setActionLoading(true);
      const response = await fetch('/api/resumes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: 'Untitled Resume' }),
      });

      if (response.ok) {
        const newResume = await response.json();
        showToast('Resume created successfully!', 'success');
        navigate(`/editor/${newResume._id}`);
      } else {
        showToast('Failed to create resume.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error creating resume.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDuplicate = async (id, e) => {
    e.stopPropagation();
    if (actionLoading) return;
    try {
      setActionLoading(true);
      const response = await fetch(`/api/resumes/${id}/duplicate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        showToast('Resume duplicated successfully!', 'success');
        fetchResumes();
      } else {
        showToast('Failed to duplicate resume.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error duplicating resume.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this resume? This cannot be undone.')) {
      return;
    }
    if (actionLoading) return;

    try {
      setActionLoading(true);
      const response = await fetch(`/api/resumes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        showToast('Resume deleted successfully!', 'success');
        setResumes((prev) => {
          const updated = prev.filter((r) => r._id !== id);
          sessionStorage.setItem('resumecraft_resumes_cache', JSON.stringify(updated));
          return updated;
        });
      } else {
        showToast('Failed to delete resume.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error deleting resume.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <div className={`min-h-screen transition-colors ${darkMode ? 'workspace-shell text-slate-100' : 'app-shell text-slate-900'}`}>
      <header className={`sticky top-0 z-30 border-b backdrop-blur-xl ${darkMode ? 'border-teal-300/15 bg-slate-950/78 shadow-lg shadow-teal-950/20' : 'border-white/70 bg-white/72'}`}>
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2.5">
            <LogoIcon className="w-6.5 h-6.5" strokeWidth={2.3} />
            <span className="font-heading text-xl font-extrabold">ResumeCraft</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="mr-2 hidden text-right sm:block">
              <p className="text-sm font-semibold">{user?.name}</p>
              <p className={`text-xs ${darkMode ? 'text-slate-300' : 'text-slate-500'}`}>{user?.email}</p>
            </div>
            <button
              onClick={toggleTheme}
              className={`rounded-lg border p-2 transition ${darkMode ? 'border-amber-300/20 bg-amber-300/10 text-amber-200 hover:border-amber-200/40 hover:bg-amber-300/16' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              onClick={logout}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${darkMode ? 'border-teal-300/15 bg-slate-900/70 text-slate-100 hover:border-teal-300/35 hover:bg-slate-800/90' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {showWakeupWarning && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-300 animate-pulse">
            <Sparkles className="h-5 w-5 text-amber-400 flex-shrink-0" />
            <div>
              <p className="font-bold text-amber-200">Server is waking up...</p>
              <p className="text-xs text-amber-300/80 mt-0.5">
                We are hosted on Render Free Tier. The database/backend takes about 30–50 seconds to boot up after inactivity. Thank you for your patience!
              </p>
            </div>
          </div>
        )}

        <section className={`rounded-2xl border p-6 sm:p-8 ${darkMode ? 'surface-dark' : 'border-white/80 bg-white/82 shadow-xl shadow-slate-300/30'}`}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className={`text-sm font-bold uppercase ${darkMode ? 'text-teal-200' : 'text-teal-700'}`}>Resume desk</p>
              <h1 className="mt-3 font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
                Good to see you, {firstName}
              </h1>
              <p className={`mt-3 max-w-2xl text-sm leading-6 ${darkMode ? 'text-slate-200/85' : 'text-slate-600'}`}>
                Keep every resume version organized, open the editor fast, and export the right document for each role.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowUploadModal(true)}
                disabled={actionLoading}
                className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-bold shadow-lg transition border disabled:opacity-60 ${
                  darkMode
                    ? 'border-teal-400/30 bg-slate-900/80 text-teal-300 shadow-teal-950/30 hover:bg-slate-800/90 hover:border-teal-400'
                    : 'border-teal-200 bg-teal-50/80 text-teal-800 shadow-sm hover:bg-teal-100 hover:border-teal-300'
                }`}
              >
                <UploadCloud className="h-5 w-5" />
                Upload Resume
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-teal-400/20 text-teal-300 border border-teal-400/30 ml-1">
                  AI
                </span>
              </button>
              <button
                onClick={handleCreateResume}
                disabled={actionLoading}
                className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-bold shadow-lg transition disabled:opacity-60 ${
                  darkMode
                    ? 'bg-gradient-to-r from-teal-400 to-emerald-300 text-slate-950 shadow-teal-950/40 hover:from-teal-300 hover:to-amber-300'
                    : 'bg-teal-600 text-white shadow-teal-600/20 hover:bg-teal-700'
                }`}
              >
                <Plus className="h-5 w-5" />
                New resume
              </button>
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className={`rounded-xl border p-4 ${darkMode ? 'border-teal-300/15 bg-slate-900/62 shadow-sm shadow-black/20' : 'border-slate-200 bg-slate-50/80'}`}>
                <p className={`text-xs font-bold uppercase ${darkMode ? 'text-teal-100/70' : 'text-slate-500'}`}>{stat.label}</p>
                <p className="mt-2 font-heading text-2xl font-extrabold">{stat.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center text-[11px] text-slate-450 dark:text-slate-500 select-none">
            <span>⚡ Keyboard Shortcuts: <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-850 font-mono font-bold">Ctrl + /</kbd> Toggle Theme &nbsp;|&nbsp; <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-850 font-mono font-bold">Alt + N</kbd> Create Resume</span>
          </div>
        </section>

        {error && (
          <div className="mt-6 flex items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError('')} className="font-bold">Dismiss</button>
          </div>
        )}

        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-xl font-extrabold">Your resumes</h2>
            <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-500'}`}>{resumes.length} saved</p>
          </div>

          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div 
                  key={item} 
                  className={`p-5 rounded-xl border flex flex-col gap-4 animate-pulse ${
                    darkMode ? 'border-teal-300/15 bg-slate-900/40' : 'border-slate-200 bg-white shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-lg bg-slate-200 dark:bg-slate-800" />
                    <div className="flex gap-2">
                      <div className="w-8 h-8 rounded-md bg-slate-100 dark:bg-slate-850" />
                      <div className="w-8 h-8 rounded-md bg-slate-100 dark:bg-slate-850" />
                      <div className="w-8 h-8 rounded-md bg-slate-100 dark:bg-slate-850" />
                    </div>
                  </div>
                  <div className="h-6 w-3/4 rounded-md bg-slate-200 dark:bg-slate-800 mt-2" />
                  <div className="h-3.5 w-1/2 rounded bg-slate-150 dark:bg-slate-850 mt-1" />
                  <div className="h-8 rounded bg-slate-100 dark:bg-slate-850 mt-auto flex items-center justify-between px-3" />
                </div>
              ))}
            </div>
          ) : resumes.length === 0 ? (
            <div className={`mx-auto mt-10 max-w-xl rounded-2xl border p-10 text-center ${darkMode ? 'surface-dark' : 'border-slate-200 bg-white shadow-lg shadow-slate-200/70'}`}>
              <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-xl ${darkMode ? 'bg-teal-300/12 text-teal-200 ring-1 ring-teal-200/20' : 'bg-teal-50 text-teal-700'}`}>
                <FileQuestion className="h-7 w-7" />
              </div>
              <h3 className="mt-5 font-heading text-2xl font-extrabold">No resumes yet</h3>
              <p className={`mx-auto mt-2 max-w-sm text-sm leading-6 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                Upload an existing resume to convert it with Gemini AI, or start with a fresh blank template.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => setShowUploadModal(true)}
                  disabled={actionLoading}
                  className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-bold shadow-lg transition border disabled:opacity-60 ${
                    darkMode
                      ? 'border-teal-400/30 bg-slate-900/90 text-teal-300 hover:bg-slate-800'
                      : 'border-teal-300 bg-teal-50 text-teal-800 hover:bg-teal-100'
                  }`}
                >
                  <UploadCloud className="h-5 w-5" />
                  Upload Resume (PDF/DOCX)
                </button>
                <button
                  onClick={handleCreateResume}
                  disabled={actionLoading}
                  className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-bold transition disabled:opacity-60 ${
                    darkMode
                      ? 'bg-gradient-to-r from-teal-400 to-emerald-300 text-slate-950 shadow-lg shadow-teal-950/35 hover:from-teal-300 hover:to-amber-300'
                      : 'bg-slate-950 text-white hover:bg-slate-800'
                  }`}
                >
                  <Plus className="h-5 w-5" />
                  Create blank resume
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {resumes.map((resume) => (
                <article
                  key={resume._id}
                  onClick={() => navigate(`/editor/${resume._id}`)}
                  className={`group cursor-pointer rounded-xl border p-5 transition hover:-translate-y-0.5 ${darkMode ? 'border-teal-300/15 bg-slate-900/70 shadow-lg shadow-black/20 hover:border-amber-300/45 hover:bg-slate-800/85 hover:shadow-teal-950/30' : 'border-slate-200 bg-white shadow-sm shadow-slate-200/70 hover:border-teal-300 hover:shadow-xl hover:shadow-slate-200/80'}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${darkMode ? 'bg-gradient-to-br from-teal-300/20 to-amber-300/15 text-teal-100 ring-1 ring-teal-200/20' : 'bg-teal-50 text-teal-700'}`}>
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:transition sm:group-hover:opacity-100">
                      <button
                        title="Preview resume"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewResume(resume);
                        }}
                        className={`rounded-md p-2 transition ${darkMode ? 'text-slate-300 hover:bg-teal-300/10 hover:text-teal-100' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        title="Duplicate resume"
                        disabled={actionLoading}
                        onClick={(e) => handleDuplicate(resume._id, e)}
                        className={`rounded-md p-2 transition ${darkMode ? 'text-slate-300 hover:bg-teal-300/10 hover:text-teal-100' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        title="Copy editor share link"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(`${window.location.origin}/editor/${resume._id}`);
                          showToast('Editor share link copied!', 'success');
                        }}
                        className={`rounded-md p-2 transition ${darkMode ? 'text-slate-300 hover:bg-teal-300/10 hover:text-teal-100' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
                      >
                        <Share2 className="h-4 w-4" />
                      </button>
                      <button
                        title="Delete resume"
                        disabled={actionLoading}
                        onClick={(e) => handleDelete(resume._id, e)}
                        className="rounded-md p-2 text-slate-550 transition hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="mt-5 truncate font-heading text-xl font-extrabold">{resume.title}</h3>
                  <div className={`mt-6 border-t pt-4 text-sm ${darkMode ? 'border-teal-300/15 text-slate-300' : 'border-slate-100 text-slate-500'}`}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {formatDate(resume.updatedAt)}
                      </span>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${darkMode ? 'bg-amber-300/10 text-amber-100 ring-1 ring-amber-200/10' : 'bg-slate-100 text-slate-600'}`}>
                        <MoreHorizontal className="h-3.5 w-3.5" />
                        Open
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <UploadResumeModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={(newResume) => {
          fetchResumes();
          navigate(`/editor/${newResume._id}`);
        }}
      />

      {previewResume && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6"
          onClick={() => setPreviewResume(null)}
        >
          <div 
            className={`w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden ${darkMode ? 'bg-slate-900 border border-teal-300/15 text-slate-100' : 'bg-white border border-slate-200 text-slate-950'}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={`flex items-center justify-between px-6 py-4 border-b ${darkMode ? 'border-teal-300/10' : 'border-slate-100'}`}>
              <div className="flex items-center gap-2.5">
                <Eye className="h-5 w-5 text-teal-400" />
                <span className="font-heading text-lg font-bold truncate max-w-[280px] sm:max-w-[450px]">
                  {previewResume.title}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/editor/${previewResume._id}`)}
                  className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition shadow-lg shadow-teal-600/10"
                >
                  Edit Resume
                </button>
                <button
                  onClick={() => setPreviewResume(null)}
                  className={`p-2 rounded-lg border transition ${darkMode ? 'border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white' : 'border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-950'}`}
                >
                  <Plus className="h-4 w-4 rotate-45" />
                </button>
              </div>
            </div>

            {/* Modal Body - Scrollable Resume Sheet */}
            <div className={`flex-1 overflow-y-auto p-6 sm:p-8 ${darkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
              <div 
                className="bg-white text-slate-950 shadow-lg border border-slate-200 rounded-sm mx-auto min-h-[297mm] text-[13px] text-justify select-text"
                style={{ 
                  fontFamily: previewResume.content?.styles?.fontFamily || 'EB Garamond',
                  paddingTop: previewResume.content?.styles?.marginY || '24px',
                  paddingBottom: previewResume.content?.styles?.marginY || '24px',
                  paddingLeft: previewResume.content?.styles?.marginX || '24px',
                  paddingRight: previewResume.content?.styles?.marginX || '24px',
                  color: '#0f172a'
                }}
              >
                {/* Header (Personal Info) */}
                {(() => {
                  const personalInfo = previewResume.content?.personalInfo || {};
                  return (
                    <div className="text-center space-y-1">
                      <h2 
                        className="text-2xl font-extrabold tracking-tight uppercase"
                        style={{ 
                          fontFamily: previewResume.content?.styles?.nameFontFamily === 'same-as-body' 
                            ? (previewResume.content?.styles?.fontFamily || 'EB Garamond')
                            : (previewResume.content?.styles?.nameFontFamily || 'EB Garamond')
                        }}
                      >
                        {personalInfo.name || 'Your Name'}
                      </h2>
                      {personalInfo.title && (
                        <p className="text-[0.9em] font-bold tracking-widest uppercase text-slate-800">
                          {personalInfo.title}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-1 text-[0.85em] text-slate-700 font-medium mt-2">
                        {personalInfo.email && <span>{personalInfo.email}</span>}
                        {personalInfo.phone && <span>{personalInfo.phone}</span>}
                        {personalInfo.location && <span>{personalInfo.location}</span>}
                        {personalInfo.website && (
                          <a 
                            href={personalInfo.website.startsWith('http') ? personalInfo.website : `https://${personalInfo.website}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-slate-800 hover:text-indigo-600 underline decoration-dotted"
                          >
                            {personalInfo.website}
                          </a>
                        )}
                        {personalInfo.github && (
                          <a 
                            href={`https://github.com/${personalInfo.github}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-slate-800 hover:text-indigo-600 underline decoration-dotted"
                          >
                            github.com/{personalInfo.github}
                          </a>
                        )}
                        {personalInfo.linkedin && (
                          <a 
                            href={`https://linkedin.com/in/${personalInfo.linkedin}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-slate-800 hover:text-indigo-600 underline decoration-dotted"
                          >
                            linkedin.com/in/{personalInfo.linkedin}
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Resume Sections */}
                {(() => {
                  const content = previewResume.content || {};
                  const styles = content.styles || {};
                  const sections = content.sections || [];
                  
                  const renderBulletDescription = (description) => {
                    if (!description) return null;
                    const lines = description
                      .split(/\r?\n/)
                      .map(l => l.trim())
                      .filter(Boolean);

                    if (lines.length === 0) return null;

                    return (
                      <ul className="space-y-1 mt-1 text-[0.88em] text-slate-950 leading-relaxed pl-1">
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

                  return sections.filter(s => s.visible).map((section) => (
                    <div 
                      key={section.id} 
                      className="space-y-2 text-[1em]" 
                      style={{ marginTop: styles.sectionSpacing || '16px' }}
                    >
                      <h3 
                        className="text-[0.95em] font-extrabold uppercase tracking-wider border-b-2 pb-0.5 flex items-center gap-1.5"
                        style={{ 
                          color: styles.primaryColor || '#0f172a', 
                          borderColor: styles.primaryColor || '#0f172a' 
                        }}
                      >
                        {section.name}
                      </h3>

                      {section.id === 'summary' && section.text && (
                        <p className="text-[0.9em] text-slate-950 leading-relaxed text-justify">
                          {section.text}
                        </p>
                      )}

                      {(section.id === 'experience' || section.id === 'education' || section.id === 'projects' || section.id === 'certificates') && (
                        <div className="space-y-3" style={{ gap: styles.itemSpacing || '8px' }}>
                          {section.items?.map((item) => (
                            <div 
                              key={item.id} 
                              className="space-y-0.5"
                              style={{ marginTop: styles.itemSpacing || '8px' }}
                            >
                              <div className="flex justify-between items-baseline">
                                <span className="text-[0.92em] font-bold text-slate-950">
                                  {item.position || item.degree || item.name || 'Title'}
                                  {(item.company || item.school || item.issuer) ? (
                                    <span className="font-normal italic text-slate-800">
                                      , {item.company || item.school || item.issuer}
                                    </span>
                                  ) : ''}
                                </span>
                                <span className="text-[0.85em] text-slate-800 font-medium tracking-tight">
                                  {item.startDate
                                    ? `${item.startDate}${item.endDate ? ` – ${item.endDate}` : item.endDate === '' ? ' – Present' : ''}`
                                    : item.date || ''}
                                </span>
                              </div>
                              {renderBulletDescription(item.description)}
                            </div>
                          ))}
                        </div>
                      )}

                      {section.id === 'skills' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-[0.88em] pl-0.5">
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-[0.88em] pl-0.5">
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
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Floating Toast Notification Popup */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xl animate-fade-in transition-all">
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-500" />
          )}
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{toast.message}</span>
          <button 
            onClick={() => setToast(null)} 
            className="ml-2 text-slate-400 hover:text-slate-650 dark:hover:text-slate-350"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
