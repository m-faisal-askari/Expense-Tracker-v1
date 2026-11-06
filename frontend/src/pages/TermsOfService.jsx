import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Scale, 
  AlertTriangle, 
  ShieldCheck, 
  FileText, 
  ArrowLeft, 
  CheckCircle2, 
  Lock,
  HelpCircle
} from 'lucide-react';

export function TermsOfService() {
  const lastUpdated = "November 6, 2026";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Top Header Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 text-white hover:opacity-90 transition">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-500/20 font-bold text-sm">
              FF
            </div>
            <span className="font-bold text-base tracking-tight">FreelanceFinance</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link 
              to="/privacy" 
              className="text-xs text-slate-400 hover:text-white transition hidden sm:inline-block"
            >
              Privacy Policy
            </Link>
            <Link 
              to="/" 
              className="inline-flex items-center gap-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-lg transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to App
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="relative py-12 border-b border-slate-800/80 bg-gradient-to-b from-indigo-950/20 to-transparent">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-4">
            <Scale className="w-3.5 h-3.5" /> User Rights & Platform Agreement
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Terms of Service
          </h1>
          <p className="mt-3 text-slate-400 text-sm max-w-2xl mx-auto">
            Please read these Terms of Service carefully before utilizing the FreelanceFinance platform. 
            By accessing or creating an account, you agree to be bound by these legal terms.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Last Updated: <span className="text-slate-300 font-medium">{lastUpdated}</span>
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 text-sm leading-relaxed">
        
        {/* Critical Legal Disclaimer Alert Box */}
        <div className="p-5 rounded-2xl bg-amber-950/30 border border-amber-800/40 flex items-start gap-3.5">
          <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs text-amber-200/90 leading-relaxed">
            <h4 className="font-bold text-amber-300 text-sm">Important Financial & Legal Disclaimer</h4>
            <p>
              FreelanceFinance is an automated operational bookkeeping and financial ledger application. 
              <strong> FreelanceFinance is NOT a Certified Public Accountant (CPA), chartered tax advisor, financial fiduciary, or legal law firm.</strong>
            </p>
            <p className="text-amber-300/80">
              Tax estimations, profit & loss summaries, invoice forms, and currency conversions are generated programmatically 
              for personal administrative organization and operational planning. You are exclusively responsible for reviewing 
              your financial reports and consulting a licensed certified tax professional for official legal and tax filing obligations.
            </p>
          </div>
        </div>

        {/* Section 1: Acceptance of Terms */}
        <section className="space-y-3">
          <div className="flex items-center gap-2.5 text-white font-bold text-lg border-b border-slate-800 pb-2">
            <span className="w-6 h-6 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-xs">1</span>
            <h2>Acceptance of Terms</h2>
          </div>
          <p className="text-slate-300">
            By creating an account, logging in via Google OAuth, or using any part of FreelanceFinance, you agree to comply with 
            and be legally bound by these Terms of Service and our <Link to="/privacy" className="text-indigo-400 underline">Privacy Policy</Link>. 
            If you do not agree to these terms, you must discontinue platform use immediately.
          </p>
        </section>

        {/* Section 2: Platform Description */}
        <section className="space-y-3">
          <div className="flex items-center gap-2.5 text-white font-bold text-lg border-b border-slate-800 pb-2">
            <span className="w-6 h-6 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-xs">2</span>
            <h2>Service Description & Scope</h2>
          </div>
          <p className="text-slate-300">
            FreelanceFinance provides independent professionals with a suite of financial ledger tools, including:
          </p>
          <ul className="list-disc list-inside text-xs text-slate-300 space-y-1 pl-1">
            <li>Multi-account balance tracking and reconciliation.</li>
            <li>Authoritative Decimal-based income and expense recording.</li>
            <li>Client directory management, project cost tracking, and PDF invoice generation.</li>
            <li>Multi-currency exchange snapshot calculations and conversion histories.</li>
            <li>Estimated quarterly tax withholding reserves and savings target projections.</li>
          </ul>
        </section>

        {/* Section 3: User Accounts & Security */}
        <section className="space-y-3">
          <div className="flex items-center gap-2.5 text-white font-bold text-lg border-b border-slate-800 pb-2">
            <span className="w-6 h-6 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-xs">3</span>
            <h2>User Accounts & Security Responsibility</h2>
          </div>
          <p className="text-slate-300">
            To use the platform, you must register using a valid email or authenticated Google account. You represent and warrant that:
          </p>
          <div className="space-y-2 text-xs text-slate-300">
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>You are at least 18 years old and capable of forming legally binding contracts.</span>
            </div>
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>You will safeguard and maintain the confidentiality of your authentication credentials.</span>
            </div>
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>You will immediately notify us of any suspected unauthorized access or security breaches of your account.</span>
            </div>
          </div>
        </section>

        {/* Section 4: Acceptable Use Policy */}
        <section className="space-y-3">
          <div className="flex items-center gap-2.5 text-white font-bold text-lg border-b border-slate-800 pb-2">
            <span className="w-6 h-6 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-xs">4</span>
            <h2>Acceptable Use & Prohibited Conduct</h2>
          </div>
          <p className="text-slate-300">
            You agree not to misuse the service. Prohibited activities include, but are not limited to:
          </p>
          <ul className="list-disc list-inside text-xs text-slate-400 space-y-1.5 pl-1">
            <li>Using the service for money laundering, fraudulent invoice generation, or illegal transactions.</li>
            <li>Attempting to bypass tenant isolation boundaries or query other users' financial databases.</li>
            <li>Reverse engineering, decompiling, or attempting to discover the source code of the backend services.</li>
            <li>Automated scraping or burdening the platform with denial-of-service (DoS) request volumes.</li>
          </ul>
        </section>

        {/* Section 5: Data Ownership & Intellectual Property */}
        <section className="space-y-3">
          <div className="flex items-center gap-2.5 text-white font-bold text-lg border-b border-slate-800 pb-2">
            <span className="w-6 h-6 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-xs">5</span>
            <h2>Data Ownership & Intellectual Property</h2>
          </div>
          <p className="text-slate-300">
            <strong>Your Data:</strong> You retain complete, unencumbered ownership of all invoices, client information, 
            account entries, and financial ledger data submitted to the platform.
          </p>
          <p className="text-slate-300">
            <strong>Our Intellectual Property:</strong> FreelanceFinance, its visual interface, calculation algorithms, 
            PDF formatting engines, logos, and underlying code are the intellectual property of FreelanceFinance and its licensors.
          </p>
        </section>

        {/* Section 6: Limitation of Liability */}
        <section className="space-y-3">
          <div className="flex items-center gap-2.5 text-white font-bold text-lg border-b border-slate-800 pb-2">
            <span className="w-6 h-6 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-xs">6</span>
            <h2>Limitation of Liability & Warranty Disclaimer</h2>
          </div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 space-y-2">
            <p>
              THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. 
              WE EXPRESSLY DISCLAIM ALL WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
            <p>
              IN NO EVENT SHALL FREELANCEFINANCE OR ITS OPERATORS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE 
              DAMAGES, INCLUDING LOSS OF PROFITS, DATA LOSS, TAX PENALTIES, OR BUSINESS INTERRUPTION ARISING FROM USE OF THE PLATFORM.
            </p>
          </div>
        </section>

        {/* Section 7: Termination */}
        <section className="space-y-3">
          <div className="flex items-center gap-2.5 text-white font-bold text-lg border-b border-slate-800 pb-2">
            <span className="w-6 h-6 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-xs">7</span>
            <h2>Termination & Account Closure</h2>
          </div>
          <p className="text-slate-300">
            You may stop using FreelanceFinance at any time. We reserve the right to suspend or terminate accounts that violate 
            these Terms, engage in fraudulent bookkeeping, or compromise system stability.
          </p>
        </section>

        {/* Section 8: Inquiries */}
        <section className="space-y-3 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2.5 text-white font-bold text-lg">
            <HelpCircle className="w-5 h-5 text-indigo-400" />
            <h2>Legal Contact</h2>
          </div>
          <p className="text-slate-300 text-xs">
            For questions or notices concerning these Terms of Service, please contact:
          </p>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-1">
            <p><span className="text-slate-500">Service:</span> Freelance Financial Management Platform</p>
            <p><span className="text-slate-500">Legal Contact:</span> <a href="mailto:legal@freelancefinance.dev" className="text-indigo-400 hover:underline">legal@freelancefinance.dev</a></p>
            <p><span className="text-slate-500">Production App:</span> <a href="https://expense-tracker-v1-xi.vercel.app" className="text-indigo-400 hover:underline">https://expense-tracker-v1-xi.vercel.app</a></p>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-8 text-center text-xs text-slate-500 bg-slate-950">
        <div className="flex items-center justify-center gap-6 mb-3">
          <Link to="/privacy" className="text-slate-400 hover:text-white transition">Privacy Policy</Link>
          <span>•</span>
          <Link to="/terms" className="text-slate-400 hover:text-white transition">Terms of Service</Link>
          <span>•</span>
          <Link to="/security" className="text-slate-400 hover:text-white transition">Security Architecture</Link>
        </div>
        <p>© {new Date().getFullYear()} FreelanceFinance. All rights reserved.</p>
      </footer>
    </div>
  );
}