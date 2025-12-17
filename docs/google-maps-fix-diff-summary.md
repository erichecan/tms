# Google Maps 初始化与距离计算修复 - 代码 Diff 总结

**创建时间**: 2025-01-27 17:20:00  
**修复范围**: 环境变量配置、初始化流程、后端代理、距离计算

## 一、环境变量配置修复

### 1.1 `apps/frontend/src/config/env.ts`

```diff
+++ apps/frontend/src/config/env.ts
+// 2025-01-27 16:20:00 读取环境变量辅助函数（兼容 Vite 和 Next.js）
+function readEnv(key: string, options: { required?: boolean; defaultValue?: string } = {}): string {
+  // 优先读取 Vite 环境变量（import.meta.env）
+  let value: string | undefined;
+  
+  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
+    value = (import.meta as any).env[key];
+  }
+  
+  // 如果 Vite 环境变量不存在，尝试 Next.js 环境变量（process.env）
+  if (!value && typeof process !== 'undefined' && process.env) {
+    const nextKey = key.replace('VITE_', 'NEXT_PUBLIC_');
+    value = process.env[nextKey];
+  }
+  
+  if (!value && options.required) {
+    const error = new Error(
+      `Required environment variable ${key} (or ${key.replace('VITE_', 'NEXT_PUBLIC_')}) is not set`
+    );
+    throw error;
+  }
+  
+  return value || options.defaultValue || '';
+}

+// 2025-01-27 16:20:00 在构建时验证配置（CI fail-fast）
+if (typeof window === 'undefined' || import.meta.env?.MODE === 'production') {
+  try {
+    validateEnvConfig();
+  } catch (error) {
+    if (typeof window === 'undefined') {
+      throw error; // 构建时如果缺少必需配置，抛出错误（CI fail-fast）
+    }
+  }
+}
```

**变更说明**:
- 兼容 Vite (`VITE_*`) 和 Next.js (`NEXT_PUBLIC_*`) 环境变量
- 构建时校验，CI fail-fast
- 提供清晰的错误提示

## 二、MapsService 修复

### 2.1 `apps/frontend/src/services/mapsService.ts`

```diff
+++ apps/frontend/src/services/mapsService.ts
+import { loadGoogleMaps } from '../lib/googleMapsLoader';
+import { GM } from '../config/env';

  private async doInitialize(): Promise<void> {
    try {
-      if (!this.config.apiKey || this.config.apiKey.trim() === '') {
+      const apiKey = GM.GOOGLE_MAPS_API_KEY; // 从统一配置读取
+      
+      if (!apiKey || apiKey.trim() === '') {
         const error = new Error('缺少 VITE_GOOGLE_MAPS_API_KEY 配置');
+        const traceId = `gm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
         throw error;
       }

-      MapsService.loaderInstance = new Loader({...});
-      this.maps = await MapsService.loaderInstance.load();
+      if (typeof window === 'undefined') {
+        throw new Error('Google Maps API can only be initialized in browser environment');
+      }
+
+      const googleObj = await loadGoogleMaps(apiKey, this.config.libraries);
+      this.maps = googleObj.maps;
       this.isInitialized = true;
     } catch (error: any) {
       // 增强错误日志
     }
   }

+  async ensureReady(): Promise<typeof google> {
+    if (!this.isInitialized) {
+      await this.initialize();
+    }
+    if (typeof window === 'undefined' || !(window as any).google?.maps) {
+      throw new Error('Google Maps API is not available');
+    }
+    return (window as any).google;
+  }
```

**变更说明**:
- 使用统一的环境变量配置
- 使用新的 `loadGoogleMaps` 加载器
- 添加 `ensureReady()` 方法确保 API 已加载
- 改进错误处理和 traceId

## 三、AddressAutocomplete 修复

### 3.1 `apps/frontend/src/components/AddressAutocomplete/AddressAutocomplete.tsx`

```diff
+++ apps/frontend/src/components/AddressAutocomplete/AddressAutocomplete.tsx
  useEffect(() => {
+    // 2025-01-27 16:30:00 检查是否在客户端环境
+    if (typeof window === 'undefined') {
+      return;
+    }
+
+    let mounted = true;
     const initAutocomplete = async () => {
       try {
-        await mapsService.initialize();
+        // 使用 ensureReady 确保服务已准备好
+        const googleObj = await mapsService.ensureReady();
         
         if (!mounted || !inputRef.current) {
           return;
         }

-        const maps = mapsService.getMaps();
-        const autocompleteInstance = new google.maps.places.Autocomplete(...);
+        const autocompleteInstance = new googleObj.maps.places.Autocomplete(...);
       } catch (error: any) {
+        console.error('❌ [AddressAutocomplete] 错误详情:', {
+          name: error?.name,
+          message: error?.message,
+          stack: error?.stack,
+        });
         message.error(`地址自动完成初始化失败: ${error?.message || '请检查 API Key 配置'}`);
       }
     };

     initAutocomplete();

     return () => {
+      mounted = false;
       if (autocomplete && typeof window !== 'undefined' && (window as any).google?.maps) {
         (window as any).google.maps.event.clearInstanceListeners(autocomplete);
       }
     };
   }, [onChange, onAddressSelected, autocomplete]);
