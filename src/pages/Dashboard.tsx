import React from 'react';
import { useNavigate } from 'react-router-dom';
import Plot from 'react-plotly.js';
import { RefreshCw, ArrowUpRight, TrendingUp, Briefcase, Plus } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import { useTheme } from '../context/ThemeContext';
import { usePortfolioOverview } from '../hooks/usePortfolioOverview';
import { usePortfolioPerformance } from '../hooks/usePortfolioPerformance';
import { useHoldings } from '../hooks/useHoldings';
import { useApi } from '../hooks/useApi';
import { portfolioApi } from '../services/api';
import { formatCurrency, formatPercent, formatPercentRaw, formatNumber, formatDate, getReturnColor } from '../utils/formatters';
import { getPlotlyLayout, getPlotlyConfig, CHART_COLORS } from '../utils/chartTheme';
import { MetricCard } from '../components/common/MetricCard';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { selectedPortfolio, portfolios } = usePortfolio();

  const {
    data: overview,
    loading: overviewLoading,
    error: overviewError,
    refetch: refetchOverview,
  } = usePortfolioOverview(selectedPortfolio?.id);

  const {
    data: performance,
    loading: perfLoading,
    refetch: refetchPerf,
  } = usePortfolioPerformance(selectedPortfolio?.id, '1y');

  const {
    data: holdings,
    loading: holdingsLoading,
    refetch: refetchHoldings,
  } = useHoldings(selectedPortfolio?.id);

  const {
    data: transactions,
    loading: txLoading,
    refetch: refetchTx,
  } = useApi(
    () =>
      selectedPortfolio?.id
        ? portfolioApi.getTransactions(selectedPortfolio.id, 10)
        : Promise.resolve([]),
    [selectedPortfolio?.id]
  );

  const handleRefreshAll = () => {
    refetchOverview();
    refetchPerf();
    refetchHoldings();
    refetchTx();
  };

  // 1. No portfolio state
  if (!selectedPortfolio && portfolios.length === 0) {
    return (
      <EmptyState
        icon={Briefcase}
        title="No Portfolio Found"
        description="Create your first investment portfolio or import holdings from CSV/Excel to view quantitative analytics."
        actionLabel="Create Portfolio"
        onAction={() => navigate('/portfolio')}
      />
    );
  }

  // 2. Empty holdings state
  if (selectedPortfolio && holdings.length === 0 && !holdingsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {selectedPortfolio.name}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {selectedPortfolio.description || 'Indian Equity Portfolio'}
            </p>
          </div>
        </div>
        <EmptyState
          icon={Plus}
          title="Portfolio has no holdings"
          description="Add your first Indian equity holding or upload an Excel/CSV file to run risk modeling."
          actionLabel="Add Holdings"
          onAction={() => navigate('/portfolio')}
        />
      </div>
    );
  }

  // Performance chart data
  const hasPerfData = performance && performance.dates && performance.dates.length > 0;
  const perfPlotData = hasPerfData
    ? [
        {
          x: performance.dates,
          y: performance.portfolio_values,
          type: 'scatter' as const,
          mode: 'lines' as const,
          name: selectedPortfolio?.name || 'Portfolio',
          line: { color: CHART_COLORS.primary, width: 2 },
        },
        ...(performance.benchmark_values && performance.benchmark_values.length > 0
          ? [
              {
                x: performance.dates,
                y: performance.benchmark_values,
                type: 'scatter' as const,
                mode: 'lines' as const,
                name: 'NIFTY 50 (Benchmark)',
                line: { color: CHART_COLORS.benchmark, width: 1.5, dash: 'dash' as const },
              },
            ]
          : []),
      ]
    : [];

  // Asset allocation is shown only when every holding has a current market value.
  const valuationComplete = holdings.length > 0 && holdings.every(
    (holding) => holding.price_available === true && holding.current_value != null
  );
  const sortedHoldings = [...holdings].sort(
    (a, b) => (b.current_value ?? 0) - (a.current_value ?? 0)
  );

  const top7 = sortedHoldings.slice(0, 7);
  const remaining = sortedHoldings.slice(7);
  const remainingValue = remaining.reduce(
    (acc, holding) => acc + (holding.current_value ?? 0),
    0
  );

  const pieLabels = valuationComplete ? top7.map((holding) => holding.symbol) : [];
  const pieValues = valuationComplete ? top7.map((holding) => holding.current_value ?? 0) : [];
  if (valuationComplete && remainingValue > 0) {
    pieLabels.push('Others');
    pieValues.push(remainingValue);
  }

  const piePlotData = [
    {
      labels: pieLabels,
      values: pieValues,
      type: 'pie' as const,
      hole: 0.55,
      textinfo: 'label+percent' as const,
      textposition: 'outside' as const,
      marker: {
        colors: CHART_COLORS.palette,
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* ---------------- Header ---------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>{selectedPortfolio?.name}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold font-mono">
              {holdings.length} stocks
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Quantitative risk analytics & performance monitoring
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefreshAll}
            title="Refresh analytics"
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {overviewError && <ErrorMessage message={overviewError} onRetry={handleRefreshAll} />}

      {/* ---------------- Row 1: Primary Metrics ---------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <MetricCard
          label="Total Value"
          value={overview?.total_value == null ? '—' : formatCurrency(overview.total_value)}
          loading={overviewLoading}
        />
        <MetricCard
          label="Total Invested"
          value={formatCurrency(overview?.total_invested)}
          loading={overviewLoading}
        />
        <MetricCard
          label="Unrealized P&L"
          value={overview?.pnl == null ? '—' : formatCurrency(overview.pnl)}
          change={overview?.pnl_pct == null ? undefined : `${overview.pnl >= 0 ? '+' : ''}${formatPercentRaw(overview.pnl_pct)}`}
          changeType={overview?.pnl == null ? 'neutral' : overview.pnl >= 0 ? 'positive' : 'negative'}
          loading={overviewLoading}
        />
        <MetricCard
          label="Overall Return"
          value={overview?.pnl_pct == null ? '—' : formatPercentRaw(overview.pnl_pct)}
          changeType={overview?.pnl == null ? 'neutral' : overview.pnl >= 0 ? 'positive' : 'negative'}
          loading={overviewLoading}
        />
        <MetricCard
          label="Volatility (Ann.)"
          value={formatPercent(overview?.volatility)}
          tooltip="Annualized standard deviation of daily portfolio returns (252 trading days basis)."
          loading={overviewLoading}
        />
        <MetricCard
          label="Sharpe Ratio"
          value={overview ? formatNumber(overview.sharpe_ratio) : '0.00'}
          changeType={overview?.sharpe_ratio && overview.sharpe_ratio > 1 ? 'positive' : 'neutral'}
          tooltip="Risk-adjusted excess return over the risk-free benchmark rate (6.5%)."
          loading={overviewLoading}
        />
      </div>

      {/* ---------------- Row 2: Secondary Risk Metrics ---------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          label="Value at Risk (95%)"
          value={formatCurrency(overview?.var_95)}
          tooltip="Estimated maximum monetary loss over a 1-day horizon at 95% confidence level."
          loading={overviewLoading}
        />
        <MetricCard
          label="Max Drawdown"
          value={formatPercent(overview?.max_drawdown)}
          changeType="negative"
          tooltip="Peak-to-trough largest cumulative percentage decline experienced historically."
          loading={overviewLoading}
        />
        <MetricCard
          label="Beta (vs NIFTY 50)"
          value={overview ? formatNumber(overview.beta) : '1.00'}
          tooltip="Sensitivity of portfolio returns relative to benchmark NIFTY 50 movements."
          loading={overviewLoading}
        />
        <MetricCard
          label="Holdings Count"
          value={holdings.length}
          subtitle="Equities across NSE/BSE"
          loading={holdingsLoading}
        />
      </div>

      {/* ---------------- Row 3: Charts Row ---------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cumulative Performance Line Chart (7/12 cols) */}
        <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Performance vs NIFTY 50
              </h3>
              <p className="text-[11px] text-slate-400">
                Cumulative historical portfolio value vs benchmark ({period.toUpperCase()})
              </p>
            </div>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>

          <div className="h-72 w-full">
            {perfLoading ? (
              <LoadingSpinner size="md" text="Loading performance history..." className="h-full" />
            ) : hasPerfData ? (
              <Plot
                data={perfPlotData}
                layout={getPlotlyLayout(isDark, {
                  yaxis: { title: 'Value (₹)' },
                  margin: { l: 60, r: 20, t: 25, b: 35 },
                })}
                config={getPlotlyConfig()}
                style={{ width: '100%', height: '100%' }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Market price history unavailable for selected period.
              </div>
            )}
          </div>
        </div>

        {/* Asset Allocation Donut Chart (5/12 cols) */}
        <div className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Asset Allocation
              </h3>
              <p className="text-[11px] text-slate-400">Holdings weighted by current market value</p>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400" />
          </div>

          <div className="h-72 w-full">
            {holdingsLoading ? (
              <LoadingSpinner size="md" text="Calculating allocations..." className="h-full" />
            ) : pieValues.length > 0 ? (
              <Plot
                data={piePlotData}
                layout={getPlotlyLayout(isDark, {
                  showlegend: false,
                  margin: { l: 20, r: 20, t: 20, b: 20 },
                })}
                config={getPlotlyConfig()}
                style={{ width: '100%', height: '100%' }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                {valuationComplete ? 'No holdings data.' : 'Allocation unavailable until all market prices are available.'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ---------------- Row 4: Tables ---------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Holdings (7/12 cols) */}
        <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Top Holdings
            </h3>
            <button
              onClick={() => navigate('/portfolio')}
              className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center gap-1"
            >
              View all
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="pb-2">Stock</th>
                  <th className="pb-2 text-right">Qty</th>
                  <th className="pb-2 text-right">Avg Buy</th>
                  <th className="pb-2 text-right">Current</th>
                  <th className="pb-2 text-right">Value</th>
                  <th className="pb-2 text-right">P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                {holdings.slice(0, 8).map((h) => {
                  const currentPrice = h.current_price ?? null;
                  const value = h.current_value ?? null;
                  const invested = h.quantity * h.average_buy_price;
                  const pnl = h.pnl ?? null;
                  const pnlPct = invested > 0 && pnl !== null ? (pnl / invested) : null;

                  return (
                    <tr key={h.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-2.5 font-sans font-semibold text-slate-900 dark:text-slate-100">
                        <div>{h.symbol}</div>
                        <div className="text-[10px] font-normal text-slate-400 truncate max-w-[140px]">
                          {h.company_name || h.exchange}
                        </div>
                      </td>
                      <td className="py-2.5 text-right text-slate-600 dark:text-slate-400">
                        {h.quantity}
                      </td>
                      <td className="py-2.5 text-right text-slate-600 dark:text-slate-400">
                        {formatCurrency(h.average_buy_price)}
                      </td>
                      <td className="py-2.5 text-right text-slate-900 dark:text-slate-100 font-semibold">
                        {currentPrice == null ? '—' : formatCurrency(currentPrice)}
                      </td>
                      <td className="py-2.5 text-right text-slate-900 dark:text-slate-100">
                        {value == null ? '—' : formatCurrency(value)}
                      </td>
                      <td className={`py-2.5 text-right font-semibold ${getReturnColor(pnl)}`}>
                        {pnl == null ? '—' : formatCurrency(pnl)}
                        <span className="block text-[10px] font-normal">
                          {pnlPct == null ? '—' : `${pnl >= 0 ? '+' : ''}${formatPercent(pnlPct)}`}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Transactions (5/12 cols) */}
        <div className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Recent Transactions
            </h3>
            <button
              onClick={() => navigate('/portfolio')}
              className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center gap-1"
            >
              All transactions
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            {txLoading ? (
              <LoadingSpinner size="sm" text="Loading transactions..." className="py-8" />
            ) : !transactions || transactions.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400">
                No transaction records found.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="pb-2">Date</th>
                    <th className="pb-2">Stock</th>
                    <th className="pb-2">Type</th>
                    <th className="pb-2 text-right">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                  {transactions.slice(0, 8).map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-2.5 text-slate-500 text-[11px]">
                        {formatDate(tx.transaction_date)}
                      </td>
                      <td className="py-2.5 font-sans font-semibold text-slate-900 dark:text-slate-100">
                        {tx.symbol}
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            tx.transaction_type === 'BUY'
                              ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                              : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                          }`}
                        >
                          {tx.transaction_type}
                        </span>
                      </td>
                      <td className="py-2.5 text-right text-slate-700 dark:text-slate-300">
                        {formatCurrency(tx.price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
