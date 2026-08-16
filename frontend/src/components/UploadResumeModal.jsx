import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Sparkles,
  FileCode,
  FileSpreadsheet,
  ArrowRight
} from 'lucide-react';

export default function UploadResumeModal({ isOpen, onClose, onSuccess, targetResumeId = null }) {
  const { token } = useAuth();
  const [file, setFile] = useState(null);
  const [customTitle, setCustomTitle] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentStage, setCurrentStage] = useState(0); // 0: upload, 1: AI extract, 2: finalizing
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const supportedFormats = [
    { label: 'PDF', ext: '.pdf', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
    { label: 'DOCX', ext: '.docx', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    { label: 'TXT', ext: '.txt', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    { label: 'JSON', ext: '.json', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' }
  ];

  const handleFileSelect = (selectedFile) => {
    setError('');
    if (!selectedFile) return;

    const validExts = ['.pdf', '.docx', '.doc', '.txt', '.md', '.json'];
    const ext = '.' + selectedFile.name.split('.').pop().toLowerCase();

    if (!validExts.includes(ext)) {
      setError('Please select a supported file format (.pdf, .docx, .txt, .json).');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File is too large. Maximum size is 10MB.');
      return;
    }

    setFile(selectedFile);
    if (!customTitle) {
      const cleanName = selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setCustomTitle(cleanName);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    try {
      setUploading(true);
      setError('');
      setCurrentStage(0);

      const formData = new FormData();
      formData.append('resumeFile', file);
      if (customTitle.trim()) {
        formData.append('title', customTitle.trim());
      }

      // Stage progression simulation for nice UX
      const stageTimer1 = setTimeout(() => setCurrentStage(1), 1200);
      const stageTimer2 = setTimeout(() => setCurrentStage(2), 3500);

      const endpoint = targetResumeId ? `/api/resumes/${targetResumeId}/import` : '/api/resumes/upload';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload and parse resume.');
      }

      setCurrentStage(3);
      setTimeout(() => {
        if (onSuccess) onSuccess(data);
        onClose();
      }, 700);
    } catch (err) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred while parsing the resume.');
    } finally {
      setUploading(false);
    }
  };

  const stages = [
    'Reading and extracting document text...',
    'Gemini AI structuring sections, experience & skills...',
    'Saving formatted resume workspace...',
    'Ready! Launching editor...'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-xl bg-slate-900 border border-teal-300/20 rounded-2xl shadow-2xl shadow-teal-950/40 p-6 text-slate-100 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow accent */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400/20 to-emerald-400/10 border border-teal-400/30 flex items-center justify-center text-teal-300">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Upload & AI-Parse Resume
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-teal-400/15 text-teal-300 border border-teal-400/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Gemini
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {targetResumeId ? 'Import and replace content in your current resume' : 'Upload an existing resume to edit with ATS scoring'}
              </p>
            </div>
          </div>
          {!uploading && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="mt-5 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Drag & Drop Box */}
          {!uploading ? (
            <>
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${
                  isDragging
                    ? 'border-teal-400 bg-teal-400/10 scale-[0.99]'
                    : file
                    ? 'border-teal-400/50 bg-slate-950/60'
                    : 'border-slate-700/80 hover:border-teal-400/50 bg-slate-950/40 hover:bg-slate-950/70'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.doc,.txt,.json,.md"
                  className="hidden"
                  onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                />

                {file ? (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-teal-400/30 text-left">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-teal-400/15 border border-teal-400/30 flex items-center justify-center text-teal-300 flex-shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{file.name}</p>
                        <p className="text-xs text-slate-400">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 py-4">
                    <div className="w-12 h-12 rounded-2xl bg-teal-400/10 border border-teal-400/20 text-teal-300 mx-auto flex items-center justify-center">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-200">
                        Drag and drop your resume file here, or <span className="text-teal-400 font-semibold underline">browse</span>
                      </p>
                      <p className="text-xs text-slate-400 mt-1">Supports PDF, DOCX, TXT, or JSON (Up to 10MB)</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Supported Format Pills */}
              <div className="flex items-center justify-center gap-2 pt-1">
                {supportedFormats.map((f) => (
                  <span
                    key={f.ext}
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border ${f.color}`}
                  >
                    {f.label}
                  </span>
                ))}
              </div>

              {/* Title input field */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Resume Title (Optional)
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g., Software Engineer Resume 2026"
                  className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-700 text-sm text-white placeholder-slate-500 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/20 transition"
                />
              </div>
            </>
          ) : (
            /* Uploading & AI Parsing Progress State */
            <div className="py-8 space-y-6 text-center">
              <div className="relative w-16 h-16 mx-auto">
                <div className="w-16 h-16 rounded-full border-4 border-teal-400/20 border-t-teal-400 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center text-teal-300">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Extracting & Structuring Resume</h3>
                <p className="text-xs text-teal-300/90 font-medium h-5 transition-all">
                  {stages[currentStage] || stages[0]}
                </p>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-teal-400 to-emerald-400 h-full transition-all duration-500 rounded-full"
                  style={{ width: `${Math.min(100, (currentStage + 1) * 28)}%` }}
                />
              </div>

              <p className="text-[11px] text-slate-400">
                Gemini AI is parsing work experience, education, bullet points, and skills into your editable editor workspace.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {!uploading && (
          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUpload}
              disabled={!file}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg ${
                file
                  ? 'bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 hover:opacity-95 shadow-teal-950/40 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              Upload & Parse with AI
              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
