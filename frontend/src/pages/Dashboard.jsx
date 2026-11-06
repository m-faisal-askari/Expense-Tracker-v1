import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  TrendingUp, TrendingDown, DollarSign, Briefcase, 
  Wallet, FileText, ShieldAlert, ArrowUpRight, ArrowDownRight, 
  Calendar, AlertCircle, Globe
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend
} from 'recharts';
import { api } from '../api/client';
import { MetricCard } from '../components/MetricCard';
import { Badge } from '../components/Badge';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useCurrency } from '../contexts/CurrencyContext';
import { Link } from 'react-router-dom';

const CATEGORY_COLORS = [
  'var(--chart-category-1)',
  'var(--chart-category-2)',
  'var(--chart-category-3)',
  'var(--chart-category-4)',
  'var(--chart-category-5)',
  'var(--chart-category-6)',
  'var(--chart-category-7)',
];

function SkeletonBlock({ className = '', style }) {
  return <div aria-hidden="true" style={style} className={`animate-pulse rounded bg-slate-200/80 dark:bg-white/10 ${className}`} />;
}

function MetricCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <SkeletonBlock className="h-3 w-28" />
        <SkeletonBlock className="h-9 w-9 rounded-lg" />
      </div>
      <SkeletonBlock className="h-7 w-36" />
      <SkeletonBlock className="h-3 w-28 mt-2" />
    </div>
  );
}

