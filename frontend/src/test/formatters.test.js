import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate, formatPercent } from '../utils/formatters';

describe('Financial Formatters', () => {
  it('formats currency correctly for USD and PKR', () => {
    expect(formatCurrency(1500.5, 'USD')).toBe('$1,500.50');
    expect(formatCurrency('2000', 'USD')).toBe('$2,000.00');
    expect(formatCurrency(0, 'USD')).toBe('$0.00');
    expect(formatCurrency(5000, 'PKR')).toBe('Rs. 5,000.00');
  });

  it('formats dates consistently', () => {
    expect(formatDate('2026-05-15')).toBe('May 15, 2026');
  });

  it('formats percentage', () => {
    expect(formatPercent(25.55)).toBe('25.6%');
    expect(formatPercent('10')).toBe('10.0%');
  });
});
