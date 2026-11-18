import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

function copy404Plugin(): Plugin {
  return {
    name: 'copy-404',
    apply: 'build',
    closeBundle() {
      const dist = path.resolve(__dirname, 'dist');
      const src = path.join(dist, 'index.html');
      const dest = path.join(dist, '404.html');
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: mode === 'development' ? '/' : (env.VITE_BASE_PATH || '/finsight-frontend/'),
    plugins: [react(), copy404Plugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            plotly: ['plotly.js-dist-min', 'react-plotly.js'],
            supabase: ['@supabase/supabase-js'],
          },
        },
      },
    },
  };
});
