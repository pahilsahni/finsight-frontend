import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Portfolio, PortfolioCreate } from '../types';
import { portfolioApi } from '../services/api';
import { useAuth } from './AuthContext';

interface PortfolioContextType {
  portfolios: Portfolio[];
  selectedPortfolio: Portfolio | null;
  loading: boolean;
  error: string | null;
  selectPortfolio: (portfolio: Portfolio | null) => void;
  selectPortfolioById: (id: string) => void;
  fetchPortfolios: () => Promise<void>;
  createPortfolio: (data: PortfolioCreate) => Promise<Portfolio>;
  deletePortfolio: (id: string) => Promise<void>;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export const PortfolioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPortfolios = useCallback(async () => {
    if (!user) {
      setPortfolios([]);
      setSelectedPortfolio(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await portfolioApi.list();
      setPortfolios(list);
      // Auto-select first or previously selected
      setSelectedPortfolio((prev) => {
        if (!prev && list.length > 0) return list[0];
        if (prev && !list.find((p) => p.id === prev.id) && list.length > 0) return list[0];
        return prev;
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch portfolios';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPortfolios();
  }, [fetchPortfolios]);

  const selectPortfolio = (p: Portfolio | null) => {
    setSelectedPortfolio(p);
  };

  const selectPortfolioById = (id: string) => {
    const found = portfolios.find((p) => p.id === id);
    if (found) {
      setSelectedPortfolio(found);
    }
  };

  const createPortfolio = async (data: PortfolioCreate): Promise<Portfolio> => {
    const created = await portfolioApi.create(data);
    setPortfolios((prev) => [created, ...prev]);
    setSelectedPortfolio(created);
    return created;
  };

  const deletePortfolio = async (id: string): Promise<void> => {
    await portfolioApi.delete(id);
    setPortfolios((prev) => prev.filter((p) => p.id !== id));
    setSelectedPortfolio((prev) => (prev?.id === id ? null : prev));
  };

  return (
    <PortfolioContext.Provider
      value={{
        portfolios,
        selectedPortfolio,
        loading,
        error,
        selectPortfolio,
        selectPortfolioById,
        fetchPortfolios,
        createPortfolio,
        deletePortfolio,
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
};

export function usePortfolio(): PortfolioContextType {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
}
