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
    positive: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40',
    negative: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/40',
    neutral: 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
  };

  return (
    <div
      className={`rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-4 shadow-sm transition-all hover:border-slate-300 dark:hover:border-slate-700 ${className}`}
    >
      <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
        <span>{label}</span>
        {tooltip && (
          <span title={tooltip} className="cursor-help text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <HelpCircle className="w-3.5 h-3.5" />
          </span>
        )}
      </div>

      <div className="mt-2 flex items-baseline justify-between gap-2">
        {loading ? (
          <div className="h-7 w-28 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        ) : (
          <div className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-mono">
            {value}
          </div>
        )}

        {change && (
          <span
            className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold font-mono border ${changeColors[changeType]}`}
          >
            {change}
          </span>
        )}
      </div>

      {subtitle && (
        <div className="mt-1 text-xs text-slate-400 dark:text-slate-500 truncate">
          {subtitle}
        </div>
      )}
    </div>
  );
};
