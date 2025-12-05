import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import App from './App';
import './index.css';

// 配置React Router v7 future flags
// 修复时间: 2025-09-29 22:20:00
const routerConfig = {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  },
};

// 2025-12-04 输出版本信息到 console
// 2025-12-05T13:50:00Z Added by Assistant: 添加环境变量调试信息
const buildVersion = import.meta.env.VITE_BUILD_VERSION || 'unknown';
const buildTime = import.meta.env.VITE_BUILD_TIME || 'unknown';
console.log(
  `%c[TMS Frontend] Version: ${buildVersion} | Build Time: ${buildTime}`,
  'color: #1890ff; font-weight: bold; font-size: 14px;'
);
console.log(`[TMS Frontend] Version: ${buildVersion} | Build Time: ${buildTime}`);

// 2025-12-05T13:50:00Z Added by Assistant: 打印所有环境变量用于调试
console.group('🔍 [TMS Frontend] 环境变量调试信息');
console.log('📦 所有 VITE_ 环境变量:');
const viteEnvKeys = Object.keys(import.meta.env).filter(key => key.startsWith('VITE_'));
viteEnvKeys.forEach(key => {
  const value = import.meta.env[key];
  if (key.includes('KEY') || key.includes('SECRET')) {
    // 对于敏感信息，只显示前8位
    console.log(`  - ${key}:`, value ? `${value.substring(0, 8)}... (长度: ${value.length})` : '(未设置)');
  } else {
    console.log(`  - ${key}:`, value || '(未设置)');
  }
});
console.log('🗝️  Google Maps API Key 检查:');
console.log('  - VITE_GOOGLE_MAPS_API_KEY 存在:', 'VITE_GOOGLE_MAPS_API_KEY' in import.meta.env);
console.log('  - VITE_GOOGLE_MAPS_API_KEY 值:', import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '(未设置)');
console.log('  - VITE_GOOGLE_MAPS_API_KEY 类型:', typeof import.meta.env.VITE_GOOGLE_MAPS_API_KEY);
console.log('  - VITE_GOOGLE_MAPS_API_KEY 长度:', import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.length || 0);
if (import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
  console.log('  - VITE_GOOGLE_MAPS_API_KEY 前8位:', import.meta.env.VITE_GOOGLE_MAPS_API_KEY.substring(0, 8));
  console.log('  - VITE_GOOGLE_MAPS_API_KEY 后8位:', import.meta.env.VITE_GOOGLE_MAPS_API_KEY.substring(import.meta.env.VITE_GOOGLE_MAPS_API_KEY.length - 8));
}
console.log('🌐 构建信息:');
console.log('  - MODE:', import.meta.env.MODE);
console.log('  - DEV:', import.meta.env.DEV);
console.log('  - PROD:', import.meta.env.PROD);
console.log('  - SSR:', import.meta.env.SSR);
console.groupEnd();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider locale={zhCN}>
      <App />
    </ConfigProvider>
  </React.StrictMode>
);
