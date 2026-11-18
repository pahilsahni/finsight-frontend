# FinSight Frontend — Quantitative Portfolio Risk Analytics

Interactive React application for **FinSight**, a quantitative portfolio risk analytics platform tailored for Indian equity markets (NSE / BSE).

---

## Features

- **Modern Architecture**: Built with React 18, TypeScript, Vite 5, Tailwind CSS, and React Router v6.
- **Institutional Visualizations**: Interactive Plotly charts for performance tracking, returns histograms, correlation heatmaps, Monte Carlo trajectories, and the Markowitz Efficient Frontier.
- **Supabase Authentication**: Email/Password and Google OAuth authentication with session synchronization and protected routes.
- **Multi-Portfolio Management**: Switch between portfolios, add manual holdings and transactions, or import holdings via CSV/Excel.
- **Quantitative Modules**:
  - **Overview Dashboard**: High-level value, P&L, volatility, Sharpe, VaR 95%, beta, top holdings, and asset allocation donut chart.
  - **Performance Analytics**: Multi-period historical return comparisons against NIFTY 50 and daily return histograms.
  - **Risk Analytics**: Empirical VaR (90%, 95%, 99%), Conditional VaR (Expected Shortfall), correlation heatmap, and component volatility attribution.
  - **Monte Carlo Simulation**: Configurable probabilistic path simulation (1,000–10,000 runs) with percentiles and loss-threshold probabilities.
  - **Portfolio Optimization**: Minimum variance and maximum Sharpe asset allocations with efficient frontier curves.
  - **Stress Testing**: Sensitivity evaluation under -5%, -10%, -20%, -30% market crashes and custom percentage shocks.
  - **Reports & Export**: Downloadable full-portfolio CSV exports and structured JSON analysis summaries.
- **Dark & Light Mode**: Complete theme system with persistent preferences and chart color adaptation.

---

## Getting Started

### 1. Requirements

- Node.js 18+
- npm or yarn

### 2. Installation

```bash
cd frontend
npm install
```

### 3. Environment Variables

Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

Configure:

```ini
VITE_API_BASE_URL=http://localhost:8000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Production Build & Type Checking

To verify TypeScript and generate the production bundle:

```bash
npm run build
```

---

## Deployment on Vercel

1. Push this frontend repository to GitHub (`finsight-frontend`).
2. Import the project into [Vercel](https://vercel.com).
3. Framework Preset: **Vite**
4. Root Directory: `./`
5. Configure Environment Variables in Vercel:
   - `VITE_API_BASE_URL`: Your deployed Render backend URL (e.g., `https://finsight-api.onrender.com`)
   - `VITE_SUPABASE_URL`: Your Supabase URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
6. Deploy!
