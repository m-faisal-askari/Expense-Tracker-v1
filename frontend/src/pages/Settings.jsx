import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, User, Globe, Shield, CheckCircle2, FileText, Scale, Lock, ExternalLink } from 'lucide-react';
import { api } from '../api/client';
import { LoadingSpinner } from '../components/LoadingSpinner';

export function Settings() {
  const queryClient = useQueryClient();
  const [successMsg, setSuccessMsg] = useState('');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => api.get('/auth/profile'),
  });

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    base_currency: 'USD',
    country: 'US',
    fiscal_year_start: 1,
    tax_reserve_rate: '25.00'
  });

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        email: profile.email || '',
        base_currency: profile.base_currency || 'USD',
        country: profile.country || 'US',
        fiscal_year_start: profile.fiscal_year_start || 1,
        tax_reserve_rate: profile.tax_reserve_rate ? String(profile.tax_reserve_rate) : '25.00'
      });
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: (data) => api.put('/auth/profile', data),
    onSuccess: (updated) => {
      queryClient.setQueryData(['userProfile'], updated);
      queryClient.invalidateQueries(['dashboardSummary']);
      setSuccessMsg('Profile and financial settings updated successfully.');
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfileMutation.mutate({
      ...form,
      fiscal_year_start: parseInt(form.fiscal_year_start, 10),
      tax_reserve_rate: parseFloat(form.tax_reserve_rate)
    });
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading user preferences..." />;
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Account & Financial Settings</h2>
        <p className="text-xs sm:text-sm text-slate-500">Configure your base currency, tax reserve preferences, and profile identity</p>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs space-y-6 text-xs">
        {/* Personal Details */}
        <div className="space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-600" />
            Freelancer Identity
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Full Legal / Business Name</label>
              <input
                type="text"
                required
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Billing & Notice Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Currency & Financial Configuration */}
        <div className="pt-4 border-t border-slate-100 space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-600" />
            Currency & Accounting Defaults
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Base Currency</label>
              <select
                value={form.base_currency}
                onChange={(e) => setForm({ ...form, base_currency: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 font-semibold"
              >
                <option value="PKR">PKR - Pakistani Rupee (Rs.)</option>
                <option value="USD">USD - United States Dollar ($)</option>
                <option value="EUR">EUR - Euro (€)</option>
                <option value="GBP">GBP - British Pound (£)</option>
                <option value="CAD">CAD - Canadian Dollar ($)</option>
                <option value="AUD">AUD - Australian Dollar ($)</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">Multi-currency transactions convert to this base on their transaction date</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Country of Tax Residence</label>
              <input
                type="text"
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
              />
            </div>
          </div>
        </div>

        {/* Tax Planning Defaults */}
        <div className="pt-4 border-t border-slate-100 space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-600" />
            Tax Reserve Rule
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Target Tax Reserve Percentage (%)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="60"
                value={form.tax_reserve_rate}
                onChange={(e) => setForm({ ...form, tax_reserve_rate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 font-bold"
              />
              <p className="text-[11px] text-slate-400 mt-1">Standard self-employment & income tax withholding reserve recommendation is 25-30%</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Fiscal Year Start Month</label>
              <select
                value={form.fiscal_year_start}
                onChange={(e) => setForm({ ...form, fiscal_year_start: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
              >
                <option value="1">January (Calendar Year)</option>
                <option value="4">April (UK / Commonwealth Fiscal)</option>
                <option value="7">July (Australia Fiscal)</option>
                <option value="10">October (US Federal Fiscal)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={updateProfileMutation.isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shadow-sm transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {updateProfileMutation.isPending ? 'Saving Settings...' : 'Save Settings'}
          </button>
        </div>
      </form>

      {/* Legal & Compliance Section */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-base pb-3 border-b border-slate-100">
          <Shield className="w-5 h-5 text-indigo-600" />
          <h3>Legal, Privacy & Compliance Disclosures</h3>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          FreelanceFinance is engineered under strict tenant isolation. Review our official privacy commitments, 
          data collection disclosures, and user agreements anytime.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <Link
            to="/privacy"
            className="p-3.5 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/30 transition group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-indigo-600 mb-1.5">
                <FileText className="w-5 h-5" />
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition" />
              </div>
              <h4 className="font-bold text-slate-800 text-xs">Privacy Policy</h4>
              <p className="text-[11px] text-slate-500 mt-1">What data we collect, why, and how your financial records are protected.</p>
            </div>
            <span className="text-[10px] font-semibold text-indigo-600 mt-3 block">Read Policy →</span>
          </Link>

          <Link
            to="/terms"
            className="p-3.5 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/30 transition group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-indigo-600 mb-1.5">
                <Scale className="w-5 h-5" />
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition" />
              </div>
              <h4 className="font-bold text-slate-800 text-xs">Terms of Service</h4>
              <p className="text-[11px] text-slate-500 mt-1">Platform service agreement, acceptable use, and accounting disclaimers.</p>
            </div>
            <span className="text-[10px] font-semibold text-indigo-600 mt-3 block">View Agreement →</span>
          </Link>

          <Link
            to="/security"
            className="p-3.5 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/30 transition group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-emerald-600 mb-1.5">
                <Lock className="w-5 h-5" />
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition" />
              </div>
              <h4 className="font-bold text-slate-800 text-xs">Security Safeguards</h4>
              <p className="text-[11px] text-slate-500 mt-1">Multi-tenant isolation, TLS 1.3 encryption, and Decimal engine integrity.</p>
            </div>
            <span className="text-[10px] font-semibold text-emerald-600 mt-3 block">Learn More →</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
