import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldAlert, DollarSign, CheckCircle, Info, Plus } from 'lucide-react';
import { api } from '../api/client';
import { MetricCard } from '../components/MetricCard';
import { Modal } from '../components/Modal';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { formatCurrency, formatDate } from '../utils/formatters';

export function Taxes() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const currentYear = new Date().getFullYear();
  const [taxYear, setTaxYear] = useState(currentYear);

  const [form, setForm] = useState({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    tax_year: currentYear,
    notes: 'Quarterly estimated tax payment'
  });

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['taxSummary', taxYear],
    queryFn: () => api.get('/taxes/summary', { tax_year: taxYear }),
  });

  const { data: payments, isLoading: loadingPayments } = useQuery({
    queryKey: ['taxPayments', taxYear],
    queryFn: () => api.get('/taxes/payments', { tax_year: taxYear }),
  });

  const recordTaxPaymentMutation = useMutation({
    mutationFn: (data) => api.post('/taxes/payments', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['taxSummary']);
      queryClient.invalidateQueries(['taxPayments']);
      queryClient.invalidateQueries(['dashboardSummary']);
      setIsModalOpen(false);
      setForm({ amount: '', payment_date: new Date().toISOString().split('T')[0], tax_year: currentYear, notes: '' });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    recordTaxPaymentMutation.mutate({
      ...form,
      amount: parseFloat(form.amount),
      tax_year: parseInt(form.tax_year, 10)
    });
  };

  if (loadingSummary) {
    return <LoadingSpinner text="Computing tax reserve calculations..." />;
  }

  const s = summary || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Tax Planning & Reserve</h2>
          <p className="text-xs sm:text-sm text-slate-500">Jurisdiction-configurable estimated tax withholding and payment ledger</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={taxYear}
            onChange={(e) => setTaxYear(parseInt(e.target.value, 10))}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white"
          >
            <option value={currentYear}>Tax Year {currentYear}</option>
            <option value={currentYear - 1}>Tax Year {currentYear - 1}</option>
          </select>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Record Tax Payment
          </button>
        </div>
      </div>

      {/* Advisory Disclaimer Banner */}
      <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 flex items-start gap-3 text-xs text-indigo-900">
        <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">Planning Estimates Only</p>
          <p className="text-indigo-700/90 text-[11px] mt-0.5">
            These figures are planning estimates based on your configured reserve rate ({s.tax_reserve_rate}%) and confirmed business records. They do not constitute official tax filings or legal tax counsel.
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Taxable Net Income"
          amount={s.estimated_taxable_income}
          icon={DollarSign}
          color="indigo"
          subtitle={`Net: ${formatCurrency(s.business_net_income)} - Ded: ${formatCurrency(s.deductible_business_expenses)}`}
        />
        <MetricCard
          title="Estimated Tax Liability"
          amount={s.estimated_tax_liability}
          icon={ShieldAlert}
          color="amber"
          subtitle={`Calculated at ${s.tax_reserve_rate}% rate`}
        />
        <MetricCard
          title="Tax Payments Made"
          amount={s.tax_payments_made}
          icon={CheckCircle}
          color="emerald"
          subtitle="Confirmed estimated payments"
        />
        <MetricCard
          title="Remaining Target Reserve"
          amount={s.remaining_tax_reserve_target}
          icon={ShieldAlert}
          color="purple"
          subtitle="Recommended reserve in savings"
        />
      </div>

      {/* Payments History */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <h3 className="font-semibold text-slate-900 text-sm">Recorded Tax Payments ({taxYear})</h3>
        {payments && payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Notes</th>
                  <th className="py-2.5 px-3">Tax Year</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2.5 px-3 text-slate-600">{formatDate(p.payment_date)}</td>
                    <td className="py-2.5 px-3 text-slate-800 font-medium">{p.notes || 'Tax Payment'}</td>
                    <td className="py-2.5 px-3 text-slate-600">{p.tax_year}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-600">{formatCurrency(p.amount, p.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-4 text-center">No tax payments logged for tax year {taxYear}</p>
        )}
      </div>

      {/* Record Payment Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Record Estimated Tax Payment">
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Payment Amount ($)</label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Payment Date</label>
              <input
                type="date"
                required
                value={form.payment_date}
                onChange={(e) => setForm({ ...form, payment_date: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Tax Year</label>
              <input
                type="number"
                required
                value={form.tax_year}
                onChange={(e) => setForm({ ...form, tax_year: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Memo / Notes</label>
            <input
              type="text"
              placeholder="e.g. Q2 Federal Estimated Tax via EFTPS"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={recordTaxPaymentMutation.isPending}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shadow-sm transition disabled:opacity-50"
            >
              {recordTaxPaymentMutation.isPending ? 'Saving...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
