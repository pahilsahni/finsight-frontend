import React from 'react';
import { HelpCircle } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  subtitle?: string;
  tooltip?: string;
  loading?: boolean;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  change,
  changeType = 'neutral',
  subtitle,
  tooltip,
  loading = false,
  className = '',
}) => {
  const changeColors = {
    positive: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    negative: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    neutral: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
  };

  return (
    <div
      className={`group flex min-w-0 min-h-[132px] flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/80 dark:hover:border-slate-700 ${className}`}
    >
      <div className="flex min-w-0 items-center justify-between gap-2">
        <span className="min-w-0 text-xs font-medium leading-5 text-slate-500 dark:text-slate-400">
          {label}
        </span>
        {tooltip && (
          <span
            title={tooltip}
            className="shrink-0 cursor-help text-slate-400 transition-colors hover:text-blue-500"
          >
            <HelpCircle className="h-3.5 w-3.5" />
          </span>
        )}
      </div>

      <div className="mt-4 min-w-0">
        {loading ? (
          <div className="h-7 w-3/4 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        ) : (
          <div
            className="min-w-0 text-[clamp(0.9rem,1.15vw,1.25rem)] font-bold leading-tight tracking-tight text-slate-900 dark:text-slate-100 font-mono [overflow-wrap:anywhere] tabular-nums"
            title={String(value)}
          >
            {value}
          </div>
        )}

        {change && !loading && (
          <span
            className={`mt-2 inline-flex max-w-full items-center rounded-md border px-2 py-1 text-[11px] font-semibold leading-tight font-mono ${changeColors[changeType]}`}
          >
            {change}
          </span>
        )}
      </div>

      {subtitle && (
        <div className="mt-2 truncate text-[11px] text-slate-400 dark:text-slate-500">
          {subtitle}
        </div>
      )}
    </div>
  );
};
