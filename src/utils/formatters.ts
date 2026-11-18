/**
 * Formatting utilities for Indian financial numbers, currency, and dates.
 */

export function formatCurrency(value: number | undefined | null, currency = 'INR'): string {
  if (value === undefined || value === null || isNaN(value)) {
    return '₹0.00';
  }
  const prefix = currency === 'INR' ? '₹' : '';
  const formatted = Math.abs(value).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${value < 0 ? '-' : ''}${prefix}${formatted}`;
}

export function formatPercent(value: number | undefined | null, decimals = 2): string {
  if (value === undefined || value === null || isNaN(value)) {
    return '0.00%';
  }
  return `${(value * 100).toFixed(decimals)}%`;
}

export function formatPercentRaw(value: number | undefined | null, decimals = 2): string {
  if (value === undefined || value === null || isNaN(value)) {
    return '0.00%';
  }
  return `${value.toFixed(decimals)}%`;
}

export function formatNumber(value: number | undefined | null, decimals = 2): string {
  if (value === undefined || value === null || isNaN(value)) {
    return '0.00';
  }
  return value.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function formatReturn(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) {
    return '0.00%';
  }
  const prefix = value > 0 ? '▲ +' : value < 0 ? '▼ ' : '';
  return `${prefix}${(value * 100).toFixed(2)}%`;
}

export function getReturnColor(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) {
    return 'text-slate-500 dark:text-slate-400';
  }
  if (value > 0) return 'text-emerald-600 dark:text-emerald-400';
  if (value < 0) return 'text-rose-600 dark:text-rose-400';
  return 'text-slate-500 dark:text-slate-400';
}

export function getReturnBg(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) {
    return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
  }
  if (value > 0) return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50';
  if (value < 0) return 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50';
  return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
}
