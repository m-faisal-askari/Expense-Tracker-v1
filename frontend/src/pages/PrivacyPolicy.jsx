import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Lock, 
  Database, 
  UserCheck, 
  EyeOff, 
  FileText, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Globe
} from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';

export function PrivacyPolicy() {
  const lastUpdated = "November 6, 2026";

  return (
    <div className="legal-page min-h-screen bg-slate-950 text-slate-200">
      {/* Top Header Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 text-white hover:opacity-90 transition">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-500/20 font-bold text-sm">
              FF
            </div>
            <span className="font-bold text-base tracking-tight">FreelanceFinance</span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle className="border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white" />
            <Link 
              to="/terms" 
              className="text-xs text-slate-400 hover:text-white transition hidden sm:inline-block"
            >
              Terms of Service
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
      <div className="relative py-12 border-b border-slate-800/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-4">
            <ShieldCheck className="w-3.5 h-3.5" /> Transparent Privacy & Data Practices
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Privacy Policy & Data Disclosure
          </h1>
          <p className="mt-3 text-slate-400 text-sm max-w-2xl mx-auto">
            We engineered FreelanceFinance with strict privacy, tenant isolation, and authoritative ledger principles.
            Learn what information we collect, how it is safeguarded, and how you retain total ownership.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Last Updated: <span className="text-slate-300 font-medium">{lastUpdated}</span>
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 text-sm leading-relaxed">
        
        {/* Quick Highlights Box */}
        <div className="p-5 rounded-2xl bg-indigo-950/30 border border-indigo-800/40 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <EyeOff className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-white text-xs">Zero Ad Tracking</h4>
              <p className="text-slate-400 text-xs mt-0.5">We do not sell, rent, or monetize your financial records to third-party advertisers.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Database className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-white text-xs">Tenant Isolation</h4>
              <p className="text-slate-400 text-xs mt-0.5">Each user operates in a segregated financial database ledger partition.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-white text-xs">Encrypted in Transit</h4>
              <p className="text-slate-400 text-xs mt-0.5">All API calls and database connections are strictly secured via HTTPS / TLS 1.3.</p>
            </div>
          </div>
        </div>

        {/* Section 1: Information We Collect */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 text-white font-bold text-lg border-b border-slate-800 pb-2">
            <span className="w-6 h-6 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-xs">1</span>
            <h2>Information We Collect</h2>
          </div>
          <p className="text-slate-300">
            FreelanceFinance collects information strictly necessary to provide independent financial bookkeeping, 
            invoice generation, currency conversions, and tax estimations.
          </p>
          
          <div className="space-y-3 pl-2">
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
              <h4 className="font-semibold text-white text-xs flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-indigo-400" /> Account & Profile Information
              </h4>
              <p className="text-slate-400 text-xs mt-1">
                When you register or authenticate through Google OAuth 2.0, we collect your <strong>full name</strong>, 
                <strong>email address</strong>, and unique authentication identifier. When utilizing email/password registration, 
                passwords are encrypted using irreversible cryptographic hashing and are never stored in plaintext.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
              <h4 className="font-semibold text-white text-xs flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" /> Financial Operations Ledger Data
              </h4>
              <p className="text-slate-400 text-xs mt-1">
                Data you directly enter to manage your business operations:
              </p>
              <ul className="list-disc list-inside text-xs text-slate-400 mt-2 space-y-1">
                <li>Bank and financial account records (account names, institution labels, base currency, balances).</li>
                <li>Income and Expense transactions (categories, payment methods, transaction dates, descriptions).</li>
                <li>Client directory entries (business names, client contact emails, billing addresses).</li>
                <li>Projects & Invoices (rates, billable line items, payment terms, issued dates, settlement status).</li>
                <li>Estimated Tax Reserve percentages and recurring subscription reminders.</li>
              </ul>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
              <h4 className="font-semibold text-white text-xs flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-400" /> Technical & Session Log Data
              </h4>
              <p className="text-slate-400 text-xs mt-1">
                Standard technical logs captured by our infrastructure for security and troubleshooting: browser user-agent, 
                IP address, request timestamps, and API response status codes.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: Google API Services User Data Policy */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 text-white font-bold text-lg border-b border-slate-800 pb-2">
            <span className="w-6 h-6 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-xs">2</span>
            <h2>Google OAuth 2.0 & Data Usage</h2>
          </div>
          <p className="text-slate-300">
            FreelanceFinance provides optional authentication using Google Sign-In via Supabase Auth.
          </p>
          <div className="p-4 rounded-xl bg-slate-900/90 border border-indigo-900/40 space-y-2">
            <div className="flex items-center gap-2 text-indigo-300 font-semibold text-xs">
              <CheckCircle2 className="w-4 h-4 text-indigo-400" />
              <span>Limited Scope Authentication Only</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              We exclusively request access to your primary email address and public profile details. We do <strong>not</strong> request, 
              access, or inspect your Google Drive files, Gmail inboxes, Google Calendar, contacts, or photos.
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              FreelanceFinance's use and transfer to any other app of information received from Google APIs will adhere to the 
              <a 
                href="https://developers.google.com/terms/api-services-user-data-policy" 
                target="_blank" 
                rel="noreferrer"
                className="text-indigo-400 underline hover:text-indigo-300 ml-1"
              >
                Google API Services User Data Policy
              </a>, including the Limited Use requirements.
            </p>
          </div>
        </section>

        {/* Section 3: How We Use Your Data */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 text-white font-bold text-lg border-b border-slate-800 pb-2">
            <span className="w-6 h-6 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-xs">3</span>
            <h2>How Your Data is Processed</h2>
          </div>
          <p className="text-slate-300">Your information is processed strictly to deliver platform functionality:</p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
            <li className="p-3 bg-slate-900 rounded-lg border border-slate-800/80 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Authoritative Python Decimal calculation of income, expenses, and cash flow.</span>
            </li>
            <li className="p-3 bg-slate-900 rounded-lg border border-slate-800/80 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Generating professional client invoice PDFs and downloadable P&L reports.</span>
            </li>
            <li className="p-3 bg-slate-900 rounded-lg border border-slate-800/80 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Project profitability, budget alerts, and tax reserve estimations.</span>
            </li>
            <li className="p-3 bg-slate-900 rounded-lg border border-slate-800/80 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Enforcing security permissions, session tokens, and tenant isolation.</span>
            </li>
          </ul>
        </section>

        {/* Section 4: Subprocessors & Third-Party Infrastructure */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 text-white font-bold text-lg border-b border-slate-800 pb-2">
            <span className="w-6 h-6 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-xs">4</span>
            <h2>Subprocessors & Infrastructure Partners</h2>
          </div>
          <p className="text-slate-300">
            To provide robust reliability, scalability, and security, we partner with industry-leading infrastructure providers:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-800 rounded-xl overflow-hidden">
              <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">Partner</th>
                  <th className="p-3">Role / Service</th>
                  <th className="p-3">Data Handled</th>
                  <th className="p-3">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-slate-300">
                <tr>
                  <td className="p-3 font-semibold text-white">Supabase Inc.</td>
                  <td className="p-3">Database & Authentication</td>
                  <td className="p-3">Encrypted PostgreSQL storage, user credentials</td>
                  <td className="p-3 text-slate-400">AWS Cloud (ap-south-1)</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-white">Fly.io Inc.</td>
                  <td className="p-3">Backend API Computing</td>
                  <td className="p-3">FastAPI calculation runtime, report engines</td>
                  <td className="p-3 text-slate-400">Singapore Region (sin)</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-white">Vercel Inc.</td>
                  <td className="p-3">Frontend Hosting & CDN</td>
                  <td className="p-3">Static React SPA asset delivery</td>
                  <td className="p-3 text-slate-400">Global Edge Network</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-white">Google LLC</td>
                  <td className="p-3">OAuth Identity Provider</td>
                  <td className="p-3">Federated login token handshake</td>
                  <td className="p-3 text-slate-400">Global Infrastructure</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 5: Cookies and Local Storage */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 text-white font-bold text-lg border-b border-slate-800 pb-2">
            <span className="w-6 h-6 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-xs">5</span>
            <h2>Cookies & Local Browser Storage</h2>
          </div>
          <p className="text-slate-300">
            We do not use advertising, marketing, or behavioral tracking cookies.
          </p>
          <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-2">
            <p>
              We utilize browser <strong>sessionStorage</strong> for functional authentication session tokens:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-1">
              <li>The Supabase client stores the active session for this browser tab and refreshes it when needed.</li>
              <li>The session access token authorizes requests to the application API.</li>
            </ul>
            <p className="text-[11px] text-slate-500 pt-1">
              Logging out via the user menu removes the Supabase session from browser storage.
            </p>
          </div>
        </section>

        {/* Section 6: Data Retention & User Rights */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 text-white font-bold text-lg border-b border-slate-800 pb-2">
            <span className="w-6 h-6 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-xs">6</span>
            <h2>Your Rights & Data Retention (GDPR & CCPA)</h2>
          </div>
          <p className="text-slate-300">
            You retain absolute ownership over all financial records and personal data entered into FreelanceFinance.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <h4 className="font-bold text-white mb-1">Right to Access & Export</h4>
              <p className="text-slate-400">Download and export invoices, profit & loss statements, and balance sheets in PDF and structured format at any time.</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <h4 className="font-bold text-white mb-1">Right to Erasure (Delete Data)</h4>
              <p className="text-slate-400">You may request complete purging of your account and all associated ledger records by contacting our support team.</p>
            </div>
          </div>
        </section>

        {/* Section 7: Contact Us */}
        <section className="space-y-4 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2.5 text-white font-bold text-lg">
            <HelpCircle className="w-5 h-5 text-indigo-400" />
            <h2>Contact & Privacy Inquiries</h2>
          </div>
          <p className="text-slate-300 text-xs">
            If you have questions regarding this Privacy Policy, your data protection rights, or security disclosures, 
            please reach out to our privacy compliance team:
          </p>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-1">
            <p><span className="text-slate-500">Service:</span> Freelancer Financial Management Platform</p>
            <p><span className="text-slate-500">Contact Email:</span> <a href="mailto:privacy@freelancefinance.dev" className="text-indigo-400 hover:underline">privacy@freelancefinance.dev</a></p>
            <p><span className="text-slate-500">Production App URL:</span> <a href="https://expense-tracker-v1-xi.vercel.app" className="text-indigo-400 hover:underline">https://expense-tracker-v1-xi.vercel.app</a></p>
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
