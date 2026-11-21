import { useState, useEffect, useCallback } from 'react';
import type { Holding } from '../types';
import { portfolioApi } from '../services/api';

export function useHoldings(portfolioId: string | undefined) {
  const [data, setData] = useState<Holding[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHoldings = useCallback(async (forceRefresh = false) => {
    if (!portfolioId) {
      setData([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await portfolioApi.getHoldings(portfolioId, forceRefresh);
      setData(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch holdings');
    } finally {
      setLoading(false);
    }
  }, [portfolioId]);

  useEffect(() => {
    fetchHoldings();
    if (!portfolioId) return;

    // Refresh the latest available quote every five minutes while this page
    // is open. The backend cache prevents excessive provider requests.
    const intervalId = window.setInterval(() => {
      fetchHoldings();
    }, 5 * 60 * 1000);

    return () => window.clearInterval(intervalId);
  }, [fetchHoldings, portfolioId]);

  return { data, loading, error, refetch: fetchHoldings };
}
