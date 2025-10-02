# Google Maps API 集成产品需求文档
**项目**: TMS 物流管理系统 - Google Maps 地图服务集成  
**版本**: v1.0  
**创建时间**: 2025-10-02  
**更新时间**: 2025-10-02

---

## 📋 文档概述

### 1.1 项目背景
在现有TMS系统中集成Google Maps平台，实现完整的物流路径展示、距离/费用计算、预计到达时间（ETA）功能，提升用户体验和运营效率。

### 1.2 目标用户
- **调度员**: 可视化路径规划、司机调配
- **司机**: 实时导航、路线优化建议
- **客户**: 货物位置跟踪、ETA查看
- **管理员**: 成本分析、路径优化决策

### 1.3 项目目标
- **用户体验**: 提供直观的地图界面和路线可视化
- **运营效率**: 智能路径规划和实时ETA计算
- **成本控制**: 精确的距离/费用计算
- **数据安全**: 保护API密钥，控制调用成本

---

## 🎯 功能需求

### 2.1 核心功能模块

#### 2.1.1 地图可视化
- **地图显示**: 在运单创建、详情、车队管理页面集成地图
- **点位标记**: 自动标记取货地址、送货地址、司机/车辆位置
- **路线绘制**: 实时绘制最佳送货路线
- **实时跟踪**: 司机位置实时更新，轨迹回放

#### 2.1.2 地址智能输入
- **地址自动补全**: 提升地址输入准确性
- **地址验证**: 验证地址有效性并提供修正建议
- **多语言支持**: 支持中英文地址输入和解析

#### 2.1.3 路径规划与优化
- **多模式路线**: 支持驾驶、步行、骑行模式
- **实时交通**: 考虑实时交通状况的路线规划
- **拥堵避免**: 智能避开收费、渡口、高速公路（可选）
- **多重目的地**: 支持一位司机配送多个订单的路径优化

#### 2.1.4 距离与时间计算
- **精确里程**: 基于道路网络的真实距离计算
- **实时ETA**: 考虑交通状况的预计到达时间
- **批量计算**: 支持多起点多终点的矩阵计算
- **历史分析**: 存储历史路线数据用于分析优化

#### 2.1.5 费用计算集成
- **基础计费**: 起步价 + 超出距离费用
- **时间加成**: 高峰期、夜间、节假日费用调整
- **拥堵附加**: 基于交通拥堵情况的附加费用
- **路径优化**: 考虑成本的最优路线选择

### 2.2 页面集成点

#### 2.2.1 运单管理页面
- **运单创建**: 地图选择取/带货地址，实时计算距离和费用
- **运单详情**: 显示完整配送路线和进度跟踪
- **运单列表**: 显示每条运单的路线缩略图和ETA

#### 2.2.2 车队管理页面
- **实时地图**: 显示所有司机/车辆实时位置
- **任务分配**: 基于距离和位置的智能任务分配
- **路径监控**: 监控正在进行的配送路线执行情况

#### 2.2.3 客户管理页面
- **客户位置**: 地图显示客户分布和配送覆盖范围
- **服务区域**: 可视化服务区域和配送半径

---

## 🛠 技术规格

### 3.1 Google Maps API 使用

#### 3.1.1 前端API
- **Maps JavaScript API**: 地图显示、交互控制
- **Places API**: 地址自动补全和搜索
- **Drawing Library**: 地图标记和绘制工具

#### 3.1.2 后端API
- **Geocoding API**: 地址↔坐标双向转换
- **Directions API**: 单一路线规划和详细信息
- **Distance Matrix API**: 批量距离/时间计算
- **Roads API**: 轨迹优化和道路修正

#### 3.1.3 API调用策略
```
前端调用:
- Maps JavaScript API (免费额度内)
- Places Autocomplete (缓存 + 限制频率)

后端调用:
- Geocoding API (缓存24小时)
- Directions API (缓存1小时)
- Distance Matrix API (缓存30分钟)
```

### 3.2 系统集成架构

#### 3.2.1 前端集成
```html
<!-- 地图组件加载 -->
<script async defer src="https://maps.googleapis.com/maps/api/js?key=FRONTEND_KEY&libraries=places,drawing&callback=initMaps"></script>
```

#### 3.2.2 后端服务集成
```typescript
// 新增服务
class GoogleMapsService {
  async geocodeAddress(address: string): Promise<LatLng>
  async getDirections(params: DirectionsParams): Promise<RouteData>
  async calculateDistanceMatrix(pairs: AddressPair[]): Promise<DistanceMatrix>
  async optimizeRoute(waypoints: Waypoint[]): Promise<OptimizedRoute>
}
```

