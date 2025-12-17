// ============================================================================
// 环境变量配置
// 创建时间: 2025-01-27 14:40:00
// 更新时间: 2025-01-27 16:20:00
// 说明: 统一管理环境变量，提供类型安全的配置访问，兼容 Vite 和 Next.js
// ============================================================================

interface EnvConfig {
  GOOGLE_MAPS_API_KEY: string;
  GM_DEBOUNCE_MS: number;
  GM_CACHE_TTL_MS: number;
  GM_MAX_CALLS_PER_SESSION: number;
}

// 2025-01-27 16:20:00 读取环境变量辅助函数（兼容 Vite 和 Next.js）
function readEnv(key: string, options: { required?: boolean; defaultValue?: string } = {}): string {
  // 2025-01-27 16:20:00 优先读取 Vite 环境变量（import.meta.env）
  let value: string | undefined;
  
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    value = (import.meta as any).env[key];
  }
  
  // 2025-01-27 16:20:00 如果 Vite 环境变量不存在，尝试 Next.js 环境变量（process.env）
  if (!value && typeof process !== 'undefined' && process.env) {
    // 2025-01-27 16:20:00 Vite 使用 VITE_ 前缀，Next.js 使用 NEXT_PUBLIC_ 前缀
    const nextKey = key.replace('VITE_', 'NEXT_PUBLIC_');
    value = process.env[nextKey];
  }
  
  if (!value && options.required) {
    const error = new Error(
      `Required environment variable ${key} (or ${key.replace('VITE_', 'NEXT_PUBLIC_')}) is not set`
    );
    console.error('❌ [Env Config] Missing required environment variable:', {
      key,
      alternativeKey: key.replace('VITE_', 'NEXT_PUBLIC_'),
      error: error.message,
    });
    throw error;
  }
  
  return value || options.defaultValue || '';
}

// 2025-01-27 16:20:00 Google Maps 配置（兼容 Vite 和 Next.js）
export const GM: EnvConfig = {
  GOOGLE_MAPS_API_KEY: readEnv('VITE_GOOGLE_MAPS_API_KEY', { required: false }), // 2025-01-27 16:20:00 改为非必需，允许运行时检查
  GM_DEBOUNCE_MS: Number(readEnv('VITE_GM_DEBOUNCE_MS', { defaultValue: '400' })),
  GM_CACHE_TTL_MS: Number(readEnv('VITE_GM_CACHE_TTL_MS', { defaultValue: '60000' })),
  GM_MAX_CALLS_PER_SESSION: Number(readEnv('VITE_GM_MAX_CALLS_PER_SESSION', { defaultValue: '200' })),
};

// 2025-01-27 16:20:00 验证配置（构建时校验，CI fail-fast）
export function validateEnvConfig(): void {
  const errors: string[] = [];

  if (!GM.GOOGLE_MAPS_API_KEY || GM.GOOGLE_MAPS_API_KEY.trim() === '') {
    errors.push('VITE_GOOGLE_MAPS_API_KEY or NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is required');
  }

  if (GM.GM_DEBOUNCE_MS < 0) {
    errors.push('VITE_GM_DEBOUNCE_MS must be >= 0');
  }

  if (GM.GM_CACHE_TTL_MS < 0) {
    errors.push('VITE_GM_CACHE_TTL_MS must be >= 0');
  }

  if (GM.GM_MAX_CALLS_PER_SESSION < 1) {
    errors.push('VITE_GM_MAX_CALLS_PER_SESSION must be >= 1');
  }

  if (errors.length > 0) {
    console.error('❌ [Env Config] Configuration errors:', errors);
    throw new Error(`Environment configuration errors: ${errors.join(', ')}`);
  }
}

// 2025-01-27 16:20:00 在构建时验证配置（CI fail-fast）
// 仅在非浏览器环境或构建时执行，避免 SSR 时在客户端报错
if (typeof window === 'undefined' || import.meta.env?.MODE === 'production') {
  try {
    validateEnvConfig();
  } catch (error) {
    // 2025-01-27 16:20:00 构建时如果缺少必需配置，抛出错误（CI fail-fast）
    if (typeof window === 'undefined') {
      throw error;
    }
    console.warn('⚠️ [Env Config] Configuration validation failed:', error);
  }
}
