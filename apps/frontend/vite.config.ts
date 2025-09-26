import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared-types': path.resolve(__dirname, '../../packages/shared-types/src'),
    },
  },
    server: {
      port: 3000, // 恢复使用端口 3000 // 2025-09-26 17:50:00
      host: true, // 允许外部访问
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});