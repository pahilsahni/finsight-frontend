import React from 'react';
import { Outlet } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';
import { ThemeToggle } from '../components/common/ThemeToggle';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between text-slate-900 dark:text-slate-100 transition-colors">
      <header className="w-full max-w-7xl mx-auto p-4 sm:p-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-600 dark:bg-blue-500 text-white shadow-sm">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">
              FinSight
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs font-medium text-slate-400 border-l border-slate-300 dark:border-slate-700 pl-2">
              Quantitative Portfolio Risk Analytics
            </span>
          </div>
        </div>
        <ThemeToggle />
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </main>

      <footer className="w-full max-w-7xl mx-auto p-4 sm:p-6 text-center text-xs text-slate-400">
        &copy; {new Date().getFullYear()} FinSight Analytics. Indian Equity Risk Modeling (NSE / BSE).
      </footer>
    </div>
  );
};
