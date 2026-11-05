export const EXCHANGE_RATES = {
  USD: 1.0,
  PKR: 0.003590, // 1 PKR ≈ 0.00359 USD (1 USD ≈ 278.55 PKR)
  EUR: 1.085,
  GBP: 1.295,
  CAD: 0.72,
  AUD: 0.66,
  INR: 0.0119,
  JPY: 0.0066,
  SGD: 0.755
};

export function convertAmount(amount, fromCurrency = 'USD', toCurrency = 'USD') {
  const numeric = typeof amount === 'number' ? amount : parseFloat(amount || 0);
  if (isNaN(numeric)) return 0;
  
  const from = (fromCurrency || 'USD').toUpperCase();
  const to = (toCurrency || 'USD').toUpperCase();
  if (from === to) return numeric;

  const rateFrom = EXCHANGE_RATES[from] || 1.0;
  const rateTo = EXCHANGE_RATES[to] || 1.0;

  const usdValue = numeric * rateFrom;
  return usdValue / rateTo;
}

export function formatCurrency(amount, currency = 'USD') {
  const numeric = typeof amount === 'number' ? amount : parseFloat(amount || 0);
  const curr = (currency || 'USD').toUpperCase();

  if (curr === 'PKR') {
    return `Rs. ${new Intl.NumberFormat('en-PK', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numeric)}`;
  }

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numeric);
  } catch (e) {
    return `${curr} ${numeric.toFixed(2)}`;
  }
}

export function formatDate(dateString) {
  if (!dateString) return '—';
  try {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch (e) {
    return dateString;
  }
}

export function formatPercent(value) {
  const num = typeof value === 'number' ? value : parseFloat(value || 0);
  return `${num.toFixed(1)}%`;
}