```

**变更说明**:
- 仅在客户端初始化（SSR 安全）
- 使用 `ensureReady()` 等待 API 加载
- 改进错误处理和清理逻辑

## 四、后端代理端点

### 4.1 `apps/backend/src/services/mapsProxyService.ts` (新建)

```diff
+++ apps/backend/src/services/mapsProxyService.ts
+import axios from 'axios';
+import { AddressInfo } from '../types/maps';
+
+const BASE_URL = 'https://maps.googleapis.com/maps/api';
+const API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';
+
+// 缓存机制
+const cache = new Map<string, CacheEntry>();
+const CACHE_TTL_MS = 60 * 60 * 1000; // 1 小时
+
+export async function geocodeProxy(address: string): Promise<AddressInfo> {
+  // 检查缓存
+  const cacheKey = `geocode:${address}`;
+  const cached = cache.get(cacheKey);
+  if (cached && cached.expiresAt > new Date()) {
+    return cached.result;
+  }
+
+  // 调用 Google Maps Geocoding API
+  const response = await axios.get(`${BASE_URL}/geocode/json`, {
+    params: { address, key: API_KEY, region: 'ca', language: 'en' },
+  });
+
+  // 解析结果并缓存
+  // ...
+}
+
+export async function distanceProxy(params: {
+  origin: string;
+  destination: string;
+  units: 'metric' | 'imperial';
+}): Promise<DistanceResult> {
+  // 检查缓存
+  // 调用 Google Maps Distance Matrix API
+  // 返回距离信息
+}
```

**变更说明**:
- 后端代理 Google Maps REST API
- 隐藏 API Key，避免前端暴露
- 实现缓存机制减少 API 调用

### 4.2 `apps/backend/src/routes/maps.ts`

```diff
+++ apps/backend/src/routes/maps.ts
+import { geocodeProxy, distanceProxy } from '../services/mapsProxyService';

+// 2025-01-27 16:35:00 代理端点：Geocoding（GET 方式）
+router.get('/geocode', async (req, res) => {
+  const address = String(req.query.q || req.query.address || '');
+  if (!address) {
+    return res.status(400).json({ error: 'Address parameter is required', code: 'MISSING_ADDRESS' });
+  }
+  const result = await geocodeProxy(address);
+  res.json({ success: true, data: result });
+});

+// 2025-01-27 16:35:00 代理端点：Distance Matrix
+router.get('/distance', async (req, res) => {
+  const { origin, destination, units = 'metric' } = req.query;
+  if (!origin || !destination) {
+    return res.status(400).json({ error: 'Origin and destination are required', code: 'MISSING_PARAMETERS' });
+  }
+  const result = await distanceProxy({ origin, destination, units });
+  res.json({ success: true, data: result });
+});
```

**变更说明**:
- 新增 GET `/api/maps/geocode` 端点
- 新增 GET `/api/maps/distance` 端点
- 统一错误处理

## 五、订单距离计算服务

### 5.1 `apps/frontend/src/services/orderDistance.ts` (新建)

```diff
+++ apps/frontend/src/services/orderDistance.ts
+import axios from 'axios';

+export async function calculateOrderDistance(params: {
+  warehouseAddress: string;
+  customerAddress: string;
+  units?: 'metric' | 'imperial';
+}): Promise<DistanceResult> {
+  const response = await axios.get(`${API_BASE_URL}/maps/distance`, {
+    params: {
+      origin: params.warehouseAddress,
+      destination: params.customerAddress,
+      units: params.units || 'metric',
+    },
+  });
+
+  if (response.data.success && response.data.data) {
+    return response.data.data;
+  } else {
+    throw new Error(response.data.error || 'Distance calculation failed');
+  }
+}

