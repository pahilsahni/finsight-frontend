import { useState, useEffect, useCallback } from 'react';
import type { Holding } from '../types';
import { portfolioApi } from '../services/api';

export function useHoldings(portfolioId: string | undefined) {
  const [data, setData] = useState<Holding[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHoldings = useCallback(async () => {
    if (!portfolioId) {
      setData([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await portfolioApi.getHoldings(portfolioId);
      setData(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch holdings');
    } finally {
      setLoading(false);
    }
  }, [portfolioId]);

  useEffect(() => {
    fetchHoldings();
  }, [fetchHoldings]);

  return { data, loading, error, refetch: fetchHoldings };
}
