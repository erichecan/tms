# 创建订单时的地址距离计算

**创建时间**: 2025-01-27 17:15:00  
**更新人**: AI Assistant  
**状态**: 已实现

## 一、概述

本文档描述 TMS 系统在创建订单时如何计算仓库/门店地址到客户地址的距离，以及相关的架构、配置和调试方法。

## 二、架构设计

### 2.1 前端架构

```
用户输入地址
    ↓
AddressAutocomplete 组件
    ↓
mapsService.ensureReady() (确保 Google Maps API 已加载)
    ↓
Places Autocomplete (地址自动完成)
    ↓
用户选择地址
    ↓
orderDistance.calculateOrderDistance() (调用后端代理)
    ↓
后端 /api/maps/distance
    ↓
Google Maps Distance Matrix API
    ↓
返回距离信息
    ↓
保存到订单草稿
```

### 2.2 后端代理架构

```
前端请求 /api/maps/distance
    ↓
mapsProxyService.distanceProxy()
    ↓
检查缓存
    ↓
Google Maps Distance Matrix REST API
    ↓
缓存结果（1小时）
    ↓
返回距离信息
```

## 三、环境变量配置

### 3.1 前端环境变量

**Vite 项目**（推荐）:
```bash
VITE_GOOGLE_MAPS_API_KEY=your-frontend-api-key
VITE_GM_DEBOUNCE_MS=400
VITE_GM_CACHE_TTL_MS=60000
VITE_GM_MAX_CALLS_PER_SESSION=200
```

**Next.js 项目**（兼容）:
```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-frontend-api-key
GM_DEBOUNCE_MS=400
GM_CACHE_TTL_MS=60000
GM_MAX_CALLS_PER_SESSION=200
```

### 3.2 后端环境变量

```bash
GOOGLE_MAPS_API_KEY=your-backend-api-key
```

### 3.3 配置说明

- **前端 API Key**: 用于 Maps JavaScript API 和 Places API，必须设置 HTTP 引用来源限制
- **后端 API Key**: 用于 Geocoding 和 Distance Matrix REST API，可以设置 IP 限制
- **去抖延迟**: 地址输入停止后等待时间（毫秒），默认 400ms
- **缓存 TTL**: 地理编码和距离计算结果缓存时间（毫秒），默认 60000ms（1分钟）
- **会话上限**: 每个会话的最大 API 调用次数，默认 200 次

## 四、代码实现

### 4.1 环境变量读取（兼容 Vite 和 Next.js）

```typescript
// src/config/env.ts
export const GM = {
  GOOGLE_MAPS_API_KEY: 
    import.meta.env?.VITE_GOOGLE_MAPS_API_KEY || 
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 
    '',
  // ...
};
```

### 4.2 前端初始化流程

```typescript
// AddressAutocomplete.tsx
useEffect(() => {
  if (typeof window === 'undefined') return; // 仅在客户端执行
  
  const init = async () => {
    const googleObj = await mapsService.ensureReady(); // 确保 API 已加载
    const autocomplete = new googleObj.maps.places.Autocomplete(inputElement);
    // ...
  };
  
  init();
}, []);
```

### 4.3 后端代理端点

```typescript
// routes/maps.ts
router.get('/maps/distance', async (req, res) => {
  const { origin, destination, units } = req.query;
  const result = await distanceProxy({ origin, destination, units });
  res.json({ success: true, data: result });
});
```

### 4.4 距离计算服务

```typescript
// services/orderDistance.ts
export async function calculateOrderDistance(params: {
  warehouseAddress: string;
  customerAddress: string;
  units?: 'metric' | 'imperial';
}): Promise<DistanceResult> {
  const response = await axios.get('/api/maps/distance', { params });
  return response.data.data;
}
```

## 五、费用控制策略

### 5.1 调用分类与费用

| API 类型 | 免费额度 | 超出后价格（参考） |
|---------|---------|------------------|
| Geocoding | $200/月 | $5/1000 次 |
| Distance Matrix | $200/月 | $5/1000 次 |
| Places Autocomplete | $200/月 | $2.83/1000 次 |

