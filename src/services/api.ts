import { supabase } from './supabase';
import type {
  Portfolio,
  PortfolioCreate,
  PortfolioUpdate,
  Holding,
  HoldingCreate,
  HoldingUpdate,
  Transaction,
  TransactionCreate,
  PortfolioOverview,
  PerformanceData,
  RiskMetrics,
  CorrelationData,
  RiskContribution,
  MonteCarloResult,
  OptimizationResult,
  StressTestResult,
  MarketSearchResult,
  ImportPreview,
  Period,
} from '../types';

const defaultApiUrl = import.meta.env.PROD
  ? 'https://finsight-backend-ezde.onrender.com'
  : 'http://localhost:8000';

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || defaultApiUrl
).replace(/\/$/, '');

export async function getAuthToken(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch {
    return null;
  }
}

export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await getAuthToken();
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Do not set Content-Type if body is FormData
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    window.dispatchEvent(new CustomEvent('finsight:unauthorized'));
  }

  if (!response.ok) {
    let errorDetail = 'An unexpected error occurred';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errJson.message || errorDetail;
    } catch {
      errorDetail = `Request failed with status ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorDetail);
  }

  // Check if response is JSON
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json() as Promise<T>;
  }

  return response.blob() as unknown as Promise<T>;
}

// ---------------------------------------------------------------------------
// Portfolio API
// ---------------------------------------------------------------------------
export const portfolioApi = {
  list: () => apiRequest<Portfolio[]>('/api/v1/portfolios/'),
  create: (data: PortfolioCreate) =>
    apiRequest<Portfolio>('/api/v1/portfolios/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  get: (id: string) => apiRequest<Portfolio>(`/api/v1/portfolios/${id}`),
  update: (id: string, data: PortfolioUpdate) =>
    apiRequest<Portfolio>(`/api/v1/portfolios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiRequest<{ message: string }>(`/api/v1/portfolios/${id}`, {
      method: 'DELETE',
    }),

  getHoldings: (portfolioId: string) =>
    apiRequest<Holding[]>(`/api/v1/portfolios/${portfolioId}/holdings`),
  addHolding: (portfolioId: string, data: HoldingCreate) =>
    apiRequest<Holding>(`/api/v1/portfolios/${portfolioId}/holdings`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateHolding: (portfolioId: string, holdingId: string, data: HoldingUpdate) =>
    apiRequest<Holding>(`/api/v1/portfolios/${portfolioId}/holdings/${holdingId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteHolding: (portfolioId: string, holdingId: string) =>
    apiRequest<{ message: string }>(`/api/v1/portfolios/${portfolioId}/holdings/${holdingId}`, {
      method: 'DELETE',
    }),

  getTransactions: (portfolioId: string, limit = 100) =>
    apiRequest<Transaction[]>(`/api/v1/portfolios/${portfolioId}/transactions?limit=${limit}`),
  addTransaction: (portfolioId: string, data: TransactionCreate) =>
    apiRequest<Transaction>(`/api/v1/portfolios/${portfolioId}/transactions`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  importPreview: (portfolioId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiRequest<ImportPreview>(`/api/v1/portfolios/${portfolioId}/import`, {
      method: 'POST',
      body: formData,
    });
  },
  importConfirm: (portfolioId: string, rows: Omit<Holding, 'id' | 'portfolio_id'>[]) =>
    apiRequest<{ imported_count: number; message: string }>(
      `/api/v1/portfolios/${portfolioId}/import/confirm`,
      {
        method: 'POST',
        body: JSON.stringify(rows),
      }
    ),
  downloadSampleCsv: async (portfolioId: string) => {
    const blob = await apiRequest<Blob>(`/api/v1/portfolios/${portfolioId}/sample-csv`);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'finsight_sample_portfolio.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};

// ---------------------------------------------------------------------------
// Analytics API
// ---------------------------------------------------------------------------
export const analyticsApi = {
  overview: async (portfolioId: string): Promise<PortfolioOverview> => {
    const raw = await apiRequest<any>(`/api/v1/analytics/${portfolioId}/overview`);
    const summary = raw.summary || {};
    const risk = raw.risk_metrics || {};
    return {
      total_value: summary.current_value ?? 0,
      total_invested: summary.total_invested ?? 0,
      pnl: summary.unrealised_pnl ?? 0,
      pnl_pct: summary.return_pct ?? 0,
      volatility: risk.volatility?.annualized ?? 0,
      var_95: risk.var?.var_95 ?? 0,
      sharpe_ratio: risk.sharpe_ratio ?? 0,
      max_drawdown: risk.max_drawdown?.max_drawdown ?? 0,
      beta: risk.beta ?? 1,
    };
  },
  performance: async (portfolioId: string, period: Period = '1y'): Promise<PerformanceData> => {
    const raw = await apiRequest<any>(`/api/v1/analytics/${portfolioId}/performance?period=${period}`);
    const portfolio = raw.portfolio_cumulative || {};
    const benchmark = raw.benchmark_cumulative || {};
    const dates = Object.keys(portfolio).sort();
    return {
      dates,
      portfolio_values: dates.map((date) => 100 * (1 + portfolio[date])),
      benchmark_values: dates.map((date) => 100 * (1 + (benchmark[date] ?? 0))),
      daily_returns: dates.map((date, index) => index === 0 ? 0 :
        (portfolio[date] - portfolio[dates[index - 1]]) / (1 + portfolio[dates[index - 1]])),
    };
  },
  risk: async (portfolioId: string, confidenceLevel = 0.95, riskFreeRate = 0.065): Promise<RiskMetrics> => {
    const raw = await apiRequest<any>(
      `/api/v1/analytics/${portfolioId}/risk?confidence_level=${confidenceLevel}&risk_free_rate=${riskFreeRate}`
    );
    const metrics = raw.risk_metrics || {};
    const vars = raw.var_metrics || {};
    return {
      var_90: vars.var_90 ?? metrics.var?.var_90 ?? 0,
      var_95: vars.var_95 ?? metrics.var?.var_95 ?? 0,
      var_99: vars.var_99 ?? metrics.var?.var_99 ?? 0,
      cvar_95: metrics.cvar_95 ?? 0,
      volatility_daily: metrics.volatility?.daily ?? 0,
      volatility_annual: metrics.volatility?.annualized ?? 0,
      sharpe_ratio: raw.sharpe_ratio ?? metrics.sharpe_ratio ?? 0,
      beta: metrics.beta ?? 1,
      max_drawdown: metrics.max_drawdown?.max_drawdown ?? 0,
    };
  },
  correlation: async (portfolioId: string, period: Period = '1y'): Promise<CorrelationData> => {
    const raw = await apiRequest<any>(`/api/v1/analytics/${portfolioId}/correlation?period=${period}`);
    const result = raw.correlation_matrix || {};
    return { matrix: result.matrix ?? result, symbols: raw.symbols ?? result.symbols ?? [] };
  },
  riskContribution: async (portfolioId: string): Promise<RiskContribution> => {
    const raw = await apiRequest<any>(`/api/v1/analytics/${portfolioId}/risk-contribution`);
    const contribution = raw.risk_contribution || {};
    return { symbols: raw.symbols ?? contribution.symbols ?? [], marginal: contribution.marginal ?? [], component: contribution.component ?? [], percent: contribution.percent ?? [] };
  },
};

// ---------------------------------------------------------------------------
// Market Data API
// ---------------------------------------------------------------------------
export const marketApi = {
  search: (query: string) =>
    apiRequest<MarketSearchResult[]>(`/api/v1/market/search?q=${encodeURIComponent(query)}`),
  benchmark: (period: Period = '1y') =>
    apiRequest<PerformanceData>(`/api/v1/market/benchmark?period=${period}`),
};

// ---------------------------------------------------------------------------
export const stressApi = {
  test: (portfolioId: string, params: { scenarios?: string[]; uniform_shock?: number }) =>
    apiRequest<StressTestResult>(`/api/v1/stress-test/${portfolioId}`, {
      method: 'POST',
      body: JSON.stringify(params),
    }),
};
// Reports API
// ---------------------------------------------------------------------------
export const reportsApi = {
  get: (portfolioId: string) =>
    apiRequest<Record<string, unknown>>(`/api/v1/reports/${portfolioId}`),
  exportCsv: async (portfolioId: string) => {
    const blob = await apiRequest<Blob>(`/api/v1/reports/${portfolioId}/export/csv`);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finsight_portfolio_${portfolioId}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};export const simulationApi = {
  monteCarlo: async (
    portfolioId: string,
    params: { n_simulations?: number; n_days?: number; loss_threshold_pct?: number } = {}
  ): Promise<MonteCarloResult> => {
    const raw = await apiRequest<any>(`/api/v1/simulation/${portfolioId}/monte-carlo`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
    return raw.results as MonteCarloResult;
  },
};

export const optimizationApi = {
  optimize: async (portfolioId: string, params: { risk_free_rate?: number; n_points?: number } = {}): Promise<OptimizationResult> => {
    const raw = await apiRequest<any>(`/api/v1/optimization/${portfolioId}`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
    return raw.optimization as OptimizationResult;
  },
};