function ListSkeleton({ rows = 3, label = 'Loading dashboard items' }) {
  return (
    <div className="space-y-2.5" aria-label={label} role="status">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100">
          <div className="flex-1 space-y-2">
            <SkeletonBlock className="h-3 w-32" />
            <SkeletonBlock className="h-2.5 w-24" />
          </div>
          <div className="space-y-2 ml-4">
            <SkeletonBlock className="h-3 w-16" />
            <SkeletonBlock className="h-2.5 w-12 ml-auto" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function Dashboard() {
  const [period, setPeriod] = useState('this_month');
  const { currency, setCurrency, supportedCurrencies } = useCurrency();

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['dashboardSummary', period, currency],
    queryFn: () => api.get('/dashboard/summary', { period, currency }),
  });

  const { data: charts, isLoading: loadingCharts } = useQuery({
    queryKey: ['dashboardCharts', currency],
    queryFn: () => api.get('/dashboard/charts', { months: 6, currency }),
  });

  const { data: upcoming, isLoading: loadingUpcoming } = useQuery({
    queryKey: ['dashboardUpcoming'],
    queryFn: () => api.get('/dashboard/upcoming'),
  });

  const { data: recentTxs, isLoading: loadingRecentTxs } = useQuery({
    queryKey: ['recentTransactions'],
    queryFn: () => api.get('/transactions', { limit: 5 }),
  });

  const s = summary || {};
  const activeCurrency = s.currency || currency;

  return (
    <div className="space-y-6">
      {/* Top Header with Period Filter & In-View Currency Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Financial Overview</h2>
          <p className="text-xs sm:text-sm text-slate-500">Live authoritative ledger figures for your freelance business</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* In-view Currency Selector */}
          <div className="inline-flex items-center gap-1.5 bg-white rounded-lg border border-slate-200 px-3 py-1 shadow-2xs text-xs font-semibold text-slate-700">
            <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-[11px] text-slate-400 font-normal">View In:</span>
            <select
              value={activeCurrency}
              onChange={(e) => setCurrency(e.target.value)}
              className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
            >
              {supportedCurrencies.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} ({c.symbol})
                </option>
              ))}
            </select>
          </div>

          {/* Period Selector */}
          <div className="inline-flex bg-white rounded-lg border border-slate-200 p-1 shadow-2xs">
            {[
              { id: 'this_month', label: 'This Month' },
              { id: 'last_month', label: 'Last Month' },
              { id: 'last_3_months', label: '3 Months' },
              { id: 'this_year', label: 'This Year' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setPeriod(item.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                  period === item.id
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-black shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Primary Financial Metric Cards */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        aria-busy={loadingSummary}
        role={loadingSummary ? 'status' : undefined}
        aria-label={loadingSummary ? 'Loading financial metrics' : undefined}
      >
        {loadingSummary ? (
          Array.from({ length: 4 }, (_, index) => <MetricCardSkeleton key={index} />)
        ) : (
          <>
            <MetricCard
              title="Net Cash Received"
              amount={s.net_received_income}
              currency={activeCurrency}
              icon={TrendingUp}
              color="emerald"
              subtitle={`Gross: ${formatCurrency(s.gross_income, activeCurrency)}`}
            />
            <MetricCard
              title="Total Expenses"
              amount={s.total_expenses}
              currency={activeCurrency}
              icon={TrendingDown}
              color="rose"
              subtitle={`Personal: ${formatCurrency(s.personal_expenses, activeCurrency)}`}
            />
            <MetricCard
              title="Net Cash Flow"
              amount={s.net_cash_flow}
              currency={activeCurrency}
              icon={DollarSign}
              color={parseFloat(s.net_cash_flow || 0) >= 0 ? 'emerald' : 'rose'}
              isNegative={parseFloat(s.net_cash_flow || 0) < 0}
              subtitle="Received Inflows minus Outflows"
            />
            <MetricCard
              title="Operating Profit"
              amount={s.business_profit}
              currency={activeCurrency}
              icon={Briefcase}
              color="indigo"
              subtitle="Business revenue minus expenses"
            />
          </>
        )}
      </div>

      {/* Secondary Liquidity & Tax Metrics */}
      <div
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        aria-busy={loadingSummary}
        role={loadingSummary ? 'status' : undefined}
        aria-label={loadingSummary ? 'Loading account and tax metrics' : undefined}
      >
        {loadingSummary ? (
          Array.from({ length: 3 }, (_, index) => <MetricCardSkeleton key={index} />)
        ) : (
          <>
            <MetricCard
              title="Consolidated Account Balance"
              amount={s.total_account_balance}
              currency={activeCurrency}
              icon={Wallet}
              color="emerald"
              subtitle="Liquid cash across all active accounts"
            />
            <MetricCard
              title="Outstanding Invoices"
              amount={s.outstanding_invoices}
              currency={activeCurrency}
              icon={FileText}
              color="amber"
              subtitle="Unpaid issued receivables"
            />
            <MetricCard
              title="Estimated Tax Reserve"
              amount={s.estimated_tax_reserve}
              currency={activeCurrency}
              icon={ShieldAlert}
              color="stone"
              subtitle="Target reserve based on net profit"
            />
          </>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cash Flow Trends Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">Income vs Expenses (6 Months)</h3>
              <p className="text-xs text-slate-500">Historical monthly movements in {activeCurrency}</p>
            </div>
          </div>
          <div className="h-64 sm:h-72 w-full" aria-busy={loadingCharts}>
            {loadingCharts ? (
              <div className="relative h-full flex items-end justify-around px-8 pb-8 pt-4 overflow-hidden" role="status" aria-label="Loading cash flow chart">
                <div className="absolute inset-x-8 inset-y-4 flex flex-col justify-between">
                  {[0, 1, 2, 3].map((line) => <SkeletonBlock key={line} className="h-px w-full rounded-none" />)}
                </div>
                {[38, 62, 48, 78, 56, 88, 68, 94].map((height, index) => (
                  <SkeletonBlock key={index} className="relative w-[6%] rounded-t-md" style={{ height: `${height}%` }} />
                ))}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts?.monthly_trends || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--chart-label)' }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'var(--chart-label)' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => formatCurrency(val, activeCurrency)}
                  />
                  <Tooltip
                    formatter={(val) => formatCurrency(val, activeCurrency)}
                    contentStyle={{ backgroundColor: 'var(--chart-tooltip)', border: '1px solid var(--chart-grid)', borderRadius: '8px', color: 'var(--chart-tooltip-text)', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="income" name="Income" stroke="var(--chart-income)" strokeWidth={2} fill="var(--chart-income-fill)" fillOpacity={0.35} />
                  <Area type="monotone" dataKey="expenses" name="Expenses" stroke="var(--chart-expense)" strokeWidth={2} fill="var(--chart-expense-fill)" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Expense Category Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">Expenses by Category</h3>
            <p className="text-xs text-slate-500">Spending breakdown in last 30 days ({activeCurrency})</p>
          </div>
          <div className="h-60 w-full flex items-center justify-center" aria-busy={loadingCharts}>
            {loadingCharts ? (
              <div className="flex items-center gap-6" role="status" aria-label="Loading expense categories">
                <SkeletonBlock className="h-32 w-32 rounded-full" />
                <div className="space-y-3">
                  {[0, 1, 2].map((row) => <SkeletonBlock key={row} className="h-3 w-20" />)}
                </div>
              </div>
            ) : charts?.category_distribution && charts.category_distribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.category_distribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {charts.category_distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => formatCurrency(val, activeCurrency)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-400">No expenses recorded recently</p>
            )}
          </div>
          <div className="space-y-1.5 mt-2 max-h-28 overflow-y-auto pr-1">
            {!loadingCharts && charts?.category_distribution?.slice(0, 4).map((c, idx) => (
              <div key={c.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-600 truncate">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }} />
                  {c.name}
                </span>
                <span className="font-semibold font-mono text-[var(--analytics-text)]">{formatCurrency(c.value, activeCurrency)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section: Upcoming Obligations & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Invoices & Subscriptions */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">Upcoming Obligations</h3>
              <p className="text-xs text-slate-500">Invoices due and subscription renewals</p>
            </div>
            <Link to="/invoices" className="text-xs text-slate-400 hover:text-white transition font-medium">View All &rarr;</Link>
          </div>

          {loadingUpcoming ? <ListSkeleton label="Loading upcoming obligations" /> : (
          <div className="space-y-2.5">
            {upcoming?.upcoming_invoices && upcoming.upcoming_invoices.length > 0 ? (
              upcoming.upcoming_invoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                  <div>
                    <p className="font-semibold text-slate-800">Invoice #{inv.invoice_number}</p>
                    <p className="text-slate-500">{inv.client_name} • Due {formatDate(inv.due_date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">{formatCurrency(inv.amount, inv.currency)}</p>
                    <Badge status={inv.status} />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-3 text-center">No outstanding invoices due soon</p>
            )}

            {upcoming?.upcoming_subscriptions?.map((sub) => (
              <div key={sub.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                <div>
                  <p className="font-semibold text-slate-800">{sub.name}</p>
                  <p className="text-slate-500">{sub.vendor || 'Subscription'} • Renews {formatDate(sub.renewal_date)}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-rose-500">{formatCurrency(sub.amount, sub.currency)}</p>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">{sub.billing_frequency}</span>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">Recent Activity</h3>
              <p className="text-xs text-slate-500">Latest confirmed transactions</p>
            </div>
            <Link to="/transactions" className="text-xs text-slate-400 hover:text-white transition font-medium">Full Ledger &rarr;</Link>
          </div>

          {loadingRecentTxs ? <ListSkeleton rows={4} label="Loading recent transactions" /> : (
          <div className="space-y-2.5">
            {recentTxs && recentTxs.length > 0 ? (
              recentTxs.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50/70 border border-slate-100 text-xs">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      tx.type === 'INCOME' ? 'bg-emerald-100 text-emerald-700' : (tx.type === 'EXPENSE' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700')
                    }`}>
                      {tx.type === 'INCOME' ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 truncate max-w-[160px] sm:max-w-xs">{tx.description}</p>
                      <p className="text-[10px] text-slate-400">{formatDate(tx.date)} • {tx.account_name || 'Account'}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className={`font-bold ${
                      tx.type === 'INCOME' ? 'text-emerald-600' : (tx.type === 'EXPENSE' ? 'text-slate-900' : 'text-slate-600')
                    }`}>
                      {tx.type === 'INCOME' ? '+' : (tx.type === 'EXPENSE' ? '-' : '')}
                      {formatCurrency(tx.amount, tx.currency)}
                    </p>
                    <span className="text-[10px] text-slate-400">{tx.category_name || tx.type}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-3 text-center">No recent transactions</p>
            )}
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
