import React, { useState } from 'react';
import { Briefcase, ChevronDown, Plus } from 'lucide-react';
import { usePortfolio } from '../../context/PortfolioContext';

interface PortfolioSelectorProps {
  onOpenCreate?: () => void;
}

export const PortfolioSelector: React.FC<PortfolioSelectorProps> = ({ onOpenCreate }) => {
  const { portfolios, selectedPortfolio, selectPortfolioById } = usePortfolio();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
      >
        <Briefcase className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
        <span className="max-w-[140px] truncate">
          {selectedPortfolio ? selectedPortfolio.name : 'Select Portfolio'}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 mt-1.5 w-56 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg py-1 z-30">
            <div className="px-3 py-1.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
              Your Portfolios
            </div>

            <div className="max-h-60 overflow-y-auto py-1">
              {portfolios.length === 0 ? (
                <div className="px-3 py-2 text-xs text-slate-400 italic">No portfolios yet</div>
              ) : (
                portfolios.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      selectPortfolioById(p.id);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                      selectedPortfolio?.id === p.id
                        ? 'text-blue-600 dark:text-blue-400 font-semibold bg-blue-50/50 dark:bg-blue-950/20'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="truncate">{p.name}</span>
                    {selectedPortfolio?.id === p.id && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                    )}
                  </button>
                ))
              )}
            </div>

            {onOpenCreate && (
              <div className="border-t border-slate-100 dark:border-slate-800 pt-1 mt-1">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onOpenCreate();
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create Portfolio
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
