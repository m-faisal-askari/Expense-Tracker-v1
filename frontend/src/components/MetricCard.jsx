import React from 'react';
import { formatCurrency } from '../utils/formatters';

export function MetricCard({ title, amount, currency = 'USD', subtitle, icon: Icon, color = 'indigo', isNegative = false }) {
  const colorMap = {
    indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    amber: 'text-amber-600 bg-amber-50 border-amber-100',
    rose: 'text-rose-600 bg-rose-50 border-rose-100',
    slate: 'text-slate-600 bg-slate-100 border-slate-200',
    stone: 'text-amber-600 bg-amber-50 border-amber-100',
  };

  const badgeStyle = colorMap[color] || colorMap.indigo;

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm hover:shadow transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</span>
        {Icon && (
          <div className={`p-2 rounded-lg border ${badgeStyle}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <h3 className={`text-2xl font-bold tracking-tight ${isNegative ? 'text-rose-600' : 'text-slate-900'}`}>
          {formatCurrency(amount, currency)}
        </h3>
      </div>
      {subtitle && (
        <p className="mt-1 text-xs text-slate-500 font-medium">{subtitle}</p>
      )}
    </div>
  );
}
