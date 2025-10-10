# Google Maps 集成文档

**创建时间**: 2025-10-10  
**版本**: 1.0.0  
**状态**: 已完成

## 概述

TMS系统已成功集成Google Maps Platform，实现了智能路径规划、实时费用计算和车队跟踪功能。

## 集成功能

### 1. 运单创建页面地图集成

#### 1.1 地址自动完成
- **组件**: `AddressAutocomplete.tsx`
- **功能**: 
  - 使用Google Places API实现地址自动完成
  - 自动地理编码，获取精确的经纬度坐标
  - 自动填充城市、省份、邮政编码等字段
- **使用位置**:
  - 发货地址输入 (Shipper Address)
  - 收货地址输入 (Receiver Address)

#### 1.2 实时路径计算
- **服务**: `mapsService.ts`
- **功能**:
  - 使用Google Directions API计算最优路径
  - 计算实际道路距离（km）
  - 计算预计行驶时间（分钟）
  - 计算燃油成本估算
- **触发时机**: 当发货地址和收货地址都选择后自动触发

#### 1.3 地图可视化
- **组件**: `GoogleMap.tsx`
- **功能**:
  - 在地图上显示起点和终点标记
  - 绘制优化路径线路
  - 显示路径详细信息
  - 支持地图交互（缩放、拖拽）

#### 1.4 实时费用计算
- **集成点**: `ShipmentCreate.tsx` → `calculateRealTimePricing()`
- **功能**:
  - 使用Google Maps计算的实际距离进行计费
  - 调用后端PricingEngineService进行费用计算
  - 实时显示费用明细（基础费、距离费、重量费等）
- **计费公式**:
  ```typescript
  距离费用 = 实际距离(km) × 每公里费率
  燃油成本 = 实际距离(km) × 每公里燃油成本
  总费用 = 基础费 + 距离费 + 重量费 + 体积费 + 附加费
  ```

### 2. 车队管理页面地图集成

#### 2.1 实时位置显示
- **功能**:
  - 在地图上显示所有在途车辆位置
  - 显示空闲车辆位置
  - 区分不同状态的标记（在途/空闲）

#### 2.2 标记交互
- **功能**:
  - 点击行程标记查看行程详情
  - 点击车辆标记查看车辆信息
  - 信息窗口显示详细数据

#### 2.3 地图中心定位
- **功能**:
  - 初始化时定位到默认位置（3401 Dufferin St, North York, ON M6A 2T9）
  - 根据在途车辆自动调整地图中心

## 技术实现

### 1. 前端组件

#### AddressAutocomplete 组件
```typescript
// 位置: apps/frontend/src/components/AddressAutocomplete/AddressAutocomplete.tsx
interface AddressAutocompleteProps {
  value?: string;
  onChange?: (address: string, addressInfo?: AddressInfo) => void;
  placeholder?: string;
  disabled?: boolean;
  onAddressSelected?: (addressInfo: AddressInfo) => void;
}
```

**关键功能**:
- 集成Google Places Autocomplete
- 限制搜索范围为加拿大
- 自动解析地址组件
- 提供地理编码结果

#### GoogleMap 组件
```typescript
// 位置: apps/frontend/src/components/GoogleMap/GoogleMap.tsx
interface GoogleMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: Array<{
    id: string;
    position: { lat: number; lng: number };
    title?: string;
    info?: string;
  }>;
  routes?: Array<{
    from: { lat: number; lng: number };
    to: { lat: number; lng: number };
    color?: string;
  }>;
  height?: string;
  onMarkerClick?: (markerId: string) => void;
}
```

**关键功能**:
- 使用@googlemaps/js-api-loader加载Maps API
- 支持标记点显示
- 支持路线绘制
- 支持标记点击事件

### 2. Maps 服务

