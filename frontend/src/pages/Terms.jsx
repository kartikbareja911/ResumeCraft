import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import SEO from '../components/SEO';

export default function Terms() {
  return (
    <div className="app-shell min-h-screen px-4 py-12 text-slate-900 sm:px-6">
      <SEO
        title="Terms of Service"
        description="The terms that govern your use of ResumeCraft: free access, acceptable use of the AI parser and ATS checker, ownership of your resume content, and disclaimers."
        path="/terms"
      />
      <main className="mx-auto max-w-3xl rounded-[2rem] border border-white/80 bg-white/72 p-8 shadow-2xl shadow-slate-300/40 backdrop-blur sm:p-12">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-teal-700 hover:text-teal-800">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>

        <h1 className="mt-6 font-heading text-4xl font-extrabold tracking-tight text-slate-950">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: September 20, 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-6 text-slate-700">
          <section>
            <h2 className="font-heading text-xl font-extrabold text-slate-950">1. The service</h2>
            <p className="mt-2">
              ResumeCraft is a free web application for building, styling, scoring, and exporting resumes.
              We may add, change, or remove features over time, and we may offer paid tiers in the future —
              anything currently free will remain free unless we notify you otherwise.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-extrabold text-slate-950">2. Your account</h2>
            <p className="mt-2">
              You are responsible for keeping your password confidential and for all activity under your
              account. You must provide accurate registration information and be at least 13 years old.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-extrabold text-slate-950">3. Your content</h2>
            <p className="mt-2">
              You keep full ownership of every resume you create or upload. By uploading a document you
              grant us a limited license to process it solely to provide the service (parsing, rendering,
              scoring, and export). We claim no other rights over your content.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-extrabold text-slate-950">4. Acceptable use</h2>
            <p className="mt-2">
              You agree not to misuse the service: no automated scraping, no attempts to breach security or
              access other users' data, no unlawful or fraudulent content, and no abuse of the AI parsing
              or ATS APIs beyond normal personal use. We may suspend accounts that violate these rules.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-extrabold text-slate-950">5. AI-generated output</h2>
            <p className="mt-2">
              Resume parsing and ATS scoring are provided as-is. AI output can be imperfect — always review
              your resume before sending it to an employer. We do not guarantee job search outcomes.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-extrabold text-slate-950">6. Disclaimer and liability</h2>
            <p className="mt-2">
              The service is provided "as is" without warranties of any kind. To the maximum extent
              permitted by law, ResumeCraft is not liable for indirect or consequential damages arising
              from your use of the service.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-extrabold text-slate-950">7. Changes to these terms</h2>
            <p className="mt-2">
              We may update these terms from time to time. Material changes will be announced on this page
              with a new "last updated" date. Continued use of ResumeCraft after a change constitutes
              acceptance of the updated terms.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
