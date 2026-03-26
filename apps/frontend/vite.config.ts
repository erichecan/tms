import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// 2026-03-25T23:45:00 本地 dev / Playwright：若 VITE_API_BASE_URL=/api，请求走 5173，需代理到后端 3001
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
