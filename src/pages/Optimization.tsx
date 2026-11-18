import React, { useState } from 'react';
import Plot from 'react-plotly.js';
import { Target, Play, Info} from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import { useTheme } from '../context/ThemeContext';
import { optimizationApi } from '../services/api';
import { formatPercent, formatNumber } from '../utils/formatters';
import { getPlotlyLayout, getPlotlyConfig, CHART_COLORS } from '../utils/chartTheme';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { EmptyState } from '../components/common/EmptyState';
import type { OptimizationResult } from '../types';

export const Optimization: React.FC = () => {
  const { selectedPortfolio } = usePortfolio();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [riskFreeRate, setRiskFreeRate] = useState<number>(0.065);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleRunOptimization = async () => {
    if (!selectedPortfolio) return;
    setLoading(true);
    setError(null);
    try {
      const res = await optimizationApi.optimize(selectedPortfolio.id, {
        risk_free_rate: riskFreeRate,
        n_points: 50,
      });
      setResult(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Portfolio optimization failed.');
    } finally {
      setLoading(false);
    }
  };

  if (!selectedPortfolio) {
    return (
      <EmptyState
        title="No Portfolio Selected"
        description="Select a portfolio to run mean-variance optimization and generate the efficient frontier."
      />
    );
  }

  // Efficient Frontier Scatter Plot data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const frontierPlotData: any[] = result && result.efficient_frontier
    ? [
        {
          x: result.efficient_frontier.map((pt) => pt.volatility * 100),
          y: result.efficient_frontier.map((pt) => pt.return * 100),
          type: 'scatter' as const,
          mode: 'lines' as const,
          name: 'Efficient Frontier',
          line: { color: CHART_COLORS.primary, width: 2.5 },
        },
        {
          x: [result.min_variance.expected_volatility * 100],
          y: [result.min_variance.expected_return * 100],
          type: 'scatter' as const,
          mode: 'markers' as const,
          name: 'Minimum Variance',
          marker: { color: CHART_COLORS.success, size: 10, symbol: 'diamond' },
        },
        {
          x: [result.max_sharpe.expected_volatility * 100],
          y: [result.max_sharpe.expected_return * 100],
          type: 'scatter' as const,
          mode: 'markers' as const,
          name: 'Maximum Sharpe',
          marker: { color: CHART_COLORS.benchmark, size: 11, symbol: 'star' },
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* ---------------- Header ---------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Portfolio Optimization</span>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
              {selectedPortfolio.name}
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Markowitz Modern Portfolio Theory: Minimum Variance, Maximum Sharpe & Efficient Frontier
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-500 font-medium">Risk-free Rate:</span>
            <input
              type="number"
              step="0.1"
              value={(riskFreeRate * 100).toFixed(1)}
              onChange={(e) => setRiskFreeRate(Number(e.target.value) / 100)}
              className="w-16 px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-mono"
            />
            <span className="text-slate-500">%</span>
          </div>

          <button
            onClick={handleRunOptimization}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white shadow-xs disabled:opacity-50"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                Optimizing...
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                Run Optimization
              </>
            )}
          </button>
        </div>
      </div>

      {error && <ErrorMessage message={error} onRetry={handleRunOptimization} />}

      {!result && !loading && !error && (
        <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <Target className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Ready to Optimize Portfolio Allocation
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-4">
            Click &ldquo;Run Optimization&rdquo; to solve for optimal long-only weight allocations along the Efficient Frontier using SciPy SLSQP.
          </p>
          <button
            onClick={handleRunOptimization}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
          >
            Compute Optimal Weights
          </button>
        </div>
      )}

      {result && (
        <div className="space-y-6">
          {/* ---------------- Strategy Comparison Table ---------------- */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Strategy Performance Metrics
              </h3>
              <p className="text-[11px] text-slate-400">
                Comparison of optimal mathematical models against expected risk-return targets
              </p>
            </div>

            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 uppercase">
                <tr>
                  <th className="py-3 px-4">Strategy</th>
                  <th className="py-3 px-3 text-right">Expected Return (Ann.)</th>
                  <th className="py-3 px-3 text-right">Expected Volatility (Ann.)</th>
                  <th className="py-3 px-4 text-right">Sharpe Ratio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="py-3 px-4 font-sans font-bold flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    Minimum Variance Portfolio
                  </td>
                  <td className="py-3 px-3 text-right font-semibold text-slate-900 dark:text-slate-100">
                    {formatPercent(result.min_variance.expected_return)}
                  </td>
                  <td className="py-3 px-3 text-right text-emerald-600 dark:text-emerald-400 font-bold">
                    {formatPercent(result.min_variance.expected_volatility)}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-slate-100">
                    {formatNumber(result.min_variance.sharpe)}
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="py-3 px-4 font-sans font-bold flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    Maximum Sharpe Portfolio (Tangency)
                  </td>
                  <td className="py-3 px-3 text-right font-semibold text-slate-900 dark:text-slate-100">
                    {formatPercent(result.max_sharpe.expected_return)}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-700 dark:text-slate-300">
                    {formatPercent(result.max_sharpe.expected_volatility)}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-amber-600 dark:text-amber-400">
                    {formatNumber(result.max_sharpe.sharpe)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ---------------- Efficient Frontier Plot ---------------- */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  The Efficient Frontier
                </h3>
                <p className="text-[11px] text-slate-400">
                  Parametric curve of maximum expected return for each given level of annualized volatility
                </p>
              </div>
              <Target className="w-4 h-4 text-slate-400" />
            </div>

            <div className="h-80 w-full">
              <Plot
                data={frontierPlotData}
                layout={getPlotlyLayout(isDark, {
                  xaxis: { title: 'Expected Volatility (%)' },
                  yaxis: { title: 'Expected Return (%)' },
                  margin: { l: 60, r: 25, t: 25, b: 40 },
                })}
                config={getPlotlyConfig()}
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          </div>

          {/* ---------------- Recommended Weights Breakdown ---------------- */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Recommended Allocation Weights
              </h3>
              <p className="text-[11px] text-slate-400">
                Optimal long-only weights (summing to 100%) for each equity instrument
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-50 dark:bg-slate-800/40 text-[11px] font-semibold text-slate-500 uppercase">
                  <tr>
                    <th className="py-2.5 px-4 font-sans">Stock Symbol</th>
                    <th className="py-2.5 px-3 text-right">Min Variance Weight</th>
                    <th className="py-2.5 px-4 text-right">Max Sharpe Weight</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {result.symbols.map((sym) => {
                    const minW = result.min_variance.weights[sym] || 0;
                    const maxW = result.max_sharpe.weights[sym] || 0;

                    return (
                      <tr key={sym} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-2.5 px-4 font-sans font-bold text-slate-900 dark:text-slate-100">
                          {sym}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-800 dark:text-slate-200">
                          {formatPercent(minW)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-bold text-blue-600 dark:text-blue-400">
                          {formatPercent(maxW)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ---------------- Disclaimer ---------------- */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs text-slate-500 dark:text-slate-400 flex items-start gap-2.5">
            <Info className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" />
            <p className="leading-relaxed text-[11px]">
              <strong className="text-slate-700 dark:text-slate-300">Model Assumptions:</strong> Modern Portfolio Theory assumes asset returns are stationary and normally distributed, and uses historical sample covariance as an estimate of future risk. Optimal allocations are model-based guidelines for research purposes, not guaranteed investment advice.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
