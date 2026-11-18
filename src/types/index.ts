// =========================================================
// User & Auth
// =========================================================

export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

// =========================================================
// Portfolio
// =========================================================

export interface Portfolio {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface PortfolioCreate {
  name: string;
  description?: string;
}

export interface PortfolioUpdate {
  name?: string;
  description?: string;
}

export interface Holding {
  id: string;
  portfolio_id: string;
  symbol: string;
  company_name?: string;
  exchange: string;
  quantity: number;
  average_buy_price: number;
  current_price?: number;
  current_value?: number;
  pnl?: number;
  pnl_pct?: number;
  weight?: number;
}

export interface HoldingCreate {
  symbol: string;
  company_name?: string;
  exchange: string;
  quantity: number;
  average_buy_price: number;
}

export interface HoldingUpdate {
  quantity?: number;
  average_buy_price?: number;
  current_price?: number;
}

export type TransactionType = 'BUY' | 'SELL';

export interface Transaction {
  id: string;
  portfolio_id: string;
  symbol: string;
  transaction_type: TransactionType;
  quantity: number;
  price: number;
  transaction_date: string;
  notes?: string;
}

export interface TransactionCreate {
  symbol: string;
  transaction_type: TransactionType;
  quantity: number;
  price: number;
  transaction_date: string;
  notes?: string;
}

// =========================================================
// Analytics
// =========================================================

export interface PortfolioOverview {
  total_value: number;
  total_invested: number;
  pnl: number;
  pnl_pct: number;
  volatility: number;
  var_95: number;
  sharpe_ratio: number;
  max_drawdown: number;
  beta: number;
}

export interface PerformanceData {
  dates: string[];
  portfolio_values: number[];
  benchmark_values: number[];
  daily_returns: number[];
}

export interface RiskMetrics {
  var_90: number;
  var_95: number;
  var_99: number;
  cvar_95: number;
  volatility_daily: number;
  volatility_annual: number;
  sharpe_ratio: number;
  beta: number;
  max_drawdown: number;
}

export interface CorrelationData {
  matrix: number[][];
  symbols: string[];
}

export interface RiskContribution {
  symbols: string[];
  marginal: number[];
  component: number[];
  percent: number[];
}

// =========================================================
// Simulation & Optimization
// =========================================================

export interface MonteCarloParams {
  n_simulations?: number;
  n_days?: number;
  loss_threshold?: number;
}

export interface MonteCarloResult {
  portfolio_value: number;
  n_simulations: number;
  n_days: number;
  terminal_values: {
    p5: number;
    p25: number;
    p50: number;
    p75: number;
    p95: number;
  };
  prob_loss_threshold: number;
  sample_paths: number[][];
}

export interface OptimizationParams {
  risk_free_rate?: number;
  n_points?: number;
}

export interface OptimizationResult {
  symbols: string[];
  min_variance: {
    weights: Record<string, number>;
    expected_return: number;
    expected_volatility: number;
    sharpe: number;
  };
  max_sharpe: {
    weights: Record<string, number>;
    expected_return: number;
    expected_volatility: number;
    sharpe: number;
  };
  efficient_frontier: {
    return: number;
    volatility: number;
  }[];
}

export interface StressTestParams {
  custom_shocks?: Record<string, number>;
}

export interface StressTestResult {
  portfolio_value: number;
  scenarios: {
    scenario_key: string;
    scenario_name: string;
    shock: number;
    stressed_value: number;
    loss: number;
    loss_pct: number;
    asset_impacts: {
      symbol: string;
      loss: number;
      loss_pct: number;
    }[];
  }[];
}

// =========================================================
// Market Data
// =========================================================

export interface MarketSearchResult {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
}

export interface PricePoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketHistory {
  symbol: string;
  prices: PricePoint[];
}

// =========================================================
// Reports & Import
// =========================================================

export interface ImportPreview {
  valid_rows: Omit<Holding, 'id' | 'portfolio_id'>[];
  errors: string[];
  total: number;
}

export interface ReportData {
  portfolio_id: string;
  generated_at: string;
  overview: PortfolioOverview;
  holdings: Holding[];
  risk_metrics: RiskMetrics;
}

// =========================================================
// API
// =========================================================

export interface ApiError {
  detail: string;
  status?: number;
}

// Period type
export type Period = '1m' | '3m' | '6m' | '1y' | '2y' | '3y' | '5y';

// Generic API response state
export interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// Theme
export type Theme = 'light' | 'dark';
