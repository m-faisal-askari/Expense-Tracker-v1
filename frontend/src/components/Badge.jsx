import React from 'react';

export function Badge({ status, label }) {
  const text = label || status;
  const s = (status || '').toUpperCase();

  let styles = 'bg-slate-100 text-slate-700 border-slate-200';

  if (['PAID', 'CONFIRMED', 'ACTIVE', 'COMPLETED'].includes(s)) {
    styles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (['PARTIALLY_PAID', 'PENDING', 'IN_PROGRESS'].includes(s)) {
    styles = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (['OVERDUE', 'CANCELLED', 'ARCHIVED'].includes(s)) {
    styles = 'bg-rose-50 text-rose-700 border-rose-200';
  } else if (['SENT', 'DRAFT'].includes(s)) {
    styles = 'bg-slate-100 text-slate-700 border-slate-200';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles}`}>
      {text}
    </span>
  );
}
