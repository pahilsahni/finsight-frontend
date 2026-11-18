import React, { useState } from 'react';
import Plot from 'react-plotly.js';
import { Activity, Play, Info } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import { useTheme } from '../context/ThemeContext';
import { simulationApi } from '../services/api';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { getPlotlyLayout, getPlotlyConfig, CHART_COLORS } from '../utils/chartTheme';
import { MetricCard } from '../components/common/MetricCard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { EmptyState } from '../components/common/EmptyState';
import type { MonteCarloResult } from '../types';

export const MonteCarlo: React.FC = () => {
  const { selectedPortfolio } = usePortfolio();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [nSimulations, setNSimulations] = useState<number>(5000);
  const [nDays, setNDays] = useState<number>(252);
  const [lossThreshold, setLossThreshold] = useState<number>(20);

  const [result, setResult] = useState<MonteCarloResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleRunSimulation = async () => {
    if (!selectedPortfolio) return;
    setLoading(true);
    setError(null);
    try {
      const res = await simulationApi.monteCarlo(selectedPortfolio.id, {
        n_simulations: nSimulations,
        n_days: nDays,
        loss_threshold_pct: lossThreshold / 100,
      });
      setResult(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Simulation failed.');
    } finally {
      setLoading(false);
    }
  };

  if (!selectedPortfolio) {
    return (
      <EmptyState
        title="No Portfolio Selected"
        description="Select a portfolio to run Monte Carlo trajectory forecasting."
      />
    );
  }

  // Simulation paths plot
  const pathsPlotData = result && result.sample_paths
    ? result.sample_paths.slice(0, 150).map((path, idx) => ({
        x: Array.from({ length: path.length }, (_, i) => i),
        y: path,
        type: 'scatter' as const,
        mode: 'lines' as const,
        showlegend: false,
        line: {
          color: idx === 0 ? CHART_COLORS.primary : isDark ? '#334155' : '#cbd5e1',
          width: 0.8,
          opacity: 0.25,
        },
      }))
    : [];

  return (
    <div className="space-y-6">
      {/* ---------------- Header ---------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Monte Carlo Simulation</span>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
              {selectedPortfolio.name}
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Statistical portfolio forecasting based on historical covariance and return distributions
          </p>
        </div>
      </div>

      {/* ---------------- Parameters Control Card ---------------- */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">
          Simulation Parameters
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Simulations ({nSimulations.toLocaleString()})
            </label>
            <input
              type="range"
              min="1000"
              max="10000"
              step="500"
              value={nSimulations}
              onChange={(e) => setNSimulations(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>1,000</span>
              <span>5,000 (standard)</span>
              <span>10,000</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Forecast Horizon (Trading Days)
            </label>
            <select
              value={nDays}
              onChange={(e) => setNDays(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="63">3 Months (63 trading days)</option>
              <option value="126">6 Months (126 trading days)</option>
              <option value="252">1 Year (252 trading days)</option>
              <option value="504">2 Years (504 trading days)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Loss Threshold (%)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="5"
                max="50"
                value={lossThreshold}
                onChange={(e) => setLossThreshold(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-xs text-slate-400 font-medium">%</span>
            </div>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={handleRunSimulation}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white shadow-sm transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                Simulating {nSimulations.toLocaleString()} paths...
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                Run Monte Carlo Simulation
              </>
            )}
          </button>
        </div>
      </div>

      {error && <ErrorMessage message={error} onRetry={handleRunSimulation} />}

      {/* ---------------- Results ---------------- */}
      {result && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <MetricCard
              label="Median Outcome (p50)"
              value={formatCurrency(result.terminal_values.p50)}
              subtitle={`After ${result.n_days} trading days`}
              changeType="neutral"
            />
            <MetricCard
              label="Pessimistic Case (p5)"
              value={formatCurrency(result.terminal_values.p5)}
              subtitle="5th percentile outcome"
              changeType="negative"
            />
            <MetricCard
              label="Optimistic Case (p95)"
              value={formatCurrency(result.terminal_values.p95)}
              subtitle="95th percentile outcome"
              changeType="positive"
            />
            <MetricCard
              label={`Prob. Loss > ${lossThreshold}%`}
              value={formatPercent(result.prob_loss_threshold)}
              changeType={result.prob_loss_threshold > 0.25 ? 'negative' : 'neutral'}
              subtitle="Probability of crossing loss threshold"
            />
          </div>

          {/* Paths Chart */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Simulated Portfolio Paths
                </h3>
                <p className="text-[11px] text-slate-400">
                  Displaying representative subset of {pathsPlotData.length} paths over {result.n_days} trading days
                </p>
              </div>
              <Activity className="w-4 h-4 text-slate-400" />
            </div>

            <div className="h-84 w-full">
              <Plot
                data={pathsPlotData}
                layout={getPlotlyLayout(isDark, {
                  xaxis: { title: 'Trading Days Ahead' },
                  yaxis: { title: 'Simulated Value (₹)' },
                  margin: { l: 65, r: 25, t: 25, b: 40 },
                })}
                config={getPlotlyConfig()}
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          </div>

          {/* Percentile Table */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
              Terminal Value Percentiles
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-50 dark:bg-slate-800/40 text-[11px] font-semibold text-slate-500 uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Percentile</th>
                    <th className="py-2.5 px-3">Scenario Interpretation</th>
                    <th className="py-2.5 px-3 text-right">Projected Value (INR)</th>
                    <th className="py-2.5 px-3 text-right">Implied Return (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {[
                    { p: '5th', val: result.terminal_values.p5, label: 'Extreme Downside' },
                    { p: '25th', val: result.terminal_values.p25, label: 'Moderate Downside' },
                    { p: '50th', val: result.terminal_values.p50, label: 'Median / Expected' },
                    { p: '75th', val: result.terminal_values.p75, label: 'Moderate Upside' },
                    { p: '95th', val: result.terminal_values.p95, label: 'Extreme Upside' },
                  ].map((row, idx) => {
                    const ret = (row.val - result.portfolio_value) / result.portfolio_value;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-2.5 px-3 font-bold">{row.p}</td>
                        <td className="py-2.5 px-3 font-sans text-slate-600 dark:text-slate-400">
                          {row.label}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-slate-100">
                          {formatCurrency(row.val)}
                        </td>
                        <td
                          className={`py-2.5 px-3 text-right font-bold ${
                            ret >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {ret >= 0 ? '+' : ''}{formatPercent(ret)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- Disclaimer ---------------- */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs text-slate-500 dark:text-slate-400 flex items-start gap-2.5">
        <Info className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" />
        <p className="leading-relaxed text-[11px]">
          <strong className="text-slate-700 dark:text-slate-300">Statistical Disclosure:</strong> Monte Carlo simulation models future price trajectories using empirical historical returns and covariance. It assumes normal distribution parameters and does not forecast black-swan events, structural macro shifts, or policy changes. Results are for probabilistic risk assessment only and do not guarantee future performance.
        </p>
      </div>
    </div>
  );
};
