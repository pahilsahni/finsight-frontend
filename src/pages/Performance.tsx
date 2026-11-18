import React, { useState } from 'react';
import Plot from 'react-plotly.js';
import { TrendingUp, BarChart2, RefreshCw } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import { useTheme } from '../context/ThemeContext';
import { usePortfolioPerformance } from '../hooks/usePortfolioPerformance';
import { useHoldings } from '../hooks/useHoldings';
import { formatCurrency, formatPercent, getReturnColor } from '../utils/formatters';
import { getPlotlyLayout, getPlotlyConfig, CHART_COLORS } from '../utils/chartTheme';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { EmptyState } from '../components/common/EmptyState';
import type { Period } from '../types';

export const Performance: React.FC = () => {
  const { selectedPortfolio } = usePortfolio();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [period, setPeriod] = useState<Period>('1y');

  const {
    data: performance,
    loading: perfLoading,
    error: perfError,
    refetch: refetchPerf,
  } = usePortfolioPerformance(selectedPortfolio?.id, period);

  const {
    data: holdings,
    loading: holdingsLoading,
  } = useHoldings(selectedPortfolio?.id);

  if (!selectedPortfolio) {
    return (
      <EmptyState
        title="No Portfolio Selected"
        description="Select or create a portfolio to view detailed performance analytics."
      />
    );
  }

  const hasPerfData = performance && performance.dates && performance.dates.length > 0;

  // Cumulative performance lines
  const growthPlotData = hasPerfData
    ? [
        {
          x: performance.dates,
          y: performance.portfolio_values,
          type: 'scatter' as const,
          mode: 'lines' as const,
          name: selectedPortfolio.name,
          line: { color: CHART_COLORS.primary, width: 2.5 },
        },
        ...(performance.benchmark_values && performance.benchmark_values.length > 0
          ? [
              {
                x: performance.dates,
                y: performance.benchmark_values,
                type: 'scatter' as const,
                mode: 'lines' as const,
                name: 'NIFTY 50 Benchmark',
                line: { color: CHART_COLORS.benchmark, width: 1.5, dash: 'dash' as const },
              },
            ]
          : []),
      ]
    : [];

  // Histogram of daily returns
  const histPlotData = hasPerfData && performance.daily_returns
    ? [
        {
          x: performance.daily_returns.map((r) => r * 100),
          type: 'histogram' as const,
          nbinsx: 35,
          name: 'Daily Returns (%)',
          marker: {
            color: CHART_COLORS.primary,
            opacity: 0.75,
            line: { color: CHART_COLORS.primary, width: 1 },
          },
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* ---------------- Header ---------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Performance Analytics</span>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
              {selectedPortfolio.name}
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Historical portfolio trajectory, daily return distributions & equity performance
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 bg-white dark:bg-slate-900 shadow-xs">
            {(['1m', '3m', '6m', '1y', '2y', '3y', '5y'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md uppercase transition-colors ${
                  period === p
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            onClick={refetchPerf}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {perfError && <ErrorMessage message={perfError} onRetry={refetchPerf} />}

      {/* ---------------- Section 1: Portfolio Growth Chart ---------------- */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Portfolio Growth Trajectory (INR)
            </h3>
            <p className="text-[11px] text-slate-400">
              Indexed historical portfolio value compared with NIFTY 50 benchmark
            </p>
          </div>
          <TrendingUp className="w-4 h-4 text-slate-400" />
        </div>

        <div className="h-80 w-full">
          {perfLoading ? (
            <LoadingSpinner size="md" text="Loading historical price trends..." className="h-full" />
          ) : hasPerfData ? (
            <Plot
              data={growthPlotData}
              layout={getPlotlyLayout(isDark, {
                yaxis: { title: 'Portfolio Value (₹)' },
                margin: { l: 65, r: 25, t: 25, b: 40 },
              })}
              config={getPlotlyConfig()}
              style={{ width: '100%', height: '100%' }}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              No historical data available. Ensure market quotes are accessible.
            </div>
          )}
        </div>
      </div>

      {/* ---------------- Section 2: Returns Distribution ---------------- */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Daily Returns Distribution
            </h3>
            <p className="text-[11px] text-slate-400">
              Empirical frequency distribution of portfolio daily percentage changes
            </p>
          </div>
          <BarChart2 className="w-4 h-4 text-slate-400" />
        </div>

        <div className="h-72 w-full">
          {perfLoading ? (
            <LoadingSpinner size="md" text="Computing returns distribution..." className="h-full" />
          ) : histPlotData.length > 0 ? (
            <Plot
              data={histPlotData}
              layout={getPlotlyLayout(isDark, {
                xaxis: { title: 'Daily Return (%)' },
                yaxis: { title: 'Observation Count' },
                margin: { l: 55, r: 25, t: 20, b: 40 },
              })}
              config={getPlotlyConfig()}
              style={{ width: '100%', height: '100%' }}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              Insufficient return observations.
            </div>
          )}
        </div>
      </div>

      {/* ---------------- Section 3: Equity Holdings Performance ---------------- */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Individual Stock Performance
          </h3>
          <p className="text-[11px] text-slate-400">Performance and return contribution across holdings</p>
        </div>

        <div className="overflow-x-auto">
          {holdingsLoading ? (
            <LoadingSpinner size="sm" text="Loading holdings..." className="py-8" />
          ) : holdings.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">No holdings found.</div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Symbol</th>
                  <th className="py-3 px-3">Company</th>
                  <th className="py-3 px-3 text-right">Quantity</th>
                  <th className="py-3 px-3 text-right">Avg Cost</th>
                  <th className="py-3 px-3 text-right">Current Price</th>
                  <th className="py-3 px-3 text-right">Market Value</th>
                  <th className="py-3 px-4 text-right">Total Gain/Loss</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                {holdings.map((h) => {
                  const currentPrice = h.current_price || h.average_buy_price;
                  const invested = h.quantity * h.average_buy_price;
                  const currentVal = h.quantity * currentPrice;
                  const pnl = currentVal - invested;
                  const pnlPct = invested > 0 ? (pnl / invested) : 0;

                  return (
                    <tr key={h.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-sans font-bold text-slate-900 dark:text-slate-100">
                        {h.symbol}
                      </td>
                      <td className="py-3 px-3 font-sans text-slate-600 dark:text-slate-400 truncate max-w-[160px]">
                        {h.company_name || '-'}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-700 dark:text-slate-300">
                        {h.quantity}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-400">
                        {formatCurrency(h.average_buy_price)}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-900 dark:text-slate-100 font-semibold">
                        {formatCurrency(currentPrice)}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-900 dark:text-slate-100">
                        {formatCurrency(currentVal)}
                      </td>
                      <td className={`py-3 px-4 text-right font-bold ${getReturnColor(pnl)}`}>
                        {formatCurrency(pnl)}
                        <span className="block text-[10px] font-normal">
                          {pnl >= 0 ? '+' : ''}{formatPercent(pnlPct)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