### 5.2 控制机制

1. **去抖（Debounce）**:
   - Places Autocomplete: 400ms 延迟
   - 仅在输入停止后请求
   - 最小输入长度: 3 个字符

2. **缓存**:
   - 地理编码结果: 1 小时缓存
   - 距离计算结果: 1 小时缓存
   - 使用 LRU 缓存，最大 500 条

3. **会话限流**:
   - 默认上限: 200 次/会话
   - 超出后阻止调用并提示

4. **懒加载**:
   - 仅在地图组件可见时加载 JS API
   - 使用 IntersectionObserver

## 六、调试方法

### 6.1 检查环境变量

**前端（浏览器控制台）**:
```javascript
console.log(import.meta.env.VITE_GOOGLE_MAPS_API_KEY);
```

**后端（服务器日志）**:
```bash
echo $GOOGLE_MAPS_API_KEY
```

### 6.2 检查初始化状态

**前端**:
```javascript
// 检查 Google Maps 是否已加载
console.log(window.google?.maps);

// 检查 mapsService 状态
console.log(mapsService.isReady());
```

### 6.3 常见问题排查

#### 问题 1: "缺少 VITE_GOOGLE_MAPS_API_KEY 配置"

**原因**:
- 环境变量未在构建时注入
- Cloud Run 环境变量未配置

**解决方案**:
1. 检查 `.env` 文件是否包含 `VITE_GOOGLE_MAPS_API_KEY`
2. 检查 Dockerfile 构建参数是否包含 `--build-arg VITE_GOOGLE_MAPS_API_KEY`
3. 检查 Cloud Run 服务配置是否包含环境变量

#### 问题 2: "Google Maps API can only be loaded in browser environment"

**原因**:
- 在 SSR 环境（服务器端）尝试初始化

**解决方案**:
- 确保初始化代码在 `useEffect` 中执行
- 检查 `typeof window !== 'undefined'`

#### 问题 3: "RefererNotAllowedMapError"

**原因**:
- API Key 的 HTTP 引用来源限制未包含当前域名

**解决方案**:
1. 在 Google Cloud Console 中检查 API Key 限制
2. 添加当前域名到允许列表

### 6.4 查看调用统计

**前端 Debug Panel**:
- 开发模式下自动显示
- 显示总调用次数、按类型统计、会话时长

**后端 Telemetry**:
```bash
curl https://your-backend-url/api/telemetry/googlemaps/stats
```

## 七、部署配置

### 7.1 GitHub Actions

```yaml
- name: Build frontend
  env:
    VITE_GOOGLE_MAPS_API_KEY: ${{ secrets.GOOGLE_MAPS_API_KEY_FRONTEND }}
  run: npm run build
```

### 7.2 Cloud Run 部署

```bash
# 从 Secret Manager 获取并注入
GOOGLE_MAPS_API_KEY_FRONTEND=$(gcloud secrets versions access latest --secret="google-maps-api-key-frontend")

docker build \
  --build-arg VITE_GOOGLE_MAPS_API_KEY="$GOOGLE_MAPS_API_KEY_FRONTEND" \
  -f docker/frontend/Dockerfile .
```

## 八、测试

### 8.1 本地测试

1. 设置 `.env.local`:
   ```bash
   VITE_GOOGLE_MAPS_API_KEY=your-key
   ```

2. 启动开发服务器:
   ```bash
   npm run dev
   ```

3. 打开订单创建页面，输入地址测试

### 8.2 单元测试

```bash
npm run test:unit
```

### 8.3 E2E 测试

```bash
npm run test:e2e
```

## 九、相关文档

- [Google Maps Platform 文档](https://developers.google.com/maps/documentation)
- [Google Maps Platform 定价](https://cloud.google.com/maps-platform/pricing)
- [TMS 可观测性文档](./google-maps-observability.md)
