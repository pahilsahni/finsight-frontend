import React, { useState } from 'react';
import { FileText, Download, Info, CheckCircle2 } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import { usePortfolioOverview } from '../hooks/usePortfolioOverview';
import { useHoldings } from '../hooks/useHoldings';
import { reportsApi } from '../services/api';
import { formatCurrency, formatPercent, formatDate } from '../utils/formatters';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';

export const Reports: React.FC = () => {
  const { selectedPortfolio } = usePortfolio();
  const { data: overview } = usePortfolioOverview(selectedPortfolio?.id);
  const { data: holdings, loading: holdingsLoading } = useHoldings(selectedPortfolio?.id);

  const [downloadingCsv, setDownloadingCsv] = useState(false);
  const [downloadingJson, setDownloadingJson] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleDownloadCsv = async () => {
    if (!selectedPortfolio) return;
    setDownloadingCsv(true);
    setStatusMessage(null);
    try {
      await reportsApi.exportCsv(selectedPortfolio.id);
      setStatusMessage('Portfolio CSV exported successfully.');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to export CSV report');
    } finally {
      setDownloadingCsv(false);
    }
  };

  const handleDownloadJson = async () => {
    if (!selectedPortfolio) return;
    setDownloadingJson(true);
    setStatusMessage(null);
    try {
      const data = await reportsApi.get(selectedPortfolio.id);
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `finsight_report_${selectedPortfolio.id}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setStatusMessage('Full JSON report exported successfully.');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to export JSON report');
    } finally {
      setDownloadingJson(false);
    }
  };

  if (!selectedPortfolio) {
    return (
      <EmptyState
        title="No Portfolio Selected"
        description="Select a portfolio to generate and download comprehensive risk and holdings reports."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* ---------------- Header ---------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Portfolio Reports & Export</span>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
              {selectedPortfolio.name}
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Download comprehensive quantitative risk analysis, holdings ledger, and transaction history
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadCsv}
            disabled={downloadingCsv}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white shadow-xs disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            {downloadingCsv ? 'Exporting...' : 'Export CSV Report'}
          </button>
          <button
            onClick={handleDownloadJson}
            disabled={downloadingJson}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs disabled:opacity-50"
          >
            <FileText className="w-3.5 h-3.5" />
            {downloadingJson ? 'Exporting...' : 'JSON Report'}
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 border border-emerald-200 dark:border-emerald-800/40">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* ---------------- Portfolio Summary Card ---------------- */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {selectedPortfolio.name}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Created {formatDate(selectedPortfolio.created_at)} • Updated {formatDate(selectedPortfolio.updated_at)}
            </p>
          </div>
          <div className="text-xs font-mono text-slate-500 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
            Report Date: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 text-xs font-mono">
          <div>
            <span className="text-[11px] font-sans text-slate-400 block mb-1">Total Valuation</span>
            <span className="text-base font-bold text-slate-900 dark:text-slate-100">
              {formatCurrency(overview?.total_value)}
            </span>
          </div>
          <div>
            <span className="text-[11px] font-sans text-slate-400 block mb-1">Total Invested</span>
            <span className="text-base font-bold text-slate-900 dark:text-slate-100">
              {formatCurrency(overview?.total_invested)}
            </span>
          </div>
          <div>
            <span className="text-[11px] font-sans text-slate-400 block mb-1">Unrealized P&L</span>
            <span
              className={`text-base font-bold ${
                (overview?.pnl || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatCurrency(overview?.pnl)} ({formatPercent(overview?.pnl_pct)})
            </span>
          </div>
          <div>
            <span className="text-[11px] font-sans text-slate-400 block mb-1">Sharpe Ratio</span>
            <span className="text-base font-bold text-slate-900 dark:text-slate-100">
              {overview?.sharpe_ratio?.toFixed(2) || '0.00'}
            </span>
          </div>
        </div>
      </div>

      {/* ---------------- Holdings Snapshot Table ---------------- */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Portfolio Holdings Ledger ({holdings.length})
          </h3>
          <p className="text-[11px] text-slate-400">Positions included in this analysis report</p>
        </div>

        <div className="overflow-x-auto">
          {holdingsLoading ? (
            <LoadingSpinner size="sm" text="Loading holdings..." className="py-8" />
          ) : holdings.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">No holdings found.</div>
          ) : (
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 dark:bg-slate-800/40 text-[11px] font-semibold text-slate-500 uppercase">
                <tr>
                  <th className="py-2.5 px-4 font-sans">Stock</th>
                  <th className="py-2.5 px-3">Exchange</th>
                  <th className="py-2.5 px-3 text-right">Quantity</th>
                  <th className="py-2.5 px-3 text-right">Avg Cost</th>
                  <th className="py-2.5 px-3 text-right">Current Price</th>
                  <th className="py-2.5 px-4 text-right">Market Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {holdings.map((h) => {
                  const currentPrice = h.current_price || h.average_buy_price;
                  return (
                    <tr key={h.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-2.5 px-4 font-sans font-bold text-slate-900 dark:text-slate-100">
                        {h.symbol}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">{h.exchange}</td>
                      <td className="py-2.5 px-3 text-right">{h.quantity}</td>
                      <td className="py-2.5 px-3 text-right">{formatCurrency(h.average_buy_price)}</td>
                      <td className="py-2.5 px-3 text-right">{formatCurrency(currentPrice)}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(h.quantity * currentPrice)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ---------------- Regulatory & Methodology Disclosure ---------------- */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-5 text-xs text-slate-500 dark:text-slate-400 space-y-2">
        <h4 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          Regulatory Notice & Methodological Notes
        </h4>
        <p className="leading-relaxed text-[11px]">
          FinSight is an educational and quantitative risk modeling software tool. Calculations for Historical Value at Risk (VaR), Conditional VaR, Monte Carlo trajectories, Portfolio Beta, and Modern Portfolio Optimization are based on historical price series and standard statistical assumptions. They are not investment recommendations or guarantees of future returns.
        </p>
      </div>
    </div>
  );
};
