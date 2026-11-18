import { useState, useEffect, useCallback } from 'react';
import type { RiskMetrics } from '../types';
import { analyticsApi } from '../services/api';

export function useRiskMetrics(
  portfolioId: string | undefined,
  confidenceLevel = 0.95,
  riskFreeRate = 0.065
) {
  const [data, setData] = useState<RiskMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRisk = useCallback(async () => {
    if (!portfolioId) {
      setData(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await analyticsApi.risk(portfolioId, confidenceLevel, riskFreeRate);
      setData(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch risk metrics');
    } finally {
      setLoading(false);
    }
  }, [portfolioId, confidenceLevel, riskFreeRate]);

  useEffect(() => {
    fetchRisk();
  }, [fetchRisk]);

  return { data, loading, error, refetch: fetchRisk };
}
