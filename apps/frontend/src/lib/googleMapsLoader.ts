// ============================================================================
// Google Maps 统一加载器
// 创建时间: 2025-01-27 14:30:00
// 说明: 提供幂等的 Google Maps API 脚本加载，支持 CSP/nonce 和错误处理
// ============================================================================

/**
 * 加载 Google Maps JavaScript API
 * 提供幂等加载，避免重复注入脚本
 * 
 * @param apiKey - Google Maps API Key
 * @param libraries - 需要加载的库，默认为 ['places', 'geometry']
 * @returns Promise<typeof google> - 返回 google 对象
 */
export const loadGoogleMaps = (() => {
  let promise: Promise<typeof google> | null = null;
  let isLoaded = false;

  return (apiKey: string, libraries: string[] = ['places', 'geometry']): Promise<typeof google> => {
    // 2025-01-27 14:30:00 检查是否在客户端环境
    if (typeof window === 'undefined') {
      return Promise.reject(new Error('Google Maps API can only be loaded in browser environment'));
    }

    // 2025-01-27 14:30:00 如果已经加载，直接返回
    if ((window as any).google?.maps) {
      return Promise.resolve((window as any).google);
    }

    // 2025-01-27 14:30:00 如果正在加载，返回同一个 Promise（幂等）
    if (promise) {
      return promise;
    }

    // 2025-01-27 14:30:00 验证 API Key
    if (!apiKey || apiKey.trim() === '') {
      const error = new Error('Google Maps API Key is required');
      promise = Promise.reject(error);
      return promise;
    }

    // 2025-01-27 14:30:00 创建加载 Promise
    promise = new Promise<typeof google>((resolve, reject) => {
      const scriptId = 'google-maps-api-script';
      
      // 2025-01-27 14:30:00 检查是否已存在脚本标签
      const existingScript = document.getElementById(scriptId);
      if (existingScript) {
        // 如果脚本已存在但未加载完成，等待其加载
        const checkInterval = setInterval(() => {
          if ((window as any).google?.maps) {
            clearInterval(checkInterval);
            resolve((window as any).google);
          }
        }, 100);

        // 2025-01-27 14:30:00 设置超时（30秒）
        setTimeout(() => {
          clearInterval(checkInterval);
          if (!(window as any).google?.maps) {
            reject(new Error('Google Maps API load timeout'));
          }
        }, 30000);
        return;
      }

      // 2025-01-27 14:30:00 构建脚本 URL
      const librariesParam = libraries.length > 0 ? `&libraries=${libraries.join(',')}` : '';
      const src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}${librariesParam}&v=weekly&callback=__googleMapsInitCallback`;

      // 2025-01-27 14:30:00 创建全局回调函数
      (window as any).__googleMapsInitCallback = () => {
        if ((window as any).google?.maps) {
          isLoaded = true;
          resolve((window as any).google);
        } else {
          reject(new Error('Google Maps API loaded but google.maps is not available'));
        }
        // 2025-01-27 14:30:00 清理回调
        delete (window as any).__googleMapsInitCallback;
      };

      // 2025-01-27 14:30:00 创建脚本元素
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = src;
      script.async = true;
      script.defer = true;

      // 2025-01-27 14:30:00 错误处理
      script.onerror = () => {
        const error = new Error('Failed to load Google Maps JavaScript API');
        console.error('❌ [Google Maps Loader] Script load error:', {
          src,
          apiKeyPrefix: apiKey.substring(0, 8),
          error: error.message,
        });
        // 2025-01-27 14:30:00 清理回调
        delete (window as any).__googleMapsInitCallback;
        reject(error);
      };

      // 2025-01-27 14:30:00 添加到文档头部
      document.head.appendChild(script);

      // 2025-01-27 14:30:00 设置超时（30秒）
      setTimeout(() => {
        if (!isLoaded && !(window as any).google?.maps) {
          const error = new Error('Google Maps API load timeout after 30 seconds');
          console.error('❌ [Google Maps Loader] Load timeout:', error);
          // 2025-01-27 14:30:00 清理回调和脚本
          delete (window as any).__googleMapsInitCallback;
          const scriptElement = document.getElementById(scriptId);
          if (scriptElement) {
            scriptElement.remove();
          }
          reject(error);
        }
      }, 30000);
    });

    return promise;
  };
})();

/**
 * 检查 Google Maps API 是否已加载
 */
export const isGoogleMapsLoaded = (): boolean => {
  return typeof window !== 'undefined' && !!(window as any).google?.maps;
};
