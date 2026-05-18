import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Prefer a dedicated proxy target for dev (`VITE_PROXY_TARGET`),
  // otherwise fall back to VITE_API_BASE_URL or localhost.
  const apiTarget = env.VITE_PROXY_TARGET || env.VITE_API_BASE_URL || 'http://localhost:5000'

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
    esbuild: {
      drop: (mode === 'production' ? ['console', 'debugger'] : []) as any,
    },
  }
})
