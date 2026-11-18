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
  overview: (portfolioId: string) =>
    apiRequest<PortfolioOverview>(`/api/v1/analytics/${portfolioId}/overview`),
  performance: (portfolioId: string, period: Period = '1y') =>
    apiRequest<PerformanceData>(`/api/v1/analytics/${portfolioId}/performance?period=${period}`),
  risk: (portfolioId: string, confidenceLevel = 0.95, riskFreeRate = 0.065) =>
    apiRequest<RiskMetrics>(
      `/api/v1/analytics/${portfolioId}/risk?confidence_level=${confidenceLevel}&risk_free_rate=${riskFreeRate}`
    ),
  correlation: (portfolioId: string, period: Period = '1y') =>
    apiRequest<CorrelationData>(`/api/v1/analytics/${portfolioId}/correlation?period=${period}`),
  riskContribution: (portfolioId: string) =>
    apiRequest<RiskContribution>(`/api/v1/analytics/${portfolioId}/risk-contribution`),
};

// ---------------------------------------------------------------------------
// Simulation API
// ---------------------------------------------------------------------------
export const simulationApi = {
  monteCarlo: (
    portfolioId: string,
    params: { n_simulations?: number; n_days?: number; loss_threshold_pct?: number } = {}
  ) =>
    apiRequest<MonteCarloResult>(`/api/v1/simulation/${portfolioId}/monte-carlo`, {
      method: 'POST',
      body: JSON.stringify(params),
    }),
};

// ---------------------------------------------------------------------------
// Optimization API
// ---------------------------------------------------------------------------
export const optimizationApi = {
  optimize: (portfolioId: string, params: { risk_free_rate?: number; n_points?: number } = {}) =>
    apiRequest<OptimizationResult>(`/api/v1/optimization/${portfolioId}`, {
      method: 'POST',
      body: JSON.stringify(params),
    }),
};

// ---------------------------------------------------------------------------
// Stress Testing API
// ---------------------------------------------------------------------------
export const stressApi = {
  test: (
    portfolioId: string,
    params: {
      scenarios?: string[];
      uniform_shock?: number;
      custom_shocks?: Record<string, number>;
    } = {}
  ) =>
    apiRequest<StressTestResult>(`/api/v1/stress-test/${portfolioId}`, {
      method: 'POST',
      body: JSON.stringify(params),
    }),
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
};
