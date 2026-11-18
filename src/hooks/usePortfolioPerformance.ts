import { useState, useEffect, useCallback } from 'react';
import type { PerformanceData, Period } from '../types';
import { analyticsApi } from '../services/api';

export function usePortfolioPerformance(portfolioId: string | undefined, period: Period = '1y') {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPerformance = useCallback(async () => {
    if (!portfolioId) {
      setData(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await analyticsApi.performance(portfolioId, period);
      setData(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch performance data');
    } finally {
      setLoading(false);
    }
  }, [portfolioId, period]);

  useEffect(() => {
    fetchPerformance();
  }, [fetchPerformance]);

  return { data, loading, error, refetch: fetchPerformance };
}
