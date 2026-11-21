import React, { useState } from 'react';
import {
  Plus,
  Upload,
  Trash2,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  X,
} from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import { useHoldings } from '../hooks/useHoldings';
import { useApi } from '../hooks/useApi';
import { portfolioApi } from '../services/api';
import { formatCurrency, formatPercent, formatDate, getReturnColor } from '../utils/formatters';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import type { ImportPreview } from '../types';

export const Portfolio: React.FC = () => {
  const { portfolios, selectedPortfolio, selectPortfolioById, deletePortfolio } = usePortfolio();
  const {
    data: holdings,
    loading: holdingsLoading,
    error: holdingsError,
    refetch: refetchHoldings,
  } = useHoldings(selectedPortfolio?.id);

  const {
    data: transactions,
    loading: txLoading,
    refetch: refetchTx,
  } = useApi(
    () =>
      selectedPortfolio?.id
        ? portfolioApi.getTransactions(selectedPortfolio.id, 50)
        : Promise.resolve([]),
    [selectedPortfolio?.id]
  );

  // Modals state
  const [showAddHolding, setShowAddHolding] = useState(false);
  const [showAddTx, setShowAddTx] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [deletingPortfolioId, setDeletingPortfolioId] = useState<string | null>(null);

  // Add Holding form state
  const [symbol, setSymbol] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [exchange, setExchange] = useState('NSE');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [buyPrice, setBuyPrice] = useState<number | ''>('');
  const [holdingSubmitting, setHoldingSubmitting] = useState(false);
  const [holdingFormError, setHoldingFormError] = useState<string | null>(null);

  // Add Transaction form state
  const [txSymbol, setTxSymbol] = useState('');
  const [txType, setTxType] = useState<'BUY' | 'SELL'>('BUY');
  const [txQty, setTxQty] = useState<number | ''>('');
  const [txPrice, setTxPrice] = useState<number | ''>('');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [txSubmitting, setTxSubmitting] = useState(false);

  // File import state
  const [, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [confirmingImport, setConfirmingImport] = useState(false);

  // Add Holding
  const handleAddHolding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPortfolio) return;
    if (!symbol.trim() || !quantity || !buyPrice) {
      setHoldingFormError('Please fill in all required fields.');
      return;
    }
    setHoldingSubmitting(true);
    setHoldingFormError(null);
    try {
      await portfolioApi.addHolding(selectedPortfolio.id, {
        symbol: symbol.trim().toUpperCase(),
        company_name: companyName.trim() || undefined,
        exchange,
        quantity: Number(quantity),
        average_buy_price: Number(buyPrice),
      });
      setShowAddHolding(false);
      setSymbol('');
      setCompanyName('');
      setQuantity('');
      setBuyPrice('');
      refetchHoldings();
    } catch (err: unknown) {
      setHoldingFormError(err instanceof Error ? err.message : 'Failed to add holding');
    } finally {
      setHoldingSubmitting(false);
    }
  };

  // Delete Portfolio
  const handleDeletePortfolio = async (portfolioId: string, portfolioName: string) => {
    const confirmed = window.confirm(
      `Delete "${portfolioName}"? This permanently deletes the portfolio and all its holdings and transaction history. This action cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingPortfolioId(portfolioId);
    try {
      await deletePortfolio(portfolioId);
    } catch (err: unknown) {
      window.alert(err instanceof Error ? err.message : 'Failed to delete portfolio');
    } finally {
      setDeletingPortfolioId(null);
    }
  };

  // Delete Holding
  const handleDeleteHolding = async (holdingId: string) => {
    if (!selectedPortfolio) return;
    if (!confirm('Are you sure you want to delete this holding?')) return;
    try {
      await portfolioApi.deleteHolding(selectedPortfolio.id, holdingId);
      refetchHoldings();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete holding');
    }
  };

  // Add Transaction
  const handleAddTx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPortfolio) return;
    if (!txSymbol.trim() || !txQty || !txPrice || !txDate) return;
    setTxSubmitting(true);
    try {
      await portfolioApi.addTransaction(selectedPortfolio.id, {
        symbol: txSymbol.trim().toUpperCase(),
        transaction_type: txType,
        quantity: Number(txQty),
        price: Number(txPrice),
        transaction_date: txDate,
      });
      setShowAddTx(false);
      setTxSymbol('');
      setTxQty('');
      setTxPrice('');
      refetchTx();
      refetchHoldings();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to add transaction');
    } finally {
      setTxSubmitting(false);
    }
  };

  // Import Preview
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedPortfolio) return;
    setImportFile(file);
    setImportLoading(true);
    setImportError(null);
    setImportPreview(null);
    try {
      const preview = await portfolioApi.importPreview(selectedPortfolio.id, file);
      setImportPreview(preview);
    } catch (err: unknown) {
      setImportError(err instanceof Error ? err.message : 'Failed to parse file');
    } finally {
      setImportLoading(false);
    }
  };

  // Import Confirm
  const handleConfirmImport = async () => {
    if (!selectedPortfolio || !importPreview) return;
    setConfirmingImport(true);
    try {
      await portfolioApi.importConfirm(selectedPortfolio.id, importPreview.valid_rows);
      setShowImportModal(false);
      setImportFile(null);
      setImportPreview(null);
      refetchHoldings();
    } catch (err: unknown) {
      setImportError(err instanceof Error ? err.message : 'Failed to import holdings');
    } finally {
      setConfirmingImport(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ---------------- Header ---------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Portfolio Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage your equity holdings, transactions, and CSV/Excel imports
          </p>
        </div>

        {selectedPortfolio && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowImportModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 shadow-xs"
            >
              <Upload className="w-3.5 h-3.5" />
              Import CSV/Excel
            </button>
            <button
              onClick={() => setShowAddHolding(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Stock
            </button>
          </div>
        )}
      </div>

      {/* ---------------- Portfolio Selector Cards ---------------- */}
      {portfolios.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {portfolios.map((p) => (
            <div
              key={p.id}
              onClick={() => selectPortfolioById(p.id)}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                selectedPortfolio?.id === p.id
                  ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20 ring-1 ring-blue-500 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {p.name}
                </span>
                <div className="flex shrink-0 items-center gap-2">
                  {selectedPortfolio?.id === p.id && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
                  )}
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDeletePortfolio(p.id, p.name);
                    }}
                    disabled={deletingPortfolioId !== null}
                    aria-label={`Delete portfolio ${p.name}`}
                    title="Delete portfolio and its holdings and transactions"
                    className="rounded-md p-1 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                  >
                    {deletingPortfolioId === p.id ? (
                      <span className="block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
              <p className="mt-1 text-[11px] text-slate-400 truncate">
                {p.description || 'Indian Equity Portfolio'}
              </p>
            </div>
          ))}
        </div>
      )}

      {holdingsError && <ErrorMessage message={holdingsError} onRetry={refetchHoldings} />}

      {/* ---------------- Holdings Table ---------------- */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Holdings ({holdings.length})
            </h3>
            <p className="text-[11px] text-slate-400">Latest available market quotes (may be delayed)</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => refetchHoldings(true)}
              disabled={holdingsLoading || holdings.length === 0}
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-50 flex items-center gap-1 font-medium"
              title="Fetch the latest available market prices"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${holdingsLoading ? 'animate-spin' : ''}`} />
              Refresh Prices
            </button>
            <button
              onClick={() => portfolioApi.downloadSampleCsv(selectedPortfolio?.id || '')}
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 font-medium"
            >
              <Download className="w-3.5 h-3.5" />
              Sample CSV Template
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {holdingsLoading ? (
            <LoadingSpinner size="md" text="Loading holdings..." className="py-12" />
          ) : holdings.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No holdings in this portfolio. Click &ldquo;Add Stock&rdquo; or &ldquo;Import CSV/Excel&rdquo; to add equities.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Symbol</th>
                  <th className="py-3 px-3">Company</th>
                  <th className="py-3 px-3">Exchange</th>
                  <th className="py-3 px-3 text-right">Quantity</th>
                  <th className="py-3 px-3 text-right">Avg Buy Price</th>
                  <th className="py-3 px-3 text-right">Invested Value</th>
                  <th className="py-3 px-3 text-right">Current Price</th>
                  <th className="py-3 px-3 text-right">Market Value</th>
                  <th className="py-3 px-3 text-right">P&L</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                {holdings.map((h) => {
                  const current = typeof h.current_price === 'number' ? h.current_price : null;
                  const invested = h.quantity * h.average_buy_price;
                  const currentVal = current !== null ? h.quantity * current : null;
                  const pnl = currentVal !== null ? currentVal - invested : null;
                  const pnlPct = pnl !== null && invested > 0 ? (pnl / invested) : null;

                  return (
                    <tr key={h.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-sans font-bold text-slate-900 dark:text-slate-100">
                        {h.symbol}
                      </td>
                      <td className="py-3 px-3 font-sans text-slate-600 dark:text-slate-400 truncate max-w-[150px]">
                        {h.company_name || '-'}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {h.exchange}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-slate-700 dark:text-slate-300 font-semibold">
                        {h.quantity}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-400">
                        {formatCurrency(h.average_buy_price)}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-400">
                        {formatCurrency(invested)}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-900 dark:text-slate-100 font-semibold">
                        {current !== null ? formatCurrency(current) : 'Unavailable'}
                        {current !== null && h.price_as_of && (
                          <span className="block text-[10px] font-normal text-slate-400">
                            Fetched {new Date(h.price_as_of).toLocaleTimeString()}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-900 dark:text-slate-100 font-semibold">
                        {currentVal !== null ? formatCurrency(currentVal) : '—'}
                      </td>
                      <td className={`py-3 px-3 text-right font-bold ${pnl !== null ? getReturnColor(pnl) : 'text-slate-400'}`}>
                        {pnl !== null ? formatCurrency(pnl) : '—'}
                        {pnlPct !== null && (
                          <span className="block text-[10px] font-normal">
                            {pnl >= 0 ? '+' : ''}{formatPercent(pnlPct)}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDeleteHolding(h.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition-colors"
                          title="Delete holding"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ---------------- Transactions Ledger ---------------- */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Transaction History
            </h3>
            <p className="text-[11px] text-slate-400">Historical buy and sell transactions</p>
          </div>

          <button
            onClick={() => setShowAddTx(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Transaction
          </button>
        </div>

        <div className="overflow-x-auto">
          {txLoading ? (
            <LoadingSpinner size="sm" text="Loading transactions..." className="py-8" />
          ) : !transactions || transactions.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No transactions recorded yet.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-3">Symbol</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3 text-right">Quantity</th>
                  <th className="py-3 px-3 text-right">Price</th>
                  <th className="py-3 px-4 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                {transactions.map((tx) => {
                  const qty = Number(tx.quantity);
                  const price = Number(tx.price);
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-2.5 px-4 text-slate-500 text-[11px]">
                        {formatDate(tx.transaction_date)}
                      </td>
                      <td className="py-2.5 px-3 font-sans font-semibold text-slate-900 dark:text-slate-100">
                        {tx.symbol}
                      </td>
                      <td className="py-2.5 px-3">
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
                      <td className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-300">
                        {qty}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-300">
                        {formatCurrency(price)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-semibold text-slate-900 dark:text-slate-100">
                        {formatCurrency(qty * price)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ---------------- Add Holding Modal ---------------- */}
      {showAddHolding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Add Stock Holding
              </h3>
              <button
                onClick={() => setShowAddHolding(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {holdingFormError && (
              <div className="mt-3 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{holdingFormError}</span>
              </div>
            )}

            <form onSubmit={handleAddHolding} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Stock Symbol * (e.g. RELIANCE, TCS, INFY)
                </label>
                <input
                  type="text"
                  required
                  placeholder="RELIANCE"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Company Name (optional)
                </label>
                <input
                  type="text"
                  placeholder="Reliance Industries Ltd"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Exchange
                  </label>
                  <select
                    value={exchange}
                    onChange={(e) => setExchange(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="NSE">NSE (.NS)</option>
                    <option value="BSE">BSE (.BO)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="100"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Average Buy Price (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0.01"
                  placeholder="2850.00"
                  value={buyPrice}
                  onChange={(e) => setBuyPrice(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddHolding(false)}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={holdingSubmitting}
                  className="px-3.5 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg shadow-sm disabled:opacity-50"
                >
                  {holdingSubmitting ? 'Adding...' : 'Add Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- CSV/Excel Import Modal ---------------- */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Import Holdings from CSV or Excel
              </h3>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportPreview(null);
                  setImportFile(null);
                }}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Choose CSV or XLSX File (max 500 rows, 5MB)
              </label>
              <input
                type="file"
                accept=".csv, .xlsx, .xls"
                onChange={handleFileSelect}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-950/60 dark:file:text-blue-300 hover:file:bg-blue-100"
              />
            </div>

            {importLoading && (
              <LoadingSpinner size="sm" text="Parsing file..." className="py-6" />
            )}

            {importError && (
              <div className="mt-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            {importPreview && (
              <div className="mt-4 space-y-4">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-xs font-medium">
                  <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    {importPreview.valid_rows.length} valid rows recognized
                  </span>
                  {importPreview.errors.length > 0 && (
                    <span className="text-rose-600 dark:text-rose-400 font-semibold">
                      {importPreview.errors.length} errors
                    </span>
                  )}
                </div>

                {importPreview.errors.length > 0 && (
                  <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 text-[11px] max-h-32 overflow-y-auto">
                    <ul className="list-disc pl-4 space-y-0.5">
                      {importPreview.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden max-h-56 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-[10px] uppercase font-semibold text-slate-500">
                      <tr>
                        <th className="py-2 px-3">Symbol</th>
                        <th className="py-2 px-3">Company</th>
                        <th className="py-2 px-3 text-right">Qty</th>
                        <th className="py-2 px-3 text-right">Avg Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                      {importPreview.valid_rows.map((r, i) => (
                        <tr key={i}>
                          <td className="py-1.5 px-3 font-sans font-bold">{r.symbol}</td>
                          <td className="py-1.5 px-3 font-sans text-slate-500 truncate max-w-[120px]">
                            {r.company_name || '-'}
                          </td>
                          <td className="py-1.5 px-3 text-right">{r.quantity}</td>
                          <td className="py-1.5 px-3 text-right">{formatCurrency(r.average_buy_price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setImportPreview(null)}
                    className="px-3.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmImport}
                    disabled={confirmingImport || importPreview.valid_rows.length === 0}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg shadow-sm disabled:opacity-50"
                  >
                    {confirmingImport ? 'Importing...' : `Confirm & Save (${importPreview.valid_rows.length})`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------- Add Transaction Modal ---------------- */}
      {showAddTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Record Transaction
              </h3>
              <button
                onClick={() => setShowAddTx(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddTx} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Stock Symbol *
                </label>
                <input
                  type="text"
                  required
                  placeholder="TCS"
                  value={txSymbol}
                  onChange={(e) => setTxSymbol(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 uppercase font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Transaction Type
                  </label>
                  <select
                    value={txType}
                    onChange={(e) => setTxType(e.target.value as 'BUY' | 'SELL')}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="BUY">BUY</option>
                    <option value="SELL">SELL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="50"
                    value={txQty}
                    onChange={(e) => setTxQty(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Execution Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0.01"
                    placeholder="3850.00"
                    value={txPrice}
                    onChange={(e) => setTxPrice(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddTx(false)}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={txSubmitting}
                  className="px-3.5 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg shadow-sm disabled:opacity-50"
                >
                  {txSubmitting ? 'Recording...' : 'Record Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
