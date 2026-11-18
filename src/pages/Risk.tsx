import React, { useState } from 'react';
import Plot from 'react-plotly.js';
import { Shield, RefreshCw, Info } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import { useTheme } from '../context/ThemeContext';
import { useRiskMetrics } from '../hooks/useRiskMetrics';
import { useApi } from '../hooks/useApi';
import { analyticsApi } from '../services/api';
import { formatCurrency, formatPercent, formatNumber } from '../utils/formatters';
import { getPlotlyLayout, getPlotlyConfig, CHART_COLORS } from '../utils/chartTheme';
import { MetricCard } from '../components/common/MetricCard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { EmptyState } from '../components/common/EmptyState';
import type { Period } from '../types';

export const Risk: React.FC = () => {
  const { selectedPortfolio } = usePortfolio();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [confidence, setConfidence] = useState<number>(0.95);
  const [riskFreeRate, setRiskFreeRate] = useState<number>(0.065);
  const [corrPeriod, setCorrPeriod] = useState<Period>('1y');

  const {
    data: riskData,
    loading: riskLoading,
    error: riskError,
    refetch: refetchRisk,
  } = useRiskMetrics(selectedPortfolio?.id, confidence, riskFreeRate);

  const {
    data: corrData,
    loading: corrLoading,
    error: corrError,
    refetch: refetchCorr,
  } = useApi(
    () =>
      selectedPortfolio?.id
        ? analyticsApi.correlation(selectedPortfolio.id, corrPeriod)
        : Promise.resolve(null),
    [selectedPortfolio?.id, corrPeriod]
  );

  const {
    data: riskContrib,
    loading: contribLoading,
    error: contribError,
    refetch: refetchContrib,
  } = useApi(
    () =>
      selectedPortfolio?.id
        ? analyticsApi.riskContribution(selectedPortfolio.id)
        : Promise.resolve(null),
    [selectedPortfolio?.id]
  );

  if (!selectedPortfolio) {
    return (
      <EmptyState
        title="No Portfolio Selected"
        description="Select a portfolio to view quantitative risk modeling and correlation metrics."
      />
    );
  }

  // Correlation heatmap trace
  const hasCorr = corrData && corrData.symbols && corrData.matrix && corrData.matrix.length > 0;
  const heatmapData = hasCorr
    ? [
        {
          z: corrData.matrix,
          x: corrData.symbols,
          y: corrData.symbols,
          type: 'heatmap' as const,
          colorscale: 'RdYlGn' as const,
          reversescale: true,
          zmin: -1,
          zmax: 1,
          showscale: true,
        },
      ]
    : [];

  // Risk contribution bar trace
  const hasContrib = riskContrib && riskContrib.symbols && riskContrib.percent;
  const contribBarData = hasContrib
    ? [
        {
          x: riskContrib.symbols,
          y: riskContrib.percent.map((p) => p * 100),
          type: 'bar' as const,
          marker: {
            color: CHART_COLORS.primary,
          },
        },
      ]
    : [];

  const handleRefresh = () => {
    refetchRisk();
    refetchCorr();
    refetchContrib();
  };

  return (
    <div className="space-y-6">
      {/* ---------------- Header & Controls ---------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Risk Analytics & Diversification</span>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
              {selectedPortfolio.name}
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Historical Value at Risk (VaR), Expected Shortfall, Volatility & Risk Attribution
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Confidence Selector */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-500 font-medium">Confidence:</span>
            <select
              value={confidence}
              onChange={(e) => setConfidence(Number(e.target.value))}
              className="px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 shadow-xs"
            >
              <option value={0.9}>90%</option>
              <option value={0.95}>95%</option>
              <option value={0.99}>99%</option>
            </select>
          </div>

          {/* Risk-free Rate */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-500 font-medium">Risk-free:</span>
            <input
              type="number"
              step="0.1"
              value={(riskFreeRate * 100).toFixed(1)}
              onChange={(e) => setRiskFreeRate(Number(e.target.value) / 100)}
              className="w-16 px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-mono shadow-xs"
            />
            <span className="text-slate-500">%</span>
          </div>

          <button
            onClick={handleRefresh}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {riskError && <ErrorMessage message={riskError} onRetry={refetchRisk} />}

      {/* ---------------- Primary Risk Metrics ---------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <MetricCard
          label={`Value at Risk (${(confidence * 100).toFixed(0)}%)`}
          value={formatCurrency(
            confidence === 0.9 ? riskData?.var_90 : confidence === 0.99 ? riskData?.var_99 : riskData?.var_95
          )}
          tooltip="Maximum expected loss over 1 day at chosen confidence level."
          loading={riskLoading}
        />
        <MetricCard
          label={`CVaR / Shortfall (${(confidence * 100).toFixed(0)}%)`}
          value={formatCurrency(riskData?.cvar_95)}
          tooltip="Conditional VaR: expected loss on days when loss exceeds the VaR threshold."
          loading={riskLoading}
        />
        <MetricCard
          label="Annualized Volatility"
          value={formatPercent(riskData?.volatility_annual)}
          tooltip="Standard deviation of daily portfolio returns scaled by sqrt(252)."
          loading={riskLoading}
        />
        <MetricCard
          label="Sharpe Ratio"
          value={riskData ? formatNumber(riskData.sharpe_ratio) : '0.00'}
          changeType={riskData?.sharpe_ratio && riskData.sharpe_ratio > 1 ? 'positive' : 'neutral'}
          tooltip={`Annualized excess return over risk-free rate of ${(riskFreeRate * 100).toFixed(1)}%.`}
          loading={riskLoading}
        />
        <MetricCard
          label="Portfolio Beta"
          value={riskData ? formatNumber(riskData.beta) : '1.00'}
          tooltip="Covariance with NIFTY 50 benchmark divided by variance of benchmark."
          loading={riskLoading}
        />
        <MetricCard
          label="Max Drawdown"
          value={formatPercent(riskData?.max_drawdown)}
          changeType="negative"
          tooltip="Largest peak-to-trough cumulative decline."
          loading={riskLoading}
        />
      </div>

      {/* ---------------- Section 1: Correlation Matrix Heatmap ---------------- */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Holdings Correlation Matrix
            </h3>
            <p className="text-[11px] text-slate-400">
              Pairwise Pearson return correlation among portfolio assets (-1.0 to +1.0)
            </p>
          </div>

          <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-50 dark:bg-slate-800 text-[11px]">
            {(['6m', '1y', '2y', '3y'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setCorrPeriod(p)}
                className={`px-2 py-0.5 rounded font-medium uppercase ${
                  corrPeriod === p
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {corrError && <ErrorMessage message={corrError} onRetry={refetchCorr} />}

        <div className="h-96 w-full">
          {corrLoading ? (
            <LoadingSpinner size="md" text="Computing correlation matrix..." className="h-full" />
          ) : hasCorr ? (
            <Plot
              data={heatmapData}
              layout={getPlotlyLayout(isDark, {
                margin: { l: 80, r: 40, t: 30, b: 80 },
              })}
              config={getPlotlyConfig()}
              style={{ width: '100%', height: '100%' }}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              Need at least 2 assets with historical price data for correlation.
            </div>
          )}
        </div>
      </div>

      {/* ---------------- Section 2: Component Risk Contribution ---------------- */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Risk Contribution by Asset (%)
            </h3>
            <p className="text-[11px] text-slate-400">
              Marginal and component percentage contribution of each equity holding to overall portfolio volatility
            </p>
          </div>
          <Shield className="w-4 h-4 text-slate-400" />
        </div>

        {contribError && <ErrorMessage message={contribError} onRetry={refetchContrib} />}

        <div className="h-72 w-full">
          {contribLoading ? (
            <LoadingSpinner size="md" text="Calculating risk attribution..." className="h-full" />
          ) : hasContrib ? (
            <Plot
              data={contribBarData}
              layout={getPlotlyLayout(isDark, {
                yaxis: { title: 'Contribution to Volatility (%)' },
                margin: { l: 55, r: 25, t: 25, b: 40 },
              })}
              config={getPlotlyConfig()}
              style={{ width: '100%', height: '100%' }}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              Unable to compute component risk contribution.
            </div>
          )}
        </div>
      </div>

      {/* ---------------- Section 3: Metric Glossary ---------------- */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm text-xs space-y-3">
        <h4 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          Quantitative Risk Methodology & Glossary
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
          <div>
            <span className="font-semibold text-slate-800 dark:text-slate-200 block mb-0.5">
              Historical Value at Risk (VaR)
            </span>
            Calculated directly from empirical return distributions at 90%, 95%, and 99% confidence levels, showing the estimated maximum monetary loss expected over a 1-day holding period.
          </div>
          <div>
            <span className="font-semibold text-slate-800 dark:text-slate-200 block mb-0.5">
              Conditional VaR (CVaR / Expected Shortfall)
            </span>
            Measures the average loss severity conditional on returns falling into the tail beyond the VaR threshold. Addresses fat-tail risks that standard VaR may overlook.
          </div>
          <div>
            <span className="font-semibold text-slate-800 dark:text-slate-200 block mb-0.5">
              Benchmark Beta & Annualization
            </span>
            Beta evaluates systematic sensitivity against the NIFTY 50 index (^NSEI). All volatility and Sharpe metrics are annualized using the standard Indian market convention of 252 trading days.
          </div>
        </div>
      </div>
    </div>
  );
};