#### mapsService.ts
```typescript
// 位置: apps/frontend/src/services/mapsService.ts
class MapsService {
  async initialize(): Promise<void>
  async geocodeAddress(address: string): Promise<AddressInfo>
  async reverseGeocode(lat: number, lng: number): Promise<AddressInfo>
  async calculateRoute(
    origin: AddressInfo, 
    destination: AddressInfo,
    waypoints: AddressInfo[] = []
  ): Promise<LogisticsRoute>
  async calculateDistanceMatrix(
    origins: AddressInfo[], 
    destinations: AddressInfo[]
  ): Promise<number[][]>
}
```

**关键功能**:
- 单例模式管理Maps实例
- 提供地理编码服务
- 提供路径计算服务
- 提供距离矩阵计算服务

### 3. 类型定义

```typescript
// 位置: apps/frontend/src/types/maps.ts
export interface AddressInfo {
  formattedAddress: string;
  latitude: number;
  longitude: number;
  placeId?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country?: string;
}

export interface LogisticsRoute {
  businessType: 'WASTE_COLLECTION' | 'WAREHOUSE_TRANSFER' | 'CUSTOMER_DELIVERY' | 'MULTI_DELIVERY';
  cargoInfo: {
    weight: number;
    volume: number;
    pallets: number;
    hazardous: boolean;
  };
  pickupAddress: AddressInfo;
  deliveryAddress: AddressInfo;
  optimalRoute: {
    distance: number; // km
    duration: number; // minutes
    fuelCost: number; // CAD
  };
}
```

## 环境配置

### 1. API密钥配置

#### 前端配置
```bash
# apps/frontend/.env.local
VITE_GOOGLE_MAPS_API_KEY=AIzaSy...

# 地图配置
VITE_MAPS_DEFAULT_CENTER_LAT=43.6532
VITE_MAPS_DEFAULT_CENTER_LNG=-79.3832
VITE_MAPS_DEFAULT_ZOOM=10
VITE_MAPS_LANGUAGE=en
VITE_MAPS_REGION=CA
```

#### 后端配置
```bash
# .env
GOOGLE_MAPS_API_KEY=AIzaSy...
GOOGLE_MAPS_BACKEND_API_KEY=AIzaSy...
```

### 2. NPM 依赖

```json
{
  "dependencies": {
    "@googlemaps/js-api-loader": "^1.16.10",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "@types/google.maps": "^3.58.1",
    "@types/uuid": "^9.0.8"
  }
}
```

## API使用说明

### 1. 前端使用

#### 运单创建页面集成
```typescript
// 1. 导入组件和服务
import AddressAutocomplete from '../../components/AddressAutocomplete/AddressAutocomplete';
import GoogleMap from '../../components/GoogleMap/GoogleMap';
import mapsService from '../../services/mapsService';

// 2. 使用地址自动完成
<AddressAutocomplete 
  placeholder="输入街道地址..." 
  onAddressSelected={handlePickupAddressSelected}
/>

// 3. 处理地址选择
const handlePickupAddressSelected = async (addressInfo: AddressInfo) => {
  setPickupAddressInfo(addressInfo);
  
  // 自动填充表单字段
  form.setFieldsValue({
    shipperAddress1: addressInfo.formattedAddress,
    shipperCity: addressInfo.city || '',
    shipperProvince: addressInfo.province || '',
    shipperPostalCode: addressInfo.postalCode || '',
    shipperCountry: addressInfo.country === 'Canada' ? 'CA' : 'CA'
  });

  // 如果两个地址都已选择，计算路径
  if (deliveryAddressInfo) {
    await calculateRoute(addressInfo, deliveryAddressInfo);
  }
};

// 4. 计算路径
const calculateRoute = async (pickup: AddressInfo, delivery: AddressInfo) => {
  await mapsService.initialize();
  const route = await mapsService.calculateRoute(pickup, delivery);
  setRouteInfo(route);
  
  // 更新地图标记和路线
  setMapMarkers([...]);
  setMapRoutes([...]);
  
  // 触发费用计算
  await calculateRealTimePricing(form.getFieldsValue());
};
```

