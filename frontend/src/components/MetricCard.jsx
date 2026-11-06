import React from 'react';
import { formatCurrency } from '../utils/formatters';

export function MetricCard({ title, amount, currency = 'USD', subtitle, icon: Icon, isNegative = false }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:shadow transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</span>
        {Icon && (
          <div className="p-2 rounded-lg border border-[var(--analytics-border)] bg-[var(--analytics-soft)] text-[var(--analytics-text)]">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <h3 className={`text-2xl font-bold font-mono tracking-tight ${isNegative ? 'text-rose-500' : 'text-[var(--analytics-text)]'}`}>
          {formatCurrency(amount, currency)}
        </h3>
      </div>
      {subtitle && (
        <p className="mt-1 text-xs text-slate-400 font-medium">{subtitle}</p>
      )}
    </div>
  );
}