#### 3.2.3 数据库扩展
```sql
-- 地址缓存表
CREATE TABLE address_cache (
  id UUID PRIMARY KEY,
  address_hash VARCHAR(64) UNIQUE,
  formatted_address TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  place_id VARCHAR(100),
  created_at TIMESTAMP,
  expires_at TIMESTAMP
);

-- 路线缓存表
CREATE TABLE route_cache (
  id UUID PRIMARY KEY,
  route_hash VARCHAR(64) UNIQUE,
  origin_lat DECIMAL(10,8),
  origin_lng DECIMAL(11,8),
  destination_lat DECIMAL(10,8),
  destination_lng DECIMAL(11,8),
  distance_meters INTEGER,
  duration_seconds INTEGER,
  duration_in_traffic INTEGER,
  route_data JSONB,
  created_at TIMESTAMP,
  expires_at TIMESTAMP
);
```

---

## 💰 费用计算规则

### 4.1 基础计费模型
```typescript
interface PricingModel {
  basePrice: number;        // 起步价 (CAD $8.00)
  baseDistance: number;      // 起步距离 (3 km)
  unitPrice: number;         // 超出单价 (CAD $1.80/km)
  peakHours: TimeRange[];   // 高峰期定义
  peakSurcharge: number;    // 高峰期加成 (10%)
  congestionThreshold: number; // 拥堵判断阈值 (1.3x)
  congestionFee: number;    // 拥堵附加费 (CAD $3.00)
}
```

### 4.2 计费算法
```typescript
function calculateRouteCost(route: RouteData, timestamp: Date): PricingDetails {
  // 1. 基础距离计费
  const distanceKm = Math.ceil(route.distance / 100) / 10;
  let baseCost = route.basePrice;
  if (distanceKm > route.baseDistance) {
    baseCost += (distanceKm - route.baseDistance) * route.unitPrice;
  }
  
  // 2. 高峰期加成
  const isPeakHour = isWithinPeakHours(timestamp, route.peakHours);
  if (isPeakHour) {
    baseCost *= (1 + route.peakSurcharge);
  }
  
  // 3. 拥堵附加
  const trafficRatio = route.durationInTraffic / route.duration;
  if (trafficRatio > route.congestionThreshold) {
    baseCost += route.congestionFee;
  }
  
  return {
    baseCost: Math.round(baseCost * 10) / 10,  // 四舍五入到0.1元
    distanceKm,
    isPeakHour,
    hasCongestionSurcharge: trafficRatio > route.congestionThreshold,
    breakdown: generateCostBreakdown(...)
  };
}
```

### 4.3 动态定价因子
- **时段因素**: 工作日7:00-9:30, 17:00-19:30高峰期+10%
- **天气因素**: 恶劣天气+5% (预留扩展)
- **区域因素**: 偏远地区+15% (预留扩展)
- **货物因素**: 超重/危险品+20% (预留扩展)

---

## 🚀 实现方案

### 5.1 开发阶段规划

#### 阶段1: 基础地图功能 (Week 1-2)
- [ ] Google Cloud Console项目配置
- [ ] API密钥创建和安全配置
- [ ] 前端地图组件开发
- [ ] 基础地图显示和交互

#### 阶段2: 地址和路线功能 (Week 3-4)
- [ ] Places Autocomplete集成
- [ ] 地址geocoding功能
- [ ] 基础路径规划和显示
- [ ] 距离时间计算功能

#### 阶段3: 费用计算集成 (Week 5-6)
- [ ] 后端计费服务开发
- [ ] 前端费用展示组件
- [ ] 实时费用计算集成
- [ ] 缓存机制实现

#### 阶段4: 高级功能 (Week 7-8)
- [ ] 实时位置跟踪
- [ ] 路径优化算法
- [ ] 批量调配功能
- [ ] 性能优化和测试

### 5.2 UI/UX设计要求

#### 5.2.1 地图组件布局
```typescript
// 页面集成布局
<div className="map-container">
  <div className="map-sidebar">
    <form className="address-input-form">
      <PlacesAutocomplete />
    </form>
    <div className="route-info">
      <DistanceDisplay />
      <DurationDisplay />
      <CostBreakdown />
    </div>
  </div>
  <div className="google-map" id="map" />
</div>
```

#### 5.2.2 交互设计原则
- **响应式**: 在不同屏幕尺寸下自适应
- **直观性**: 清晰的图标和图例说明
- **实时反馈**: 加载状态和错误提示
- **可访问性**: 支持键盘导航和屏幕阅读器

### 5.3 性能优化策略

#### 5.3.1 缓存策略
- **地址缓存**: 24小时有效期
- **路线缓存**: 1小时有效期
- **距离矩阵缓存**: 30分钟有效性
- **缓存失效**: 基于位置精度和路况变化

#### 5.3.2 调用优化
- **批量处理**: 合并多个距离查询
- **异步加载**: 非关键地图组件延迟加载
- **请求去重**: 相同查询的参数缓存
- **错误重试**: 指数退避重试机制

---

## 🔒 安全与费用控制

