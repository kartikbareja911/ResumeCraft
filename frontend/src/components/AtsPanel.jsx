import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, CheckCircle, AlertCircle, Loader2, Sparkles } from 'lucide-react';

const AtsPanel = ({ resume, onClose }) => {
  const { token } = useAuth();
  const [jobDescription, setJobDescription] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleScan = async () => {
    if (!jobDescription.trim()) {
      setError('Please paste a job description');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/ats/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ resumeId: resume._id, jobDescription }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Scan failed');
      }
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 60) return 'text-amber-600 dark:text-amber-400';
    return 'text-rose-600 dark:text-rose-400';
  };

  const getSeverityColor = (severity) => {
    if (severity === 'high') return 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20';
    if (severity === 'medium') return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20';
    return 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700';
  };

  const getPriorityColor = (priority) => {
    if (priority === 'high') return 'border-l-4 border-rose-500';
    if (priority === 'medium') return 'border-l-4 border-amber-500';
    return 'border-l-4 border-teal-500';
  };

  if (!resume) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 no-print">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl bg-white dark:bg-slate-950 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold text-slate-900 dark:text-white">ATS Score Check</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{resume.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!result ? (
            // Input state
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Paste Job Description
                </label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={8}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 resize-none transition"
                  placeholder="Paste the full job description here (requirements, responsibilities, keywords, etc.)"
                />
              </div>
              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10 p-3 text-sm text-rose-700 dark:text-rose-300">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <button
                onClick={handleScan}
                disabled={loading || !jobDescription.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-teal-600 text-white font-semibold text-sm shadow-lg shadow-teal-600/20 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing with Gemini...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Run ATS Scan
                  </>
                )}
              </button>
              <p className="text-xs text-center text-slate-500 dark:text-slate-400">
                Powered by Google Gemini AI • Your resume content is sent securely for analysis
              </p>
            </div>
          ) : (
            // Results state
            <div className="space-y-6 animate-slide-up">
              {/* Overall Score */}
              <div className="flex items-start justify-between gap-6">
                <div className="flex-shrink-0 w-28 h-28">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="56"
                      cy="56"
                      r="50"
                      fill="none"
                      stroke="#e2e8f0"
                      strokeWidth="8"
                      className="dark:stroke-slate-800"
                    />
                    <circle
                      cx="56"
                      cy="56"
                      r="50"
                      fill="none"
                      stroke={getScoreColor(result.overallScore).replace('text-', '')}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${(result.overallScore / 100) * 314} 314`}
                      className="transition-all duration-1000"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Overall ATS Score</p>
                  <p className={`font-heading text-4xl font-bold ${getScoreColor(result.overallScore)}`}>{result.overallScore}/100</p>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    {result.overallScore >= 80 ? 'Excellent match — your resume is well-optimized for this role.' :
                     result.overallScore >= 60 ? 'Good foundation — some improvements will strengthen your application.' :
                     'Needs work — significant gaps to address for ATS compatibility.'}
                  </p>
                </div>
              </div>

              {/* Section Scores */}
              <div className="space-y-3">
                <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white">Category Breakdown</h3>
                <div className="grid gap-3 sm:grid-cols-3">
                  {Object.entries(result.sections).map(([key, val]) => (
                    <div key={key} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </p>
                      <div className="mt-2 h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${getScoreColor(val.score).replace('text-', 'bg-')}`}
                          style={{ width: `${val.score}%` }}
                        />
                      </div>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{val.score}/100</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{val.notes}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Keywords */}
              {(result.matchedKeywords?.length || result.missingKeywords?.length) && (
                <div className="space-y-4">
                  <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white">Keyword Analysis</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {result.matchedKeywords?.length && (
                      <div className="rounded-xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 p-4">
                        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 mb-2">
                          <CheckCircle className="w-4 h-4" />
                          <span className="font-semibold">Matched Keywords ({result.matchedKeywords.length})</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {result.matchedKeywords.slice(0, 20).map((kw) => (
                            <span key={kw} className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {result.missingKeywords?.length && (
                      <div className="rounded-xl border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10 p-4">
                        <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 mb-2">
                          <AlertCircle className="w-4 h-4" />
                          <span className="font-semibold">Missing Keywords ({result.missingKeywords.length})</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {result.missingKeywords.slice(0, 20).map((kw) => (
                            <span key={kw} className="px-2 py-1 rounded-full text-xs font-medium bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300">
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Formatting Issues */}
              {result.formattingIssues?.length && (
                <div className="space-y-3">
                  <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white">Formatting & Parsability</h3>
                  <div className="space-y-2">
                    {result.formattingIssues.map((issue, i) => (
                      <div key={i} className={`flex items-start gap-3 rounded-lg p-3 ${getSeverityColor(issue.severity)}`}>
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-slate-700 dark:text-slate-300">{issue.note}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {result.suggestions?.length && (
                <div className="space-y-3">
                  <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white">Suggestions</h3>
                  <div className="space-y-2">
                    {result.suggestions.map((s, i) => (
                      <div key={i} className={`flex items-start gap-3 rounded-lg p-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 ${getPriorityColor(s.priority)}`}>
                        <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-1.5" style={{
                          backgroundColor: s.priority === 'high' ? '#f43f5e' : s.priority === 'medium' ? '#f59e0b' : '#14b8a6'
                        }} />
                        <span className="text-sm text-slate-700 dark:text-slate-300">{s.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rescan button */}
              <button
                onClick={() => { setResult(null); setJobDescription(''); }}
                className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                <Sparkles className="w-4 h-4" />
                Scan Another Job Description
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AtsPanel;