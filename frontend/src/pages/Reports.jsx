import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, Download, Calendar, DollarSign, Clock, AlertCircle } from 'lucide-react';
import { api } from '../api/client';
import { MetricCard } from '../components/MetricCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { formatCurrency, formatDate } from '../utils/formatters';

export function Reports() {
  const currentYear = new Date().getFullYear();
  const [activeTab, setActiveTab] = useState('pnl');
  const [startDate, setStartDate] = useState(`${currentYear}-01-01`);
  const [endDate, setEndDate] = useState(`${currentYear}-12-31`);

  const { data: pnl, isLoading: loadingPnl } = useQuery({
    queryKey: ['reportPnl', startDate, endDate],
    queryFn: () => api.get('/reports/profit-loss', { start_date: startDate, end_date: endDate }),
    enabled: activeTab === 'pnl',
  });

  const { data: aging, isLoading: loadingAging } = useQuery({
    queryKey: ['reportAging'],
    queryFn: () => api.get('/reports/invoice-aging'),
    enabled: activeTab === 'aging',
  });

  const handleDownloadPDF = () => {
    api.downloadBlob(`/reports/export/pdf?start_date=${startDate}&end_date=${endDate}`, `Financial_Statement_${startDate}_to_${endDate}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Reports & Financial Statements</h2>
          <p className="text-xs sm:text-sm text-slate-500">Authoritative Profit & Loss, Accounts Receivable Aging, and PDF export</p>
        </div>

        {activeTab === 'pnl' && (
          <button
            onClick={handleDownloadPDF}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5" />
            Download PDF Statement
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('pnl')}
          className={`pb-2.5 transition border-b-2 ${
            activeTab === 'pnl' ? 'border-slate-900 text-slate-900 dark:border-white dark:text-white font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Profit & Loss Statement
        </button>
        <button
          onClick={() => setActiveTab('aging')}
          className={`pb-2.5 transition border-b-2 ${
            activeTab === 'aging' ? 'border-slate-900 text-slate-900 dark:border-white dark:text-white font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Invoice Aging (Receivables)
        </button>
      </div>

      {/* Tab 1: P&L Statement */}
      {activeTab === 'pnl' && (
        <div className="space-y-6">
          {/* Date Range Selector */}
          <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap gap-3 items-center">
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" /> Date Period:
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg text-slate-700"
            />
            <span className="text-xs text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg text-slate-700"
            />
          </div>

          {loadingPnl ? (
            <LoadingSpinner text="Generating Profit & Loss statement..." />
          ) : pnl ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <MetricCard
                  title="Net Received Revenue"
                  amount={pnl.net_revenue}
                  icon={DollarSign}
                  color="emerald"
                  subtitle={`Gross: ${formatCurrency(pnl.gross_revenue)} (Fees: -${formatCurrency(pnl.platform_fees)})`}
                />
                <MetricCard
                  title="Total Operating Expenses"
                  amount={pnl.total_operating_expenses}
                  icon={BarChart3}
                  color="rose"
                  subtitle="Confirmed business spending"
                />
                <MetricCard
                  title="Net Operating Profit"
                  amount={pnl.operating_profit}
                  icon={DollarSign}
                  color={parseFloat(pnl.operating_profit) >= 0 ? 'indigo' : 'rose'}
                  isNegative={parseFloat(pnl.operating_profit) < 0}
                  subtitle={`Operating Margin: ${pnl.profit_margin_percentage}%`}
                />
              </div>

              {/* Statement Sheet */}
              <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-xs p-6 space-y-6">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Statement of Financial Performance</h3>
                  <p className="text-xs text-slate-500">Period: {pnl.start_date} to {pnl.end_date}</p>
                </div>

                <div className="space-y-4 text-xs">
                  {/* Revenue Section */}
                  <div>
                    <h4 className="font-semibold text-slate-800 uppercase tracking-wider text-[11px] mb-2 pb-1 border-b border-slate-100">
                      Operating Revenue
                    </h4>
                    <div className="space-y-1.5">
                      {pnl.income_by_category?.map((item) => (
                        <div key={item.category} className="flex justify-between py-1 text-slate-600">
                          <span>{item.category}</span>
                          <span className="font-mono text-slate-900">{formatCurrency(item.amount)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between py-2 border-t border-slate-200 font-bold text-slate-900">
                        <span>Net Operating Revenue</span>
                        <span className="font-mono text-[var(--analytics-text)]">{formatCurrency(pnl.net_revenue)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Expenses Section */}
                  <div>
                    <h4 className="font-semibold text-slate-800 uppercase tracking-wider text-[11px] mb-2 pb-1 border-b border-slate-100">
                      Operating Expenses
                    </h4>
                    <div className="space-y-1.5">
                      {pnl.expense_by_category?.map((item) => (
                        <div key={item.category} className="flex justify-between py-1 text-slate-600">
                          <span>{item.category}</span>
                          <span className="font-mono text-slate-900">({formatCurrency(item.amount)})</span>
                        </div>
                      ))}
                      <div className="flex justify-between py-2 border-t border-slate-200 font-bold text-slate-900">
                        <span>Total Operating Expenses</span>
                        <span className="font-mono text-rose-500">({formatCurrency(pnl.total_operating_expenses)})</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Line */}
                  <div className="pt-4 border-t-2 border-slate-900 dark:border-zinc-700 flex justify-between items-baseline text-sm">
                    <div>
                      <span className="font-bold text-slate-900">Net Business Profit</span>
                      <span className="text-xs text-slate-500 block font-normal">Margin: {pnl.profit_margin_percentage}%</span>
                    </div>
                    <span className="text-xl font-bold font-mono text-[var(--analytics-text)]">
                      {formatCurrency(pnl.operating_profit)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Tab 2: Invoice Aging */}
      {activeTab === 'aging' && (
        <div className="space-y-6">
          {loadingAging ? (
            <LoadingSpinner text="Computing invoice aging buckets..." />
          ) : aging ? (
            <div className="space-y-6">
              {/* Buckets */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs text-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Current</span>
                  <span className="text-sm font-bold font-mono text-[var(--analytics-text)]">{formatCurrency(aging.summary.current)}</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs text-center">
                  <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider block">1-30 Days</span>
                  <span className="text-sm font-bold font-mono text-slate-900">{formatCurrency(aging.summary.overdue_1_30)}</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs text-center">
                  <span className="text-[10px] text-orange-500 font-bold uppercase tracking-wider block">31-60 Days</span>
                  <span className="text-sm font-bold font-mono text-slate-900">{formatCurrency(aging.summary.overdue_31_60)}</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs text-center">
                  <span className="text-[10px] text-rose-500 font-bold uppercase tracking-wider block">61-90 Days</span>
                  <span className="text-sm font-bold font-mono text-slate-900">{formatCurrency(aging.summary.overdue_61_90)}</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs text-center col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-rose-500 font-bold uppercase tracking-wider block">90+ Days</span>
                  <span className="text-sm font-bold font-mono text-slate-900">{formatCurrency(aging.summary.overdue_90_plus)}</span>
                </div>
              </div>

              {/* Detailed Aging Table */}
              <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                      <th className="py-3 px-4">Invoice #</th>
                      <th className="py-3 px-4">Client</th>
                      <th className="py-3 px-4">Due Date</th>
                      <th className="py-3 px-4">Days Past Due</th>
                      <th className="py-3 px-4">Aging Bracket</th>
                      <th className="py-3 px-4 text-right">Balance Due</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {aging.invoices?.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">#{inv.invoice_number}</td>
                        <td className="py-3 px-4 font-medium text-slate-800">{inv.client_name}</td>
                        <td className="py-3 px-4 text-slate-600">{formatDate(inv.due_date)}</td>
                        <td className="py-3 px-4 font-medium text-slate-700">{inv.days_overdue} days</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            inv.category === 'Current' ? 'bg-slate-100 text-slate-700' : 'bg-rose-50 text-rose-700'
                          }`}>
                            {inv.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono">
                          {formatCurrency(inv.balance_due, inv.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
