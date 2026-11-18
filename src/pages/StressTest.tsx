import React, { useState } from 'react';
import Plot from 'react-plotly.js';
import { AlertTriangle, Play, Info } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import { useTheme } from '../context/ThemeContext';
import { stressApi } from '../services/api';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { getPlotlyLayout, getPlotlyConfig, CHART_COLORS } from '../utils/chartTheme';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { EmptyState } from '../components/common/EmptyState';
import type { StressTestResult } from '../types';

export const StressTest: React.FC = () => {
  const { selectedPortfolio } = usePortfolio();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([
    'market_decline_5',
    'market_decline_10',
    'market_decline_20',
    'market_decline_30',
  ]);
  const [customShock, setCustomShock] = useState<string>('');

  const [result, setResult] = useState<StressTestResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const scenarioOptions = [
    { key: 'market_decline_5', name: 'Market Decline 5%', shock: -0.05 },
    { key: 'market_decline_10', name: 'Market Decline 10%', shock: -0.10 },
    { key: 'market_decline_20', name: 'Market Decline 20%', shock: -0.20 },
    { key: 'market_decline_30', name: 'Market Decline 30%', shock: -0.30 },
    { key: 'market_rally_10', name: 'Market Rally 10%', shock: +0.10 },
  ];

  const handleToggleScenario = (key: string) => {
    setSelectedScenarios((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleRunStressTest = async () => {
    if (!selectedPortfolio) return;
    if (selectedScenarios.length === 0 && !customShock) {
      setError('Please select at least one scenario or enter a custom shock.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const parsedCustom = customShock ? Number(customShock) / 100 : undefined;
      const res = await stressApi.test(selectedPortfolio.id, {
        scenarios: selectedScenarios,
        uniform_shock: parsedCustom,
      });
      setResult(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Stress test execution failed.');
    } finally {
      setLoading(false);
    }
  };

  if (!selectedPortfolio) {
    return (
      <EmptyState
        title="No Portfolio Selected"
        description="Select a portfolio to evaluate portfolio resilience under market stress scenarios."
      />
    );
  }

  // Plotly Bar chart comparing Pre-Shock vs Stressed Values
  const comparisonPlotData = result
    ? [
        {
          x: result.scenarios.map((s) => s.scenario_name),
          y: result.scenarios.map(() => result.portfolio_value),
          name: 'Original Value',
          type: 'bar' as const,
          marker: { color: isDark ? '#334155' : '#94a3b8' },
        },
        {
          x: result.scenarios.map((s) => s.scenario_name),
          y: result.scenarios.map((s) => s.stressed_value),
          name: 'Stressed Value',
          type: 'bar' as const,
          marker: {
            color: result.scenarios.map((s) =>
              s.shock < 0 ? CHART_COLORS.danger : CHART_COLORS.success
            ),
          },
        },
      ]
    : [];

  // Most severe scenario for asset-level table
  const worstScenario = result && result.scenarios.length > 0
    ? [...result.scenarios].sort((a, b) => b.loss - a.loss)[0]
    : null;

  return (
    <div className="space-y-6">
      {/* ---------------- Header ---------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Market Stress Testing</span>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
              {selectedPortfolio.name}
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Hypothetical macro shocks & portfolio drawdown impact analysis
          </p>
        </div>
      </div>

      {/* ---------------- Scenario Selection Controls ---------------- */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
          Select Shock Scenarios
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
          {scenarioOptions.map((s) => {
            const isChecked = selectedScenarios.includes(s.key);
            return (
              <label
                key={s.key}
                className={`flex items-center gap-2.5 p-3 rounded-lg border text-xs cursor-pointer transition-colors ${
                  isChecked
                    ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20 text-slate-900 dark:text-slate-100 font-semibold'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleToggleScenario(s.key)}
                  className="rounded text-blue-600 accent-blue-600"
                />
                <span>{s.name}</span>
              </label>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-600 dark:text-slate-400 font-medium">Custom Shock:</span>
            <input
              type="number"
              placeholder="-15"
              value={customShock}
              onChange={(e) => setCustomShock(e.target.value)}
              className="w-20 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-slate-400">%</span>
          </div>

          <button
            onClick={handleRunStressTest}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white shadow-sm transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                Evaluating Shocks...
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                Execute Stress Test
              </>
            )}
          </button>
        </div>
      </div>

      {error && <ErrorMessage message={error} onRetry={handleRunStressTest} />}

      {/* ---------------- Results ---------------- */}
      {result && (
        <div className="space-y-6">
          {/* Scenario Overview Table */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Scenario Impact Summary
              </h3>
              <p className="text-[11px] text-slate-400">
                Estimated portfolio valuation and monetary loss across evaluated market events
              </p>
            </div>

            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 uppercase">
                <tr>
                  <th className="py-3 px-4">Scenario</th>
                  <th className="py-3 px-3 text-right">Pre-Shock Value</th>
                  <th className="py-3 px-3 text-right">Stressed Value</th>
                  <th className="py-3 px-3 text-right">Estimated Loss</th>
                  <th className="py-3 px-4 text-right">Drawdown %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {result.scenarios.map((sc) => (
                  <tr key={sc.scenario_key} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-sans font-bold text-slate-900 dark:text-slate-100">
                      {sc.scenario_name}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-400">
                      {formatCurrency(result.portfolio_value)}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrency(sc.stressed_value)}
                    </td>
                    <td
                      className={`py-3 px-3 text-right font-bold ${
                        sc.loss > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {sc.loss > 0 ? '-' : '+'}{formatCurrency(Math.abs(sc.loss))}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-bold ${
                        sc.loss_pct > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {sc.loss_pct > 0 ? '-' : '+'}{formatPercent(Math.abs(sc.loss_pct))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Scenario Comparison Chart */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Scenario Valuation Comparison
                </h3>
                <p className="text-[11px] text-slate-400">
                  Original portfolio valuation vs stressed valuation under each scenario
                </p>
              </div>
              <AlertTriangle className="w-4 h-4 text-slate-400" />
            </div>

            <div className="h-72 w-full">
              <Plot
                data={comparisonPlotData}
                layout={getPlotlyLayout(isDark, {
                  barmode: 'group',
                  yaxis: { title: 'Value (₹)' },
                  margin: { l: 65, r: 25, t: 25, b: 40 },
                })}
                config={getPlotlyConfig()}
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          </div>

          {/* Asset-Level Impact Table */}
          {worstScenario && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Asset-Level Breakdown ({worstScenario.scenario_name})
                </h3>
                <p className="text-[11px] text-slate-400">
                  Individual equity shock attribution sorted by loss severity
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-50 dark:bg-slate-800/40 text-[11px] font-semibold text-slate-500 uppercase">
                    <tr>
                      <th className="py-2.5 px-4 font-sans">Stock Symbol</th>
                      <th className="py-2.5 px-3 text-right">Estimated Loss (₹)</th>
                      <th className="py-2.5 px-4 text-right">Asset Drawdown (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {worstScenario.asset_impacts.map((asset) => (
                      <tr key={asset.symbol} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-2.5 px-4 font-sans font-bold text-slate-900 dark:text-slate-100">
                          {asset.symbol}
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold text-rose-600 dark:text-rose-400">
                          {formatCurrency(asset.loss)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-bold text-rose-600 dark:text-rose-400">
                          -{formatPercent(asset.loss_pct)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs text-slate-500 dark:text-slate-400 flex items-start gap-2.5">
            <Info className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" />
            <p className="leading-relaxed text-[11px]">
              <strong className="text-slate-700 dark:text-slate-300">Hypothetical Stress Testing Notice:</strong> Stress scenarios simulate immediate shocks to market values. In real downturns, equity correlations can spike, liquidity can contract, and individual sector fundamentals may vary. These results are hypothetical sensitivity simulations, not actual loss forecasts.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
