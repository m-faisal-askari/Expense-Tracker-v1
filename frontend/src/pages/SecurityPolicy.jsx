import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Lock, 
  Database, 
  Server, 
  Cpu, 
  ArrowLeft, 
  CheckCircle2, 
  Key,
  HardDrive
} from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';

export function SecurityPolicy() {
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
      <div className="relative py-12 border-b border-slate-800/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-4">
            <ShieldCheck className="w-3.5 h-3.5" /> Military-Grade Ledger Integrity
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Security Architecture & Safeguards
          </h1>
          <p className="mt-3 text-slate-400 text-sm max-w-2xl mx-auto">
            How we protect your freelance financial data, ledger balances, and identity through multi-tenant separation, 
            end-to-end encryption, and rigorous automated accounting acceptance standards.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Last Updated: <span className="text-slate-300 font-medium">{lastUpdated}</span>
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 text-sm leading-relaxed">
        
        {/* Pillar 1: Encryption */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 text-white font-bold text-lg border-b border-slate-800 pb-2">
            <Lock className="w-5 h-5 text-indigo-400" />
            <h2>1. Encryption in Transit & At Rest</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <h4 className="font-bold text-white text-xs flex items-center gap-2">
                <Server className="w-4 h-4 text-indigo-400" /> Transit Encryption (TLS 1.3)
              </h4>
              <p className="text-slate-400 text-xs leading-relaxed">
                All traffic between your browser, our Vercel frontend CDN, Fly.io backend microservices, and Supabase 
                databases is encrypted via modern Transport Layer Security (TLS 1.3) with HSTS forced.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <h4 className="font-bold text-white text-xs flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-emerald-400" /> Storage Encryption (AES-256)
              </h4>
              <p className="text-slate-400 text-xs leading-relaxed">
                All production database volumes and automated backups hosted on Supabase PostgreSQL are encrypted 
                at rest using industry-standard AES-256 bit encryption keys.
              </p>
            </div>
          </div>
        </section>

        {/* Pillar 2: Tenant Isolation */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 text-white font-bold text-lg border-b border-slate-800 pb-2">
            <Database className="w-5 h-5 text-emerald-400" />
            <h2>2. Strict Multi-Tenant Data Isolation</h2>
          </div>
          <p className="text-slate-300">
            Unlike simple applications that mix records indiscriminately, FreelanceFinance implements relational multi-tenancy:
          </p>
          <ul className="space-y-2 text-xs text-slate-300">
            <li className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Tenant-Scoped Queries:</strong> Every SQL query explicitly scopes to the authenticated user's ID, preventing any accidental cross-tenant data leaks.</span>
            </li>
            <li className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Foreign Key Integrity:</strong> Relational constraints guarantee invoices, clients, transactions, and accounts can only reference records owned by the same user.</span>
            </li>
          </ul>
        </section>

        {/* Pillar 3: Calculation Engine Verification */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 text-white font-bold text-lg border-b border-slate-800 pb-2">
            <Cpu className="w-5 h-5 text-indigo-400" />
            <h2>3. Python Decimal Precision (No Floating Point Drift)</h2>
          </div>
          <div className="p-4 rounded-xl bg-slate-900 border border-indigo-950/60 space-y-2 text-xs text-slate-300">
            <p className="leading-relaxed">
              Most web applications make the mistake of performing financial math in JavaScript using binary floating-point numbers 
              (e.g., <code className="text-amber-400">0.1 + 0.2 = 0.30000000000000004</code>), introducing rounding errors.
            </p>
            <p className="text-slate-400 leading-relaxed">
              FreelanceFinance rejects this: all currency conversions, internal transfers, tax withholding reserves, and invoice balances 
              are computed using Python's exact <code className="text-indigo-400">Decimal(ROUND_HALF_UP)</code> engine, backed by automated 
              Pytest accounting scenario tests prior to every release.
            </p>
          </div>
        </section>

        {/* Pillar 4: Session Tokens & OAuth */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 text-white font-bold text-lg border-b border-slate-800 pb-2">
            <Key className="w-5 h-5 text-amber-400" />
            <h2>4. Cryptographic Authentication & Token Expiry</h2>
          </div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 space-y-2">
            <p>
              Session tokens are signed using high-entropy secret keys with HMAC-SHA256 algorithms. Tokens include strict expiration timestamps 
              and user identity verification on every protected REST API endpoint.
            </p>
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
