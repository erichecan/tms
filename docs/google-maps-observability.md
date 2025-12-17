# Google Maps API 可观测性与成本控制文档

**创建时间**: 2025-01-27 15:15:00  
**更新人**: AI Assistant  
**状态**: 已实现

## 一、概述

本文档描述 TMS 系统中 Google Maps API 调用的可观测性机制和成本控制策略。

## 二、调用分类

### 2.1 调用类型

系统将 Google Maps API 调用分为以下类型：

| 类型 | 说明 | 典型触发点 |
|------|------|-----------|
| `js_api_load` | JavaScript API 加载 | 首次访问含地图的页面 |
| `geocoding` | 地址解析 | 输入地址、创建运单 |
| `reverse_geocoding` | 反向地址解析 | 点击地图、获取坐标地址 |
| `distance_matrix` | 距离矩阵 | 调度优化、批量距离计算 |
| `directions` | 路线计算 | 查看路线、路线规划 |
| `places_autocomplete` | 地址自动完成 | 地址输入框输入 |
| `places_details` | 地点详情 | 选择自动完成结果 |
| `static_maps` | 静态地图 | 生成地图图片（暂未实现） |
| `elevation` | 海拔查询 | 海拔计算（暂未实现） |

### 2.2 调用来源

- **前端组件**:
  - `GoogleMap.tsx` - 地图显示
  - `AddressAutocomplete.tsx` - 地址输入
  - `LogisticsMap.tsx` - 物流地图
  - `ShipmentCreate.tsx` - 运单创建
  - `dispatchOptimized.ts` - 调度优化

- **后端服务**:
  - `mapsApiService.ts` - 后端代理（缓存、统计）

## 三、可观测性机制

### 3.1 前端统计

#### 全局统计对象

前端通过 `window.__gmStats` 暴露调用统计：

```typescript
interface GoogleMapsCallStats {
  total: number;              // 总调用次数
  byType: Record<string, number>;  // 按类型统计
  sessionStart: number;       // 会话开始时间戳
}
```

#### 访问方式

1. **浏览器控制台**:
   ```javascript
   console.log(window.__gmStats);
   ```

2. **Debug Panel**:
   - 开发模式下自动显示
   - 位置：页面右下角浮动面板
   - 功能：实时统计、手动刷新、重置统计、清除缓存

3. **代码访问**:
   ```typescript
   import { getCallStats } from '@/services/googleMaps';
   const stats = getCallStats();
   ```

### 3.2 后端 Telemetry

#### API 端点

- **上报调用事件**: `POST /api/telemetry/googlemaps`
  ```json
  {
    "events": [
      {
        "type": "geocoding",
        "paramsDigest": "geocoding:{\"address\":\"Toronto\"}",
        "timestamp": 1706352000000,
        "page": "/shipments/create",
        "traceId": "gm_1706352000_abc123"
      }
    ]
  }
  ```

- **获取统计**: `GET /api/telemetry/googlemaps/stats?startTime=...&endTime=...`
  ```json
  {
    "success": true,
    "data": {
      "total": 150,
      "byType": {
        "geocoding": 80,
        "distance_matrix": 50,
        "directions": 20
      },
      "byPage": {
        "/shipments/create": 100,
        "/fleet": 50
      },
      "timeRange": {
        "start": "2025-01-27T00:00:00Z",
        "end": "2025-01-27T23:59:59Z"
      }
    }
  }
  ```

## 四、成本控制策略

### 4.1 缓存机制

#### LRU 缓存

- **容量**: 500 条记录
- **TTL**: 默认 60 秒（可通过 `VITE_GM_CACHE_TTL_MS` 配置）
- **缓存键**: `类型:参数摘要`

#### 缓存命中场景

- 相同地址的重复 geocoding
- 相同起终点的路线计算
- 相同坐标的反向 geocoding

#### 示例

```typescript
// 第一次调用 - 实际 API 调用
const addr1 = await geocode('Toronto, ON');
// 第二次调用 - 缓存命中，不消耗配额
const addr2 = await geocode('Toronto, ON');
```

### 4.2 去抖（Debounce）

#### Places Autocomplete

- **延迟**: 默认 400ms（可通过 `VITE_GM_DEBOUNCE_MS` 配置）
- **最小长度**: 3 个字符
- **效果**: 用户停止输入后才发起请求

#### 实现

```typescript
// 用户输入 "Tor" -> 等待 400ms
// 用户继续输入 "onto" -> 取消前一个请求，重新等待 400ms
// 用户停止输入 -> 发起请求
```

### 4.3 限流

#### 会话级限流

- **阈值**: 默认 200 次/会话（可通过 `VITE_GM_MAX_CALLS_PER_SESSION` 配置）
- **超出处理**: 抛出错误，阻止调用
- **重置**: 刷新页面或调用 `resetStats()`

#### 实现

