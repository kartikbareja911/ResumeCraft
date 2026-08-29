import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, ArrowRight, FileText, LogIn, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return setError('Please fill in all fields');
    }

    setError('');
    setLoading(true);

    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || 'Invalid credentials');
    }
  };

  return (
    <div className="app-shell min-h-screen px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-[2rem] border border-white/80 bg-white/72 shadow-2xl shadow-slate-300/40 backdrop-blur lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden border-r border-slate-200 bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-teal-500 p-2.5 shadow-lg shadow-teal-950/40">
              <FileText className="h-6 w-6" />
            </div>
            <span className="font-heading text-2xl font-bold">ResumeCraft</span>
          </div>

          <div className="mx-auto w-full max-w-md">
            <div className="rounded-2xl bg-white p-6 text-slate-900 shadow-2xl shadow-black/30">
              <div className="border-b border-slate-200 pb-4">
                <p className="font-heading text-2xl font-extrabold">Aarav Mehta</p>
                <p className="mt-1 text-xs font-semibold uppercase text-teal-700">Product Engineer</p>
                <div className="mt-3 flex gap-2 text-[10px] text-slate-500">
                  <span>aarav@email.com</span>
                  <span>|</span>
                  <span>Bengaluru</span>
                  <span>|</span>
                  <span>LinkedIn</span>
                </div>
              </div>
              <div className="mt-5 space-y-5">
                {['Profile', 'Experience', 'Projects', 'Skills'].map((section, index) => (
                  <div key={section}>
                    <div className="mb-2 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-teal-600" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700">{section}</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="h-2 rounded-full bg-slate-200" style={{ width: `${86 - index * 8}%` }} />
                      <div className="h-2 rounded-full bg-slate-100" style={{ width: `${68 - index * 5}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="max-w-md text-sm leading-6 text-slate-300">
            A focused resume workspace for drafting, styling, previewing, and exporting polished A4 resumes.
          </p>
        </section>

        <main className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">
            <div className="mb-10 lg:hidden">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-slate-950 p-2.5 text-white">
                  <FileText className="h-6 w-6" />
                </div>
                <span className="font-heading text-2xl font-bold">ResumeCraft</span>
              </div>
            </div>

            <p className="text-sm font-semibold uppercase text-teal-700">Welcome back</p>
            <h1 className="mt-3 font-heading text-4xl font-extrabold tracking-tight text-slate-950">
              Sign in to your resume desk
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Continue editing resumes, tune layouts, and download the latest version when it is ready.
            </p>

            {error && (
              <div className="mt-6 flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="text-sm font-semibold text-slate-700">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-premium mt-2"
                  placeholder="name@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="text-sm font-semibold text-slate-700">
                  Password
                </label>
                <div className="relative mt-2">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-premium pr-10"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-650"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <LogIn className="h-5 w-5" />
                    Sign in
                  </>
                )}
              </button>
            </form>

            <p className="mt-8 text-sm text-slate-600">
              New here?{' '}
              <Link to="/register" className="inline-flex items-center gap-1 font-bold text-teal-700 hover:text-teal-800">
                Create an account <ArrowRight className="h-4 w-4" />
              </Link>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
