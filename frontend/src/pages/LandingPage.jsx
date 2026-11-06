import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Briefcase,
  CheckCircle2,
  FileText,
  Globe,
  Globe2,
  PiggyBank,
  Receipt,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';

const features = [
  {
    icon: Wallet,
    title: 'See your real cash flow',
    body: 'Keep income, expenses, and account transfers in one ledger, with a clear view of what is actually available.',
  },
  {
    icon: FileText,
    title: 'Keep projects and invoices connected',
    body: 'Track clients, project value, sent invoices, and payments together, so outstanding work is easy to follow up.',
  },
  {
    icon: PiggyBank,
    title: 'Plan for tax and savings',
    body: 'Set a tax reserve target and savings goals, then see how today’s income moves your plans forward.',
  },
  {
    icon: Globe2,
    title: 'Work across currencies',
    body: 'Record the currency you were paid in and keep historical exchange rates with each transaction.',
  },
];

function FinancePreview() {
  return (
    <div className="relative mx-auto w-full max-w-[620px]">
      <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-blue-400/15 blur-3xl" />
      <div className="absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl" />

      <div className="relative rounded-[1.75rem] border border-slate-200/80 bg-white p-3 shadow-[0_28px_80px_-36px_rgba(15,23,42,0.35)] sm:p-4">
        <div className="flex items-center justify-between border-b border-slate-100 px-2 pb-3 sm:px-3">
          <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0f172a] text-white">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-900">Workspace overview</p>
              <p className="text-[10px] text-slate-400">November 2026</p>
            </div>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wide text-slate-500">
            Preview data
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 px-1 pt-3 sm:gap-3 sm:px-2">
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-slate-500">Available cash</span>
              <Wallet className="h-3.5 w-3.5 text-blue-600" />
            </div>
            <p className="mt-2 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">$18,420</p>
            <p className="mt-1 flex items-center gap-1 text-[9px] font-semibold text-emerald-600">
              <ArrowUpRight className="h-3 w-3" />
              Across 3 accounts
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-slate-500">Invoices due</span>
              <Receipt className="h-3.5 w-3.5 text-indigo-600" />
            </div>
            <p className="mt-2 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">$6,800</p>
            <p className="mt-1 text-[9px] font-medium text-slate-400">Across 4 open invoices</p>
          </div>
        </div>

        <div className="mx-1 mt-3 rounded-xl border border-slate-100 bg-white p-3 sm:mx-2 sm:p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-semibold text-slate-700">Income and expenses</p>
              <p className="mt-0.5 text-[9px] text-slate-400">A clearer view of your month</p>
            </div>
            <div className="flex items-center gap-3 text-[9px] font-medium text-slate-500">
              <span className="flex items-center gap-1"><i className="h-1.5 w-1.5 rounded-full bg-blue-600" />Income</span>
              <span className="flex items-center gap-1"><i className="h-1.5 w-1.5 rounded-full bg-sky-300" />Expenses</span>
            </div>
          </div>
          <div className="mt-3 h-[112px] w-full">
            <svg viewBox="0 0 520 112" className="h-full w-full" role="img" aria-label="Illustrative income and expense chart">
              <defs>
                <linearGradient id="income-area" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0.16" />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0 86H520M0 56H520M0 26H520" stroke="#eef2f7" strokeDasharray="3 5" />
              <path d="M0 83 C45 76 55 65 95 70 S155 46 195 53 S250 38 290 48 S345 26 390 35 S455 15 520 21 V112 H0Z" fill="url(#income-area)" />
              <path d="M0 83 C45 76 55 65 95 70 S155 46 195 53 S250 38 290 48 S345 26 390 35 S455 15 520 21" fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" />
              <path d="M0 96 C48 91 58 85 95 88 S155 75 195 81 S250 70 290 78 S345 63 390 70 S455 56 520 62" fill="none" stroke="#7dd3fc" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="390" cy="35" r="4" fill="#fff" stroke="#2563eb" strokeWidth="2.5" />
            </svg>
          </div>
          <div className="mt-1 flex justify-between px-0.5 text-[8px] font-medium text-slate-400">
            <span>Nov 1</span><span>Nov 7</span><span>Nov 14</span><span>Nov 21</span><span>Nov 30</span>
          </div>
        </div>

        <div className="mx-1 mb-1 mt-3 grid grid-cols-[1fr_auto] items-center gap-3 rounded-xl bg-[#0f172a] px-3.5 py-3 text-white sm:mx-2 sm:px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
              <PiggyBank className="h-4 w-4 text-emerald-300" />
            </div>
            <div>
              <p className="text-[9px] font-medium text-slate-300">Tax reserve target</p>
              <p className="mt-0.5 text-xs font-bold">$2,140 <span className="font-medium text-slate-400">set aside</span></p>
            </div>
          </div>
          <span className="text-[10px] font-semibold text-emerald-300">On track</span>
        </div>
      </div>

      <div className="absolute -bottom-5 -left-3 hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-lg sm:flex">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
          <ArrowDownLeft className="h-4 w-4" />
        </div>
        <div>
          <p className="text-[9px] font-medium text-slate-400">Payment received</p>
          <p className="text-[11px] font-bold text-slate-800">+$2,400.00</p>
        </div>
        <BadgeCheck className="ml-2 h-4 w-4 text-emerald-500" />
      </div>
    </div>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-slate-50 text-slate-900">
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
        <Link to="/" className="flex items-center gap-3" aria-label="Freelance Financial Hub home">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0f172a] text-white shadow-sm">
            <TrendingUp className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-bold tracking-tight text-slate-900">Freelance Finance</span>
            <span className="block text-[10px] font-medium tracking-wide text-slate-400">FINANCIAL HUB</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
          <a href="#features" className="text-xs font-semibold text-slate-500 transition hover:text-slate-900">Features</a>
          <a href="#workflow" className="text-xs font-semibold text-slate-500 transition hover:text-slate-900">How it works</a>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle className="hidden p-1.5 sm:inline-flex" />
          <Link to="/login" className="px-2 py-2 text-xs font-semibold text-slate-600 transition hover:text-slate-900 sm:px-3">
            Sign in
          </Link>
          <Link to="/signup" className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3.5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700 sm:px-4">
            Get started <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      <main>
        <section className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-10 sm:px-8 sm:pb-24 sm:pt-14 lg:grid-cols-[0.94fr_1.06fr] lg:gap-10 lg:px-10 lg:pb-28 lg:pt-16">
          <div className="absolute -left-40 top-10 h-72 w-72 rounded-full bg-blue-300/10 blur-3xl" />
          <div className="relative z-10 max-w-xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-blue-700 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
              Finance for independent work
            </div>
            <h1 className="text-[2.7rem] font-bold leading-[1.04] tracking-[-0.055em] text-slate-950 sm:text-6xl lg:text-[4.25rem]">
              Know what you earned.<br />
              <span className="text-blue-600">Know what’s next.</span>
            </h1>
            <p className="mt-6 max-w-lg text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
              One clear workspace for freelance income, expenses, invoices, and tax reserves—so you can plan your next move with confidence.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link to="/signup" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0f172a] px-5 py-3.5 text-sm font-bold text-white shadow-[0_12px_28px_-14px_rgba(15,23,42,0.65)] transition hover:bg-[#1e293b]">
                Create your workspace <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#features" className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/70 px-5 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white">
                Explore the features
              </a>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] font-medium text-slate-500 sm:text-[11px]">
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />A ledger built for freelance work</span>
              <span className="inline-flex items-center gap-1.5"><Globe className="h-3.5 w-3.5 text-blue-600" />Multi-currency tracking</span>
            </div>
          </div>

          <div className="relative z-10 lg:pl-4">
            <FinancePreview />
          </div>
        </section>

        <section id="features" className="border-y border-slate-200/80 bg-white/65">
          <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-600">Your work, in view</p>
              <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-slate-900 sm:text-4xl">The whole picture, in one place.</h2>
              <p className="mt-4 text-sm leading-7 text-slate-500">Move from scattered records to a financial picture that makes sense at a glance.</p>
            </div>

            <div className="mt-11 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {features.map(({ icon: Icon, title, body }, index) => (
                <article key={title} className="group rounded-2xl border border-slate-200/80 bg-white p-5 transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg hover:shadow-slate-900/5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 transition group-hover:bg-blue-600 group-hover:text-white">
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                    <span className="text-[10px] font-semibold tracking-widest text-slate-300">0{index + 1}</span>
                  </div>
                  <h3 className="mt-5 text-sm font-bold text-slate-900">{title}</h3>
                  <p className="mt-2 text-xs leading-6 text-slate-500">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="workflow" className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-20 lg:px-10">
          <div className="max-w-lg">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-600">A steadier way to run your numbers</p>
            <h2 className="mt-3 text-3xl font-bold leading-tight tracking-[-0.04em] text-slate-900 sm:text-4xl">From every transaction to your next decision.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-500">Keep the everyday details connected to the bigger picture: what is paid, what is still due, and what you want to set aside.</p>
            <Link to="/signup" className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-blue-700 transition hover:gap-3">
              Start with your workspace <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6">
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600">01 / Record</span>
              <Briefcase className="mt-5 h-5 w-5 text-slate-700" />
              <h3 className="mt-4 text-sm font-bold text-slate-900">Capture the work</h3>
              <p className="mt-2 text-xs leading-6 text-slate-500">Organize clients, projects, invoices, and everyday transactions.</p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6">
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600">02 / Understand</span>
              <TrendingUp className="mt-5 h-5 w-5 text-slate-700" />
              <h3 className="mt-4 text-sm font-bold text-slate-900">See what changed</h3>
              <p className="mt-2 text-xs leading-6 text-slate-500">Follow cash flow, outstanding invoices, spending, and project results.</p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6">
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600">03 / Plan</span>
              <PiggyBank className="mt-5 h-5 w-5 text-slate-700" />
              <h3 className="mt-4 text-sm font-bold text-slate-900">Choose what’s next</h3>
              <p className="mt-2 text-xs leading-6 text-slate-500">Set budgets, build savings goals, and prepare your tax reserve.</p>
            </div>
          </div>
        </section>

        <section className="px-5 pb-16 sm:px-8 sm:pb-20 lg:px-10">
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[1.75rem] bg-[#0f172a] px-6 py-10 text-white sm:px-10 sm:py-12 lg:px-14">
            <div className="absolute -right-10 -top-28 h-72 w-72 rounded-full border border-white/10" />
            <div className="absolute -right-2 -top-20 h-56 w-56 rounded-full border border-white/10" />
            <div className="relative flex flex-col gap-7 md:flex-row md:items-center md:justify-between">
              <div className="max-w-xl">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-300">Make room for the next opportunity</p>
                <h2 className="mt-3 text-2xl font-bold tracking-[-0.035em] sm:text-3xl">Bring your freelance finances into focus.</h2>
                <p className="mt-3 text-xs leading-6 text-slate-300 sm:text-sm">Create a workspace that brings your money, clients, and plans together.</p>
              </div>
              <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
                <Link to="/signup" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-xs font-bold text-slate-900 transition hover:bg-slate-100">
                  Get started <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link to="/login" className="inline-flex items-center justify-center rounded-xl border border-white/20 px-5 py-3 text-xs font-semibold text-white transition hover:bg-white/10">
                  I already have an account
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200/80 bg-white/50">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-6 text-[10px] text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
          <span>© {new Date().getFullYear()} Freelance Financial Hub</span>
          <div className="flex flex-wrap items-center gap-5 font-medium">
            <Link to="/privacy" className="transition hover:text-slate-700">Privacy</Link>
            <Link to="/terms" className="transition hover:text-slate-700">Terms</Link>
            <Link to="/security" className="transition hover:text-slate-700">Security</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
