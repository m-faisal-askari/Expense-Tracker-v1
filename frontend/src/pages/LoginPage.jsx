import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { ShieldCheck, Mail, Lock, User, ArrowLeft, ArrowRight, DollarSign, TrendingUp, CheckCircle2 } from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';
import { FieldHints } from '../components/FieldHints';

export function LoginPage({ initialTab = 'login' }) {
  const { login, register, loginWithGoogle } = useAuth();
  const { showError, showSuccess } = useToast();
  const [tab, setTab] = useState(initialTab); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [form, setForm] = useState({
    email: '',
    password: '',
    full_name: ''
  });

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (tab === 'login') {
        await login(form.email, form.password);
        showSuccess('Welcome back!');
      } else {
        const result = await register(form.email, form.password, form.full_name);
        showSuccess(result.confirmation_required
          ? 'Check your email to confirm your account before signing in.'
          : 'Your account has been created. Welcome!');
      }
    } catch (err) {
      showError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      // Browser redirects to Google consent page
    } catch (err) {
      showError(err.message, 'Google OAuth');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="login-page min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      <Link to="/" className="absolute left-4 top-4 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-slate-900 sm:left-6 sm:top-6">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to home
      </Link>
      <ThemeToggle className="absolute right-4 top-4 sm:right-6 sm:top-6" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-indigo-600 text-white mb-4">
          <TrendingUp className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Freelance Financial Hub
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-500">
          Centralized accounting, client invoicing, tax reserve, and multi-currency ledger
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white border border-slate-200 py-8 px-6 shadow-sm rounded-xl sm:px-10">
          {/* Tab Selector */}
          <div className="flex border-b border-slate-200 mb-6">
            <button
              type="button"
              onClick={() => setTab('login')}
              className={`flex-1 pb-3 text-xs sm:text-sm font-semibold border-b-2 transition ${
                tab === 'login'
                  ? 'border-indigo-600 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setTab('register')}
              className={`flex-1 pb-3 text-xs sm:text-sm font-semibold border-b-2 transition ${
                tab === 'register'
                  ? 'border-indigo-600 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Supabase Google OAuth Button */}
          <button
            type="button"
            disabled={googleLoading}
            onClick={handleGoogleAuth}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition hover:border-slate-300 disabled:opacity-50"
          >
            <svg className="w-4 h-4 text-slate-700" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M12 5c1.7 0 3 .6 4 1.5l3-3C17.2 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
              />
              <path
                fill="currentColor"
                d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
              />
              <path
                fill="currentColor"
                d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
              />
              <path
                fill="currentColor"
                d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
              />
            </svg>
            {googleLoading ? 'Connecting to Google...' : 'Continue with Google'}
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
              <span className="bg-white px-3 text-slate-500 font-bold">Or with email</span>
            </div>
          </div>

          {/* Email / Password Form */}
          <FieldHints>
          <form onSubmit={handleEmailAuth} className="space-y-4 text-xs">
            {tab === 'register' && (
              <div>
                <label className="block text-slate-700 font-medium mb-1">Full Legal / Business Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Morgan"
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-slate-700 font-medium mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="alex@freelance.dev"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                'Processing...'
              ) : tab === 'login' ? (
                <>Sign In <ArrowRight className="w-3.5 h-3.5" /></>
              ) : (
                <>Create account <ArrowRight className="w-3.5 h-3.5" /></>
              )}
            </button>

            <p className="text-[11px] text-center text-slate-500 mt-3">
              By continuing, you agree to our{' '}
              <Link to="/terms" className="text-indigo-600 hover:underline">Terms of Service</Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-indigo-600 hover:underline">Privacy Policy</Link>.
            </p>
          </form>
          </FieldHints>

          {/* Features note */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-[11px] text-slate-500 space-y-1.5">
            <div className="flex items-center gap-2 text-slate-600">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Clients, projects, invoices, and payments in one view</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Cash flow, tax reserves, and multi-currency tracking</span>
            </div>
          </div>
        </div>

        {/* Public Legal Footer */}
        <div className="mt-8 text-center text-xs text-slate-500 flex items-center justify-center gap-4">
          <Link to="/privacy" className="hover:text-slate-700 transition">Privacy Policy</Link>
          <span>•</span>
          <Link to="/terms" className="hover:text-slate-700 transition">Terms of Service</Link>
          <span>•</span>
          <Link to="/security" className="hover:text-slate-700 transition">Security Architecture</Link>
        </div>
      </div>
    </div>
  );
}