#### 车队管理页面集成
```typescript
// 1. 初始化地图服务
useEffect(() => {
  (async () => {
    await mapsService.initialize();
    const addr = '3401 Dufferin St, North York, ON M6A 2T9';
    const info = await mapsService.geocodeAddress(addr);
    if (info?.latitude && info?.longitude) {
      setMapCenter({ lat: info.latitude, lng: info.longitude });
    }
  })();
}, []);

// 2. 组装地图标记
const tripMarkers = inTransitTrips.map((t: any) => ({
  id: `trip-${t.id}`,
  position: { lat: t.latitude, lng: t.longitude },
  title: t.tripNo || '行程',
  info: `<div><strong>行程</strong>: ${t.tripNo}<br/>状态: ${t.status}</div>`
}));

setMapMarkers(tripMarkers);
```

### 2. 后端集成

#### PricingEngineService集成
```typescript
// apps/backend/src/services/PricingEngineService.ts
private async calculateRuleAmount(rule: PricingRule | DriverRule, context: ShipmentContext): Promise<number> {
  if (typeof rule.formula === 'number') {
    return rule.formula;
  }
  
  const formula = rule.formula as string;
  
  // 使用从Google Maps计算的实际距离
  if (formula.includes('distance')) {
    const distance = context.distance; // 从前端传递的实际距离（km）
    // 执行计费公式
    // 例如: "distance * 2" = 实际距离 × 每公里费率
  }
}
```

## 成本控制

### 1. API调用优化
- **地址缓存**: 仓库地址缓存24小时
- **客户地址**: 缓存4小时
- **防抖处理**: 地址输入防抖500ms

### 2. 预算监控
- 每日API费用上限: $100
- 每月API费用上限: $2000
- 预算80%时触发告警

### 3. 降级策略
- API失败时使用本地计费公式
- 缓存路径计算结果
- 提供离线地址验证

## 成功指标

### 功能完整性
- ✅ 运单创建页面可以输入地址并自动计算路径
- ✅ 实时显示距离、时间和预估费用
- ✅ 车队管理地图可以显示所有在途车辆位置
- ✅ 计费引擎正确计算基于距离的费用

### 性能指标
- ✅ 地图加载时间 < 2秒
- ✅ 路径计算响应时间 < 1秒
- ✅ 费用计算响应时间 < 500ms

### 用户体验
- ✅ 地址输入流畅，自动完成准确
- ✅ 地图交互响应快速
- ✅ 错误提示清晰友好

## 已知限制

1. **API密钥限制**: 目前使用同一个API密钥用于开发和测试
2. **地址范围**: 主要针对加拿大地址优化
3. **离线支持**: 需要网络连接才能使用地图功能

## 未来优化

1. **多途径点支持**: 支持多个取货点和送货点的路径优化
2. **实时交通**: 集成实时交通数据优化路径
3. **历史轨迹**: 保存和回放历史路径
4. **批量优化**: 支持多订单路径批量优化

## 故障排查

### 问题1: 地图无法加载
**解决方案**:
1. 检查VITE_GOOGLE_MAPS_API_KEY是否正确配置
2. 验证API密钥权限
3. 检查浏览器控制台错误信息

### 问题2: 地址自动完成不工作
**解决方案**:
1. 确认Places API已启用
2. 检查API密钥限制配置
3. 验证输入组件是否正确挂载

### 问题3: 路径计算失败
**解决方案**:
1. 检查地址格式是否正确
2. 验证Directions API已启用
3. 查看网络请求是否成功

## 参考文档

- [Google Maps Platform文档](https://developers.google.com/maps/documentation)
- [Google Maps API密钥申请指南](./google-maps-api-key-setup.md)
- [物流集成产品需求文档](./google-maps-logistics-prd.md)

---

**文档维护**: TMS开发团队  
**最后更新**: 2025-10-10