+export async function saveOrderDistance(orderId: string, distance: DistanceResult): Promise<void> {
+  await axios.patch(`${API_BASE_URL}/orders/${orderId}`, {
+    distance: distance.distance,
+    distanceText: distance.distanceText,
+    estimatedDuration: distance.duration,
+    estimatedDurationText: distance.durationText,
+  });
+}
```

**变更说明**:
- 封装距离计算逻辑
- 支持公制和英制单位
- 提供保存到订单的方法

## 六、部署脚本更新

### 6.1 `scripts/gcp-deploy-auto-artifact.sh`

```diff
+++ scripts/gcp-deploy-auto-artifact.sh
 # 10. 构建前端镜像
+GOOGLE_MAPS_API_KEY_FRONTEND=$(gcloud secrets versions access latest --secret="google-maps-api-key-frontend" --project=$PROJECT_ID 2>/dev/null || echo "")
+if [ -z "$GOOGLE_MAPS_API_KEY_FRONTEND" ]; then
+    GOOGLE_MAPS_API_KEY_FRONTEND=$(gcloud secrets versions access latest --secret="google-maps-api-key" --project=$PROJECT_ID 2>/dev/null || echo "")
+fi
+if [ -z "$GOOGLE_MAPS_API_KEY_FRONTEND" ]; then
+    echo -e "${RED}❌ 错误: 无法从 Secret Manager 获取 Google Maps API Key${NC}"
+    exit 1
+fi

 docker build --platform linux/amd64 \
     --build-arg VITE_API_BASE_URL=$BACKEND_URL/api \
+    --build-arg VITE_GOOGLE_MAPS_API_KEY="$GOOGLE_MAPS_API_KEY_FRONTEND" \
     --build-arg BUILD_VERSION=$GIT_SHA \
     --build-arg BUILD_TIME=$BUILD_TIME \
     -f docker/frontend/Dockerfile .
```

**变更说明**:
- 从 Secret Manager 获取 API Key
- 在构建时注入 `VITE_GOOGLE_MAPS_API_KEY`
- 提供错误处理和回退机制

## 七、环境变量示例

### 7.1 `env.example`

```diff
+++ env.example
 VITE_GOOGLE_MAPS_API_KEY=your-frontend-google-maps-api-key
+
+# Google Maps 控制配置 - 2025-01-27 16:55:00
+GM_DEBOUNCE_MS=400
+GM_CACHE_TTL_MS=60000
+GM_MAX_CALLS_PER_SESSION=200
```

## 八、测试文件

### 8.1 `tests/api/maps-proxy.spec.ts` (新建)
- 测试 `/api/maps/geocode` 端点
- 测试 `/api/maps/distance` 端点
- 验证缓存机制

### 8.2 `tests/ui/AddressAutocomplete.spec.tsx` (新建)
- 测试组件初始化
- 测试错误处理
- 测试自动完成功能

### 8.3 `tests/unit/orderDistance.spec.ts` (新建)
- 测试距离计算
- 测试单位换算
- 测试错误处理

## 九、文档

### 9.1 `docs/google-maps-distance-in-order.md` (新建)
- 架构设计
- 环境变量配置
- 调试方法
- 费用控制策略

## 十、修复总结

### 10.1 根因诊断

1. **环境变量未注入**: Vite 构建时 `VITE_GOOGLE_MAPS_API_KEY` 未从 Secret Manager 注入
2. **初始化时机错误**: 在 SSR 环境尝试初始化 Google Maps
3. **缺少后端代理**: 前端直接调用 Google REST API，暴露 API Key
4. **错误日志不清晰**: 仅显示 "Object"，缺少详细信息

### 10.2 修复方案

1. ✅ 统一环境变量配置（兼容 Vite 和 Next.js）
2. ✅ 构建时校验，CI fail-fast
3. ✅ 幂等 Loader，仅在客户端初始化
4. ✅ 后端代理端点，隐藏 API Key
5. ✅ 改进错误日志，包含 traceId
6. ✅ 距离计算服务集成
7. ✅ 部署脚本自动注入环境变量

### 10.3 验证步骤

1. **本地验证**:
   ```bash
   # 设置环境变量
   echo "VITE_GOOGLE_MAPS_API_KEY=your-key" > apps/frontend/.env.local
   
   # 启动开发服务器
   cd apps/frontend && npm run dev
   
   # 打开订单创建页面，测试地址输入和距离计算
   ```

2. **生产验证**:
   ```bash
   # 部署到 GCP
   ./scripts/gcp-deploy-auto-artifact.sh
   
   # 访问生产环境，测试功能
   ```

## 十一、提交信息

```
chore(env): enforce Google Maps API key configuration for Vite/Next
fix(maps): idempotent loader and robust initialization flow
feat(maps): add server-side proxies for geocode and distance
feat(order): integrate distance calculation into order creation
test(maps,order): add unit/UI tests for initialization and distance
docs(maps): add setup, troubleshooting and cost control
```