### 6.1 API密钥安全
```bash
# 环境变量配置
FRONTEND_API_KEY=AIzaSyC... # 域名限制
BACKEND_API_KEY=AIzaSyD...  # IP限制
ENABLE_MAPS_FEATURES=true
MAP_CACHE_TTL=3600
```

#### 6.1.1 密钥限制策略
- **前端Key**: HTTP引用来源限制 (.yourdomain.com)
- **后端Key**: IP地址限制 (Vercel/Supabase IP段)
- **配额限制**: 每日/每月调用量上限
- **API限制**: 仅启用必需的API服务

#### 6.1.2 监控告警
```typescript
// 费用监控配置
const budgetLimits = {
  dailyLimitUSD: 50,
  monthlyLimitUSD: 1000,
  alertThresholdPercent: 80
};
```

### 6.2 费用控制清单
- [ ] Cloud Console预算设定和告警
- [ ] API调用监控和限制
- [ ] 缓存命中率优化 (>80%)
- [ ] 不必要的API调用识别和减少
- [ ] 成本分析和报告周报

---

## 🧪 测试策略

### 7.1 功能测试
- **地址解析**: 各种格式地址的解析准确性
- **路线规划**: 不同模式的路线正确性
- **费用计算**: 各种计费场景的准确性
- **缓存机制**: 缓存命中和失效的正确性

### 7.2 性能测试
- **加载性能**: 地图组件初始化时间 < 2秒
- **计算性能**: 距离计算响应时间 < 500ms
- **并发测试**: 支持100+同时在线用户
- **缓存性能**: 缓存命中率 > 85%

### 7.3 安全测试
- **密钥泄露**: API密钥不会在前端暴露
- **输入验证**: 防止恶意输入和SQL注入
- **访问控制**: 验证用户可以访问的地图范围
- **数据加密**: 敏感位置数据传输加密

---

## 📊 上线清单

### 8.1 开发完成检查
- [ ] Google Cloud Console项目创建完成
- [ ] 必需API已启用和配置
- [ ] 前端地图组件开发完成
- [ ] 后端API服务开发完成
- [ ] 地址缓存机制实现
- [ ] 费用计算算法实现
- [ ] UI集成完成 (4个主要页面)
- [ ] 单元测试覆盖率 > 90%

### 8.2 部署前检查
- [ ] API密钥安全配置验证
- [ ] 环境变量正确配置
- [ ] 数据库迁移脚本准备
- [ ] 缓存清理策略确定
- [ ] 监控和日志配置
- [ ] 备份和恢复策略

### 8.3 上线后监控
- [ ] API调用量和费用监控
- [ ] 系统性能指标监控
- [ ] 用户行为数据收集
- [ ] 错误日志实时告警
- [ ] 成本优化定期报告

---

## 🚨 风险与应对

### 9.1 主要风险点
- **API费用超支**: 无限制调用导致费用超预算
- **密钥泄露**: 前端API密钥被恶意使用
- **服务中断**: Google服务不可用时系统降级
- **性能瓶颈**: 大量同步API调用影响用户体验

### 9.2 应对措施
- **成本控制**: 严格设置配额限制和告警阈值
- **安全加固**: 多层密钥限制和监控机制
- **降级策略**: 缓存优先+第三方地图备选
- **性能优化**: 异步处理+缓存优化+CDN加速

---

## 📈 成功指标

### 10.1 业务指标
- **用户满意度**: 地图功能使用率 > 80%
- **操作效率**: 路径规划时间减少 60%
- **准确性提升**: 地址输入准确性提升至 95%+
- **成本控制**: API费用控制在预算内 (±5%)

### 10.2 技术指标
- **响应时间**: 地图加载 < 2秒，路线计算 < 500ms
- **可用性**: 系统可用性 > 99.5%
- **缓存命中率**: > 85%
- **错误率**: API调用错误率 < 1%

---

## 📝 附录

### A. 常用API参数示例
```javascript
// Directions API调用示例
const directionsParams = {
  origin: "Vancouver, BC",
  destination: "Toronto, ON", 
  mode: "driving",
  departure_time: Math.floor(Date.now() / 1000),
  traffic_model: "best_guess",
  avoid: "tolls"
};
```

### B. 错误码处理
```typescript
enum GoogleMapsErrorCode {
  INVALID_REQUEST = 'INVALID_REQUEST',
  OVER_QUERY_LIMIT = 'OVER_QUERY_LIMIT',
  REQUEST_DENIED = 'REQUEST_DENIED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}
```

### C. 合规性要求
- **数据保护**: 遵循加拿大PIPEDA数据保护法规
- **隐私政策**: 位置数据收集和使用透明化
- **数据存储**: 客户位置数据最小化收集和存储
- **数据删除**: 支持用户要求删除位置历史

---

**文档版本**: v1.0  
**最后更新**: 2025-10-02  
**审核状态**: 待审核  
**下一步行动**: 技术方案review和开发排期确认
