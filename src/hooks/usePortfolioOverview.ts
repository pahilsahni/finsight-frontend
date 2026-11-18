import { useState, useEffect, useCallback } from 'react';
import type { PortfolioOverview } from '../types';
import { analyticsApi } from '../services/api';

export function usePortfolioOverview(portfolioId: string | undefined) {
  const [data, setData] = useState<PortfolioOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = useCallback(async () => {
    if (!portfolioId) {
      setData(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await analyticsApi.overview(portfolioId);
      setData(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch portfolio overview');
    } finally {
      setLoading(false);
    }
  }, [portfolioId]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  return { data, loading, error, refetch: fetchOverview };
}
