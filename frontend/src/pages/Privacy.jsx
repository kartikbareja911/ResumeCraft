import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import SEO from '../components/SEO';

export default function Privacy() {
  return (
    <div className="app-shell min-h-screen px-4 py-12 text-slate-900 sm:px-6">
      <SEO
        title="Privacy Policy"
        description="How ResumeCraft collects, uses, and protects your data: resume content stored on your device and secure servers, no resale of personal information, and full control over deletion."
        path="/privacy"
      />
      <main className="mx-auto max-w-3xl rounded-[2rem] border border-white/80 bg-white/72 p-8 shadow-2xl shadow-slate-300/40 backdrop-blur sm:p-12">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-teal-700 hover:text-teal-800">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>

        <h1 className="mt-6 font-heading text-4xl font-extrabold tracking-tight text-slate-950">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: September 20, 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-6 text-slate-700">
          <section>
            <h2 className="font-heading text-xl font-extrabold text-slate-950">What we collect</h2>
            <p className="mt-2">
              ResumeCraft stores the account details you provide (name and email address) and the resume
              content you create or upload, including parsed documents and layout preferences. We use
              cookies and local storage to keep you signed in and remember your formatting settings.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-extrabold text-slate-950">How we use your data</h2>
            <p className="mt-2">
              Your resume content is used solely to provide the service: rendering your documents, computing
              ATS match scores, and exporting PDFs. Uploaded resumes are processed by our AI parsing provider
              (Google Gemini) purely to extract structured content. We never sell your personal information
              or use your resume content for advertising.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-extrabold text-slate-950">Data retention and deletion</h2>
            <p className="mt-2">
              Your resumes are stored until you delete them. You can delete individual resumes from your
              dashboard at any time, and deleting your account removes all associated data. Local browser
              cache files can be cleared from your device at any time without affecting your saved resumes.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-extrabold text-slate-950">Security</h2>
            <p className="mt-2">
              Passwords are stored only as salted hashes, all traffic is encrypted over HTTPS, and access
              to production data is restricted to the operators of the service.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-extrabold text-slate-950">Your rights</h2>
            <p className="mt-2">
              You may request a copy of your data or ask us to delete it at any time. Because your resumes
              are already manageable from your dashboard, most requests can be completed instantly by you.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-extrabold text-slate-950">Changes to this policy</h2>
            <p className="mt-2">
              If we make material changes to this policy, we will announce them on this page with a new
              "last updated" date. Continued use of ResumeCraft after a change constitutes acceptance.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