```typescript
if (sessionCalls > MAX_CALLS_PER_SESSION) {
  throw new Error('Google Maps call limit exceeded');
}
```

### 4.4 懒加载

#### 地图组件

- 仅在地图容器可见时加载 JS API
- 使用 `IntersectionObserver` 或路由钩子

#### 实现

```typescript
// 组件挂载时检查容器是否可见
const observer = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting) {
    loadGoogleMaps(apiKey);
  }
});
```

## 五、成本估算

### 5.1 Google Maps 定价（参考）

> **注意**: 以下价格为参考，实际价格以 [Google Cloud 官方定价](https://cloud.google.com/maps-platform/pricing) 为准。

| API 类型 | 免费额度 | 超出后价格 |
|---------|---------|-----------|
| Maps JavaScript API | 每月 $200 免费额度 | $7/1000 次 |
| Geocoding API | 每月 $200 免费额度 | $5/1000 次 |
| Distance Matrix API | 每月 $200 免费额度 | $5/1000 次 |
| Directions API | 每月 $200 免费额度 | $5/1000 次 |
| Places Autocomplete | 每月 $200 免费额度 | $2.83/1000 次 |

### 5.2 成本优化建议

1. **充分利用缓存**: 相同查询使用缓存，避免重复调用
2. **去抖输入**: Autocomplete 使用去抖，减少无效请求
3. **批量处理**: Distance Matrix 支持批量查询，减少 API 调用次数
4. **监控告警**: 设置每日/每月调用量告警阈值
5. **降级方案**: 在 API 配额耗尽时使用直线距离估算

### 5.3 成本监控

#### 前端监控

- Debug Panel 实时显示调用统计
- 控制台日志记录每次调用

#### 后端监控

- Telemetry API 汇总所有调用
- 可按时间范围、类型、页面维度统计
- 建议集成到监控系统（如 Prometheus、Grafana）

## 六、环境变量配置

### 6.1 必需变量

```bash
# Google Maps API Key（必需）
VITE_GOOGLE_MAPS_API_KEY=your-api-key-here
```

### 6.2 可选变量

```bash
# 去抖延迟（毫秒），默认 400
VITE_GM_DEBOUNCE_MS=400

# 缓存 TTL（毫秒），默认 60000（1分钟）
VITE_GM_CACHE_TTL_MS=60000

# 会话最大调用次数，默认 200
VITE_GM_MAX_CALLS_PER_SESSION=200
```

## 七、调试与故障排查

### 7.1 启用 Debug Panel

#### 开发模式

Debug Panel 在开发模式下自动显示。

#### 生产模式

通过 URL 参数启用：

```
https://your-domain.com?debug=gm
```

### 7.2 常见问题

#### 1. 地图初始化失败

**症状**: 控制台显示 "无法创建地图实例: Object"

**排查步骤**:
1. 检查 `VITE_GOOGLE_MAPS_API_KEY` 是否设置
2. 检查 API Key 是否有效（Google Cloud Console）
3. 检查 API Key 限制（域名、IP、API 类型）
4. 查看浏览器控制台详细错误日志

**解决方案**:
- 确保 API Key 正确配置
- 检查 API Key 限制设置
- 查看 TraceId 追踪错误

#### 2. 调用次数超限

**症状**: 控制台显示 "Google Maps call limit exceeded"

**排查步骤**:
1. 查看 Debug Panel 统计
2. 检查是否有重复调用
3. 检查缓存是否生效

**解决方案**:
- 增加 `VITE_GM_MAX_CALLS_PER_SESSION`
- 优化代码减少重复调用
- 检查缓存配置

#### 3. 缓存未生效

**症状**: 相同查询仍发起 API 调用

**排查步骤**:
1. 检查 `VITE_GM_CACHE_TTL_MS` 配置
2. 查看缓存键生成逻辑
3. 检查 LRU 缓存容量

**解决方案**:
- 增加缓存 TTL
- 增加缓存容量
- 检查参数序列化一致性

## 八、最佳实践

### 8.1 代码规范

1. **统一使用服务**: 所有 Google Maps 调用必须通过 `src/services/googleMaps.ts`
2. **避免直接调用**: 禁止在前端直接调用 Google Maps REST API
3. **使用后端代理**: 敏感操作（如批量计算）通过后端代理，隐藏 API Key

### 8.2 性能优化

1. **预加载**: 在用户可能使用地图前预加载 JS API
2. **批量处理**: 多个地址解析使用批量接口
3. **延迟加载**: 非关键地图延迟加载

### 8.3 成本控制

1. **设置告警**: 在监控系统设置调用量告警
2. **定期审查**: 每周审查调用统计，识别异常
3. **优化策略**: 根据使用情况调整缓存 TTL 和去抖延迟

## 九、相关文档

- [Google Maps Platform 文档](https://developers.google.com/maps/documentation)
- [Google Maps Platform 定价](https://cloud.google.com/maps-platform/pricing)
- [TMS 项目文档](./README.md)
