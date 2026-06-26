import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Prefer a dedicated proxy target for dev (`VITE_PROXY_TARGET`),
  // otherwise fall back to VITE_API_BASE_URL or localhost.
  const apiTarget = env.VITE_PROXY_TARGET || env.VITE_API_BASE_URL || 'http://localhost:5000'

  const cvAnalysisTarget = env.VITE_HF_CV_ANALYSIS_URL || 'https://swordha-cvanalysis.hf.space'

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
        // Proxy for HF CV Analysis Space — avoids CORS in dev
        '/cv-api': {
          target: cvAnalysisTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/cv-api/, ''),
        },
      },
    },
    esbuild: {
      drop: (mode === 'production' ? ['console', 'debugger'] : []) as any,
    },
  }
})
