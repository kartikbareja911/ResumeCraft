import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, ArrowRight, CheckCircle2, FileText, UserPlus, Eye, EyeOff } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      return setError('Please fill in all fields');
    }

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    if (password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    setError('');
    setLoading(true);

    const result = await signup(name, email, password);
    setLoading(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || 'Failed to create account');
    }
  };

  return (
    <div className="app-shell min-h-screen px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-[2rem] border border-white/80 bg-white/72 shadow-2xl shadow-slate-300/40 backdrop-blur lg:grid-cols-[0.95fr_1.05fr]">
        <section className="hidden border-r border-slate-200 bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-teal-500 p-2.5 shadow-lg shadow-teal-950/40">
              <FileText className="h-6 w-6" />
            </div>
            <span className="font-heading text-2xl font-bold">ResumeCraft</span>
          </div>

          <div className="space-y-5">
            <h2 className="font-heading text-4xl font-extrabold leading-tight">
              Make every application look intentional.
            </h2>
            {['Structured resume builder', 'Live A4 preview', 'PDF export workflow'].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm text-slate-200">
                <CheckCircle2 className="h-5 w-5 text-teal-400" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/8 p-5">
            <p className="text-xs font-semibold uppercase text-teal-300">Workspace ready</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Draft content, compare layouts, tune typography, and export a polished resume from one place.
            </p>
          </div>
        </section>

        <main className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-lg">
            <div className="mb-10 lg:hidden">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-slate-950 p-2.5 text-white">
                  <FileText className="h-6 w-6" />
                </div>
                <span className="font-heading text-2xl font-bold">ResumeCraft</span>
              </div>
            </div>

            <p className="text-sm font-semibold uppercase text-teal-700">Start building</p>
            <h1 className="mt-3 font-heading text-4xl font-extrabold tracking-tight text-slate-950">
              Create your resume workspace
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Set up your account and jump straight into editing your first professional resume.
            </p>

            {error && (
              <div className="mt-6 flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form className="mt-8 grid gap-5 sm:grid-cols-2" onSubmit={handleSubmit}>
              <div className="sm:col-span-2">
                <label htmlFor="name" className="text-sm font-semibold text-slate-700">
                  Full name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-premium mt-2"
                  placeholder="John Doe"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="email" className="text-sm font-semibold text-slate-700">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
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
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-premium pr-10"
                    placeholder="Minimum 6 characters"
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

              <div>
                <label htmlFor="confirmPassword" className="text-sm font-semibold text-slate-700">
                  Confirm password
                </label>
                <div className="relative mt-2">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-premium pr-10"
                    placeholder="Repeat password"
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
                className="sm:col-span-2 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <UserPlus className="h-5 w-5" />
                    Create account
                  </>
                )}
              </button>
            </form>

            <p className="mt-8 text-sm text-slate-600">
              Already have an account?{' '}
              <Link to="/login" className="inline-flex items-center gap-1 font-bold text-teal-700 hover:text-teal-800">
                Sign in <ArrowRight className="h-4 w-4" />
              </Link>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
