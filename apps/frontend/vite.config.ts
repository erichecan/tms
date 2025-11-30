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
      '@tms/shared-types': path.resolve(__dirname, '../../packages/shared-types/dist/index.js'), // 2025-11-29T19:20:00 修复：使用编译后的 dist 文件
    },
  },
    server: {
      port: 3000, // 恢复使用端口 3000 // 2025-09-26 17:50:00
      host: true, // 允许外部访问
      proxy: {
        '/api': {
          target: process.env.VITE_API_BASE_URL || 'http://localhost:8000', // 2025-11-30T10:05:00Z Fixed by Assistant: 修复代理目标端口为 8000
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