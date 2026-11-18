import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'fin-green': '#16a34a',
        'fin-green-light': '#22c55e',
        'fin-green-muted': '#dcfce7',
        'fin-red': '#dc2626',
        'fin-red-light': '#ef4444',
        'fin-red-muted': '#fee2e2',
        'fin-blue': '#1e40af',
        'fin-blue-light': '#3b82f6',
        'fin-blue-muted': '#dbeafe',
        'fin-gray-50': '#f9fafb',
        'fin-gray-100': '#f3f4f6',
        'fin-gray-200': '#e5e7eb',
        'fin-gray-300': '#d1d5db',
        'fin-gray-400': '#9ca3af',
        'fin-gray-500': '#6b7280',
        'fin-gray-600': '#4b5563',
        'fin-gray-700': '#374151',
        'fin-gray-800': '#1f2937',
        'fin-gray-900': '#111827',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      boxShadow: {
        'fin-card': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'fin-card-hover': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      },
      borderRadius: {
        'fin': '0.375rem',
      },
      transitionDuration: {
        '150': '150ms',
      },
    },
  },
  plugins: [],
};

export default config;
