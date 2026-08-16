import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  AlertCircle,
  Calendar,
  Copy,
  FileQuestion,
  FileText,
  LogOut,
  Moon,
  MoreHorizontal,
  Plus,
  Sun,
  Trash2,
} from 'lucide-react';

export default function Dashboard() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : false;
  });
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const firstName = user?.name?.split(' ')[0] || 'there';
  const stats = useMemo(() => {
    const latest = resumes[0]?.updatedAt ? new Date(resumes[0].updatedAt) : null;
    return [
      { label: 'Resumes', value: resumes.length },
      { label: 'Templates', value: '4' },
      { label: 'Last edit', value: latest ? latest.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'None' },
    ];
  }, [resumes]);

  const toggleTheme = () => {
    setDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem('theme', next ? 'dark' : 'light');
      return next;
    });
  };

  const fetchResumes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/resumes', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        data.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        setResumes(data);
      } else {
        setError('Failed to load resumes. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError('Network error loading resumes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, [token]);

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
        navigate(`/editor/${newResume._id}`);
      } else {
        setError('Failed to create resume.');
      }
    } catch (err) {
      console.error(err);
      setError('Network error creating resume.');
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
        fetchResumes();
      } else {
        setError('Failed to duplicate resume.');
      }
    } catch (err) {
      console.error(err);
      setError('Network error duplicating resume.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (actionLoading) return;
    if (!confirm('Delete this resume? This cannot be undone.')) return;

    try {
      setActionLoading(true);
      const response = await fetch(`/api/resumes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        fetchResumes();
      } else {
        setError('Failed to delete resume.');
      }
    } catch (err) {
      console.error(err);
      setError('Network error deleting resume.');
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
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-3">
            <div className={`rounded-xl p-2.5 shadow-lg ${darkMode ? 'bg-gradient-to-br from-teal-300 to-amber-300 text-slate-950 shadow-teal-950/30' : 'bg-slate-950 text-white shadow-slate-300/40'}`}>
              <FileText className="h-5 w-5" />
            </div>
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
            <button
              onClick={handleCreateResume}
              disabled={actionLoading}
              className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-bold shadow-lg transition disabled:opacity-60 ${darkMode ? 'bg-gradient-to-r from-teal-400 to-emerald-300 text-slate-950 shadow-teal-950/40 hover:from-teal-300 hover:to-amber-300' : 'bg-teal-600 text-white shadow-teal-600/20 hover:bg-teal-700'}`}
            >
              <Plus className="h-5 w-5" />
              New resume
            </button>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className={`rounded-xl border p-4 ${darkMode ? 'border-teal-300/15 bg-slate-900/62 shadow-sm shadow-black/20' : 'border-slate-200 bg-slate-50/80'}`}>
                <p className={`text-xs font-bold uppercase ${darkMode ? 'text-teal-100/70' : 'text-slate-500'}`}>{stat.label}</p>
                <p className="mt-2 font-heading text-2xl font-extrabold">{stat.value}</p>
              </div>
            ))}
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
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className={`h-56 animate-pulse rounded-xl border ${darkMode ? 'border-teal-300/15 bg-slate-900/60' : 'border-slate-200 bg-white/70'}`} />
              ))}
            </div>
          ) : resumes.length === 0 ? (
            <div className={`mx-auto mt-10 max-w-xl rounded-2xl border p-10 text-center ${darkMode ? 'surface-dark' : 'border-slate-200 bg-white shadow-lg shadow-slate-200/70'}`}>
              <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-xl ${darkMode ? 'bg-teal-300/12 text-teal-200 ring-1 ring-teal-200/20' : 'bg-teal-50 text-teal-700'}`}>
                <FileQuestion className="h-7 w-7" />
              </div>
              <h3 className="mt-5 font-heading text-2xl font-extrabold">No resumes yet</h3>
              <p className={`mx-auto mt-2 max-w-sm text-sm leading-6 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                Create your first resume and start shaping the content, template, spacing, and PDF output.
              </p>
              <button
                onClick={handleCreateResume}
                disabled={actionLoading}
                className={`mt-6 inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-bold transition disabled:opacity-60 ${darkMode ? 'bg-gradient-to-r from-teal-400 to-emerald-300 text-slate-950 shadow-lg shadow-teal-950/35 hover:from-teal-300 hover:to-amber-300' : 'bg-slate-950 text-white hover:bg-slate-800'}`}
              >
                <Plus className="h-5 w-5" />
                Create resume
              </button>
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
                        title="Duplicate resume"
                        disabled={actionLoading}
                        onClick={(e) => handleDuplicate(resume._id, e)}
                        className={`rounded-md p-2 transition ${darkMode ? 'text-slate-300 hover:bg-teal-300/10 hover:text-teal-100' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        title="Delete resume"
                        disabled={actionLoading}
                        onClick={(e) => handleDelete(resume._id, e)}
                        className="rounded-md p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
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
    </div>
  );
}
