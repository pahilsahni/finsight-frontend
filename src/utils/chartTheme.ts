/**
 * Plotly layout & theme configuration for consistent financial charting.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getPlotlyLayout(isDark: boolean, options: Record<string, any> = {}): any {
  const bg = isDark ? '#0f172a' : '#ffffff';
  const paperBg = isDark ? '#0f172a' : '#ffffff';
  const text = isDark ? '#94a3b8' : '#475569';
  const grid = isDark ? '#1e293b' : '#f1f5f9';
  const zeroLine = isDark ? '#334155' : '#e2e8f0';

  return {
    autosize: true,
    paper_bgcolor: paperBg,
    plot_bgcolor: bg,
    font: {
      family: 'Inter, system-ui, -apple-system, sans-serif',
      size: 11,
      color: text,
    },
    margin: { l: 55, r: 25, t: 30, b: 40 },
    xaxis: {
      gridcolor: grid,
      zerolinecolor: zeroLine,
      linecolor: zeroLine,
      tickfont: { color: text, size: 10 },
      showgrid: true,
    },
    yaxis: {
      gridcolor: grid,
      zerolinecolor: zeroLine,
      linecolor: zeroLine,
      tickfont: { color: text, size: 10 },
      showgrid: true,
    },
    legend: {
      orientation: 'h',
      yanchor: 'bottom',
      y: 1.02,
      xanchor: 'right',
      x: 1,
      font: { color: text, size: 10 },
    },
    hoverlabel: {
      bgcolor: isDark ? '#1e293b' : '#ffffff',
      bordercolor: isDark ? '#475569' : '#cbd5e1',
      font: {
        family: 'Inter, system-ui, sans-serif',
        size: 11,
        color: isDark ? '#f8fafc' : '#0f172a',
      },
    },
    ...options,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getPlotlyConfig(): any {
  return {
    displayModeBar: false,
    responsive: true,
  };
}

export const CHART_COLORS = {
  primary: '#2563eb', // Blue
  secondary: '#64748b', // Slate
  benchmark: '#f59e0b', // Amber
  success: '#10b981', // Emerald
  danger: '#ef4444', // Rose
  accent: '#8b5cf6', // Violet
  palette: [
    '#2563eb',
    '#10b981',
    '#f59e0b',
    '#8b5cf6',
    '#06b6d4',
    '#ec4899',
    '#f97316',
    '#64748b',
    '#14b8a6',
    '#6366f1',
  ],
};
