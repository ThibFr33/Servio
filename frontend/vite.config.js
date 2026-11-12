import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    // The browser only talks to Vite, so the front and the API share one
    // origin: no CORS, and the session cookie works as in production.
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        // Keep the original Host header so Symfony sees the real app origin,
        // which the CSRF Origin check will rely on.
        changeOrigin: false,
      },
    },
  },
})
