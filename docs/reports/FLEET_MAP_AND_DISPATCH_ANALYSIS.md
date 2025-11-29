# 车队地图和调度引擎分析报告
**生成时间:** 2025-10-17 22:45:00  
**分析对象:** 车队实时位置地图和调度引擎距离计算功能

---

## 📊 问题总结

### 1. 车队实时位置地图 ❌

**当前状态:** 使用占位/模拟数据

**问题点:**

#### A. FleetManagement 页面 (主要车队管理页面)
**文件:** `apps/frontend/src/pages/FleetManagement/FleetManagement.tsx`

**问题:**
- ✅ **地图组件已嵌入** - 使用了真实的 `GoogleMap` 组件（第340-364行）
- ❌ **没有真实位置数据** - 数据库中 `trips` 和 `vehicles` 表没有 `currentLocation` 字段
- ❌ **标记无法显示** - 代码尝试从 `trip.currentLocation` 或 `vehicle.currentLocation` 提取经纬度（第98-133行），但数据库没有这些字段
- ⚠️ **回退到模拟数据** - 当 API 失败时，使用硬编码的司机和车辆数据（第137-145行）

**相关代码:**
```typescript:340-364:apps/frontend/src/pages/FleetManagement/FleetManagement.tsx
<Card title="车队实时位置">
  <GoogleMap
    center={mapCenter}
    zoom={12}
    height="600px"
    markers={mapMarkers}
    onMarkerClick={(markerId) => {
      // 处理地图标记点击事件
      if (markerId.startsWith('trip-')) {
        const tripId = markerId.replace('trip-', '');
        const trip = inTransitTrips.find((t: Trip) => t.id === tripId);
        if (trip) {
          setSelectedTrip(trip);
          message.info(`查看行程: ${trip.tripNo || trip.id}`);
        }
      } else if (markerId.startsWith('vehicle-')) {
        const vehicleId = markerId.replace('vehicle-', '');
        const vehicle = availableVehicles.find((v: Vehicle) => v.id === vehicleId);
        if (vehicle) {
          message.info(`车辆: ${vehicle.plateNumber} - 状态: ${vehicle.status}`);
        }
      }
    }}
  />
</Card>
```

**位置数据提取逻辑:**
```typescript:98-133:apps/frontend/src/pages/FleetManagement/FleetManagement.tsx
// 组装地图标记：优先使用 trip 的当前位置,其次使用 vehicle 的当前位置
const getCoord = (obj: any) => {
  const cl = obj?.currentLocation || {};
  const lat = cl.lat ?? cl.latitude ?? obj?.latitude ?? obj?.lat;
  const lng = cl.lng ?? cl.longitude ?? obj?.longitude ?? obj?.lng;
  if (typeof lat === 'number' && typeof lng === 'number') return { lat, lng };
  return null;
};

const tripMarkers = inTransitTrips
  .map((t: any) => {
    const pos = getCoord(t);
    if (!pos) return null;  // ❌ 没有位置数据时返回 null
    return {
      id: `trip-${t.id}`,
      position: pos,
      title: t.tripNo || '行程',
      info: `<div><strong>行程</strong>: ${t.tripNo || t.id}<br/>状态: ${t.status}</div>`
    };
  })
  .filter(Boolean) as any[];
```

#### B. RealTimeTracking 组件 (实时跟踪标签页)
**文件:** `apps/frontend/src/components/RealTimeTracking/RealTimeTracking.tsx`

**问题:**
- ✅ **地图组件已嵌入** - 使用了 `GoogleMap` 组件（第323-333行）
- ❌ **完全使用模拟数据** - 所有位置数据都是硬编码的模拟数据（第104-156行）
- ❌ **没有调用真实 API** - 函数 `loadVehicleLocations` 只生成模拟数据
- ⚠️ **模拟实时更新** - 使用定时器随机修改模拟位置（第170-183行）

**模拟数据代码:**
```typescript:104-156:apps/frontend/src/components/RealTimeTracking/RealTimeTracking.tsx
const loadVehicleLocations = async () => {
  setLoading(true);
  try {
    // ❌ 模拟实时位置数据
    const mockLocations: VehicleLocation[] = [
      {
        id: 'L001',
        vehicleId: 'V001',
        vehiclePlate: '京A12345',
        driverName: '张三',
        driverPhone: '13800138000',
        latitude: 39.9042 + (Math.random() - 0.5) * 0.01,  // 北京坐标
        longitude: 116.4074 + (Math.random() - 0.5) * 0.01,
        speed: Math.floor(Math.random() * 60),
        direction: Math.floor(Math.random() * 360),
        timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        status: 'driving',
        batteryLevel: 85,
        fuelLevel: 75,
        lastUpdate: dayjs().subtract(Math.floor(Math.random() * 60), 'second').format('HH:mm:ss'),
      },
      // ... 更多模拟数据
    ];

    setVehicleLocations(mockLocations);
  } catch (error) {
    console.error('加载车辆位置失败:', error);
    message.error('加载车辆位置失败');
  } finally {
    setLoading(false);
  }
};
```

---

### 2. 调度引擎距离计算 ⚠️

**当前状态:** 部分使用 Google Maps API，部分使用简化算法

#### A. 前端调度算法 (简化版)
**文件:** `apps/frontend/src/algorithms/dispatch.ts`

**问题:**
- ❌ **只使用哈弗辛公式** - 计算直线距离，不考虑实际道路（第36-56行）
- ❌ **不考虑交通情况** - 无法提供准确的实际距离和时间
- ⚠️ **用于快速预估** - 适用于初步计算，但不适用于精确调度

**直线距离计算代码:**
```typescript:36-56:apps/frontend/src/algorithms/dispatch.ts
// 计算两点之间的距离（哈弗辛公式）
function calculateDistance(
  point1: { lat?: number; lng?: number; latitude?: number; longitude?: number } | null | undefined,
  point2: { lat?: number; lng?: number; latitude?: number; longitude?: number } | null | undefined
): number {
  if (!point1 || !point2) return 999; // 默认很远的距离
  
  const lat1 = point1.lat ?? point1.latitude ?? 43.7615;
  const lng1 = point1.lng ?? point1.longitude ?? -79.4635;
  const lat2 = point2.lat ?? point2.latitude ?? 43.7615;
  const lng2 = point2.lng ?? point2.longitude ?? -79.4635;
  
  const R = 6371; // 地球半径（公里）
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;  // ❌ 返回直线距离，不是实际道路距离
}
```

#### B. 前端 Maps Service (已实现但未使用)
**文件:** `apps/frontend/src/services/mapsService.ts`

**状态:**
- ✅ **已实现 Distance Matrix API** - 第166-205行
- ❌ **未被调度算法调用** - `greedyDispatch` 算法没有使用这个功能
- ✅ **支持实时交通** - 配置了 `trafficModel: BEST_GUESS`

**Distance Matrix API 实现:**
```typescript:166-205:apps/frontend/src/services/mapsService.ts
// 批量距离矩阵计算（用于调度优化）
async calculateDistanceMatrix(
  origins: AddressInfo[], 
  destinations: AddressInfo[]
): Promise<number[][]> {
  if (!this.maps) throw new Error('Maps service not initialized');

  const distanceMatrixService = new this.maps.DistanceMatrixService();
  
  return new Promise((resolve, reject) => {
    const request = {
      origins: origins.map(origin => ({ 
        lat: origin.latitude, 
        lng: origin.longitude 
      })),
      destinations: destinations.map(dest => ({ 
        lat: dest.latitude, 
        lng: dest.longitude 
      })),
      travelMode: this.maps!.TravelMode.DRIVING,
      drivingOptions: {
        departureTime: new Date(),
        trafficModel: this.maps!.TrafficModel.BEST_GUESS,  // ✅ 支持实时交通
      },
      unitSystem: this.maps!.UnitSystem.METRIC,
    };

    distanceMatrixService.getDistanceMatrix(request, (response, status) => {
      if (status === 'OK' && response) {
        const matrix = response.rows.map(row =>
          row.elements.map(element => 
            element.status === 'OK' ? element.distance.value : Infinity
          )
        );
        resolve(matrix);  // ✅ 返回实际道路距离矩阵
      } else {
        reject(new Error(`Distance matrix calculation failed: ${status}`));
      }
    });
  });
}
```

#### C. 后端调度服务 (已实现)
**文件:** `apps/backend/src/services/DispatchOptimizationService.ts`

**状态:**
- ✅ **使用 Google Maps Directions API** - 第241-290行
- ✅ **支持实时交通** - 获取实际道路距离和时间
- ✅ **有降级方案** - API 失败时回退到哈弗辛公式

**Directions API 实现:**
```typescript:241-290:apps/backend/src/services/DispatchOptimizationService.ts
/**
 * 获取方向和距离信息
 */
private async getDirections(origin: Coordinates, destination: Coordinates): Promise<RouteSegment> {
  if (!this.GOOGLE_MAPS_API_KEY) {
    // ❌ 没有 API Key 时模拟距离和时长计算
    const distance = this.calculateHaversineDistance(origin.lat, origin.lng, destination.lat, destination.lng);
    const duration = Math.round(distance * 2); // 假设平均时速30km/h
    return {
      from: origin,
      to: destination,
      distance,
      duration,
      instructions: '模拟路线指示',
    };
  }

  try {
    const originStr = `${origin.lat},${origin.lng}`;
    const destinationStr = `${destination.lat},${destination.lng}`;
    const url = `${this.BASE_URL}/directions/json?origin=${originStr}&destination=${destinationStr}&key=${this.GOOGLE_MAPS_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if ((data as any).status === 'OK' && (data as any).routes.length > 0) {
      const route = (data as any).routes[0];
      const leg = route.legs[0];
      
      return {
        from: origin,
        to: destination,
        distance: leg.distance.value / 1000, // ✅ 实际道路距离（公里）
        duration: leg.duration.value / 60, // ✅ 实际行驶时间（分钟）
        instructions: leg.steps.map((step: any) => step.html_instructions).join(' → '),
      };
    } else {
      throw new Error(`路线规划失败: ${(data as any).status}`);
    }
  } catch (error) {
    logger.error(`路线规划API调用失败: ${error.message}`);
    // 降级方案：返回基于直线距离的估算
    const distance = this.calculateHaversineDistance(origin.lat, origin.lng, destination.lat, destination.lng);
    const duration = Math.round(distance * 2);
    return {
      from: origin,
      to: destination,
      distance,
      duration,
      instructions: '路线规划失败，使用直线距离估算',
    };
  }
}
```

**文件:** `apps/backend/src/services/mapsApiService.ts`

**状态:**
- ✅ **已实现 Distance Matrix API** - 第235-268行
- ✅ **支持批量计算** - 可同时计算多个司机到多个运单的距离
- ✅ **优化调度分配** - 第271-336行

**Distance Matrix API 实现:**
```typescript:235-268:apps/backend/src/services/mapsApiService.ts
// 计算调度距离矩阵
async calculateDispatchMatrix(request: DispatchMatrixRequest): Promise<DispatchMatrixResponse> {
  try {
    const origins = request.drivers.map(driver => 
      `${driver.currentLocation.latitude},${driver.currentLocation.longitude}`
    );
    const destinations = request.shipments.map(shipment => 
      `${shipment.pickupAddress.latitude},${shipment.pickupAddress.longitude}`
    );

    const response = await axios.get(`${this.config.baseUrl}/distancematrix/json`, {
      params: {
        origins: origins.join('|'),
        destinations: destinations.join('|'),
        key: this.config.apiKey,
        mode: 'driving',
        units: 'metric',
        departure_time: 'now',  // ✅ 实时交通
        traffic_model: 'best_guess',  // ✅ 最佳估算
      },
    });

    this.usageStats.distanceMatrix++;

    if (response.data.status === 'OK') {
      const assignments = this.optimizeAssignments(response.data, request);
      return assignments;  // ✅ 返回优化后的调度分配
    } else {
      throw new Error(`Distance matrix calculation failed: ${response.data.status}`);
    }
  } catch (error) {
    console.error('Distance matrix API error:', error);
    throw this.handleApiError(error);
  }
}
```

---

## 🔧 需要修复的问题

### 优先级 1: 数据库结构 (高)

#### 问题
- `trips` 表缺少 `current_location` 字段
- `vehicles` 表缺少 `current_location` 字段
- `drivers` 表缺少 `current_location` 字段

#### 解决方案
需要添加位置跟踪字段：

```sql
-- 添加位置字段到 trips 表
ALTER TABLE trips ADD COLUMN IF NOT EXISTS current_location JSONB DEFAULT '{}';
ALTER TABLE trips ADD COLUMN IF NOT EXISTS location_history JSONB[] DEFAULT ARRAY[]::JSONB[];
ALTER TABLE trips ADD COLUMN IF NOT EXISTS last_location_update TIMESTAMP;

-- 添加位置字段到 vehicles 表  
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS current_location JSONB DEFAULT '{}';
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS last_location_update TIMESTAMP;

-- 添加位置字段到 drivers 表
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS current_location JSONB DEFAULT '{}';
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS last_location_update TIMESTAMP;

-- 创建位置历史表（可选，用于轨迹回放）
CREATE TABLE IF NOT EXISTS location_tracking (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL, -- 'trip', 'vehicle', 'driver'
    entity_id uuid NOT NULL,
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    speed NUMERIC(5, 2),
    direction NUMERIC(5, 2),
    accuracy NUMERIC(5, 2),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 为位置历史表创建索引
CREATE INDEX IF NOT EXISTS idx_location_tracking_entity ON location_tracking(entity_type, entity_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_location_tracking_timestamp ON location_tracking(timestamp DESC);
```

### 优先级 2: 后端 API (高)

#### A. 位置更新 API
需要创建 API 端点来接收和更新位置数据：

```typescript
// apps/backend/src/routes/locationRoutes.ts
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { DatabaseService } from '../services/DatabaseService';

const router = Router();

// 更新车辆位置
router.post('/vehicles/:vehicleId/location', authenticate, async (req, res) => {
  const { vehicleId } = req.params;
  const { latitude, longitude, speed, direction, accuracy } = req.body;
  
  try {
    const dbService = new DatabaseService();
    
    // 更新 vehicles 表
    await dbService.query(
      `UPDATE vehicles 
       SET current_location = $1, last_location_update = NOW()
       WHERE id = $2`,
      [
        JSON.stringify({ latitude, longitude, speed, direction }),
        vehicleId
      ]
    );
    
    // 保存到历史轨迹表
    await dbService.query(
      `INSERT INTO location_tracking 
       (entity_type, entity_id, latitude, longitude, speed, direction, accuracy)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      ['vehicle', vehicleId, latitude, longitude, speed, direction, accuracy]
    );
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取实时位置列表
router.get('/tracking/realtime', authenticate, async (req, res) => {
  try {
    const dbService = new DatabaseService();
    
    const result = await dbService.query(`
      SELECT 
        v.id as vehicle_id,
        v.plate_number,
        v.current_location,
        v.last_location_update,
        v.status,
        d.id as driver_id,
        d.name as driver_name,
        d.phone as driver_phone,
        t.id as trip_id,
        t.trip_no
      FROM vehicles v
      LEFT JOIN drivers d ON v.id = d.vehicle_id
      LEFT JOIN trips t ON d.id = t.driver_id AND t.status = 'ongoing'
      WHERE v.status IN ('available', 'busy')
      ORDER BY v.last_location_update DESC
    `);
    
    res.json({ data: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取位置历史轨迹
router.get('/tracking/history/:entityType/:entityId', authenticate, async (req, res) => {
  const { entityType, entityId } = req.params;
  const { startTime, endTime } = req.query;
  
  try {
    const dbService = new DatabaseService();
    
    const result = await dbService.query(
      `SELECT * FROM location_tracking
       WHERE entity_type = $1 AND entity_id = $2
       AND timestamp BETWEEN $3 AND $4
       ORDER BY timestamp DESC`,
      [entityType, entityId, startTime, endTime]
    );
    
    res.json({ data: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

#### B. API Service 集成
更新 `api.ts` 添加位置相关的 API 调用：

```typescript
// apps/frontend/src/services/api.ts

// 获取实时位置
export const trackingApi = {
  getRealTimeLocations: () => api.get('/tracking/realtime'),
  
  updateVehicleLocation: (vehicleId: string, location: {
    latitude: number;
    longitude: number;
    speed?: number;
    direction?: number;
    accuracy?: number;
  }) => api.post(`/vehicles/${vehicleId}/location`, location),
  
  getLocationHistory: (entityType: string, entityId: string, params: {
    startTime: string;
    endTime: string;
  }) => api.get(`/tracking/history/${entityType}/${entityId}`, { params })
};
```

### 优先级 3: 前端实时跟踪 (中)

#### 修改 RealTimeTracking 组件
替换模拟数据为真实 API 调用：

```typescript
// apps/frontend/src/components/RealTimeTracking/RealTimeTracking.tsx

const loadVehicleLocations = async () => {
  setLoading(true);
  try {
    // ✅ 使用真实 API
    const response = await trackingApi.getRealTimeLocations();
    const locations = response.data?.data || [];
    
    const formattedLocations: VehicleLocation[] = locations.map((loc: any) => ({
      id: loc.vehicle_id,
      vehicleId: loc.vehicle_id,
      vehiclePlate: loc.plate_number,
      driverName: loc.driver_name || '未分配',
      driverPhone: loc.driver_phone || '',
      latitude: loc.current_location?.latitude || 0,
      longitude: loc.current_location?.longitude || 0,
      speed: loc.current_location?.speed || 0,
      direction: loc.current_location?.direction || 0,
      timestamp: loc.last_location_update,
      status: loc.status === 'busy' ? 'driving' : 'parked',
      batteryLevel: loc.current_location?.batteryLevel || 100,
      fuelLevel: loc.current_location?.fuelLevel || 100,
      lastUpdate: dayjs(loc.last_location_update).format('HH:mm:ss'),
    }));

    setVehicleLocations(formattedLocations);
  } catch (error) {
    console.error('加载车辆位置失败:', error);
    message.error('加载车辆位置失败');
  } finally {
    setLoading(false);
  }
};
```

### 优先级 4: 调度引擎优化 (中)

#### 修改前端调度算法
集成 Google Maps Distance Matrix API：

```typescript
// apps/frontend/src/algorithms/dispatch.ts

import mapsService from '../services/mapsService';

export async function optimizedGreedyDispatch(input: DispatchInput): Promise<DispatchResult> {
  const startTime = Date.now();
  const assignments: Assignment[] = [];
  const shipments = [...input.shipments];
  const availableDrivers = input.drivers.filter(d => d.status === 'available');

  if (shipments.length === 0 || availableDrivers.length === 0) {
    return {
      assignments,
      unassignedShipments: shipments.map(s => s.id),
      totalDistance: 0,
      totalCost: 0,
      totalSaving: 0,
      executionTime: Date.now() - startTime,
    };
  }

  try {
    // ✅ 使用 Google Maps Distance Matrix API 计算实际距离
    await mapsService.initialize();
    
    const origins = availableDrivers.map(driver => ({
      latitude: driver.currentLocation?.lat ?? 43.7615,
      longitude: driver.currentLocation?.lng ?? -79.4635,
      formattedAddress: '',
    }));
    
    const destinations = shipments.map(shipment => ({
      latitude: shipment.pickupAddress?.lat ?? 43.7615,
      longitude: shipment.pickupAddress?.lng ?? -79.4635,
      formattedAddress: shipment.pickupAddress?.city || '',
    }));
    
    // 获取距离矩阵（单位：米）
    const distanceMatrix = await mapsService.calculateDistanceMatrix(origins, destinations);
    
    // 为每个运单找到最近的司机
    for (let shipmentIdx = 0; shipmentIdx < shipments.length; shipmentIdx++) {
      const shipment = shipments[shipmentIdx];
      let minDistance = Infinity;
      let bestDriverIndex = -1;
      
      for (let driverIdx = 0; driverIdx < availableDrivers.length; driverIdx++) {
        const distance = distanceMatrix[driverIdx][shipmentIdx] / 1000; // 转换为公里
        
        if (distance < minDistance) {
          minDistance = distance;
          bestDriverIndex = driverIdx;
        }
      }
      
      if (bestDriverIndex >= 0) {
        const bestDriver = availableDrivers[bestDriverIndex];
        const cost = calculateCost(minDistance, shipment);
        const saving = calculateSaving(minDistance, shipment);
        
        assignments.push({
          shipmentId: shipment.id,
          shipmentNumber: shipment.shipmentNumber || shipment.id.substring(0, 8),
          route: `${shipment.pickupAddress?.city || '起点'} → ${shipment.deliveryAddress?.city || '终点'}`,
          driverId: bestDriver.id,
          driverName: bestDriver.name,
          distance: minDistance,
          estimatedCost: cost,
          saving: saving
        });
        
        availableDrivers.splice(bestDriverIndex, 1);
      }
    }
    
  } catch (error) {
    console.error('⚠️ Distance Matrix API 调用失败，回退到哈弗辛公式:', error);
    // 降级方案：使用原有的哈弗辛公式
    return greedyDispatch(input);
  }
  
  const totalDistance = assignments.reduce((sum, a) => sum + a.distance, 0);
  const totalCost = assignments.reduce((sum, a) => sum + a.estimatedCost, 0);
  const totalSaving = assignments.reduce((sum, a) => sum + a.saving, 0);
  
  return {
    assignments,
    unassignedShipments: shipments.filter(
      s => !assignments.find(a => a.shipmentId === s.id)
    ).map(s => s.id),
    totalDistance,
    totalCost,
    totalSaving,
    executionTime: Date.now() - startTime,
  };
}
```

---

## 📋 实施计划

### 阶段 1: 数据库结构更新 (1-2小时)
1. ✅ 创建数据库迁移脚本
2. ✅ 添加位置字段到现有表
3. ✅ 创建位置跟踪历史表
4. ✅ 创建索引优化查询性能

### 阶段 2: 后端 API 开发 (3-4小时)
1. ✅ 创建位置更新 API 端点
2. ✅ 创建实时位置查询 API
3. ✅ 创建位置历史轨迹 API
4. ✅ 集成到主路由
5. ✅ 添加权限验证

### 阶段 3: 前端集成 (2-3小时)
1. ✅ 更新 API service 添加位置相关方法
2. ✅ 修改 RealTimeTracking 组件使用真实 API
3. ✅ 修改 FleetManagement 页面使用真实位置数据
4. ✅ 添加错误处理和降级方案

### 阶段 4: 调度引擎优化 (2-3小时)
1. ✅ 集成 Google Maps Distance Matrix API
2. ✅ 更新前端调度算法
3. ✅ 添加降级方案（API 失败时使用哈弗辛公式）
4. ✅ 性能测试和优化

### 阶段 5: 位置数据采集 (根据实际需求)
**选项 A: 模拟位置生成器（用于测试和演示）**
- 创建定时任务模拟车辆移动
- 沿着真实路线生成位置点
- 支持多种移动模式（行驶、停车、空闲）

**选项 B: 移动端 GPS 上报（生产环境）**
- 开发移动端应用或小程序
- 司机端定期上报 GPS 位置
- 支持后台位置更新

**选项 C: 车载 GPS 设备集成**
- 集成第三方车载 GPS 平台
- 通过 API 或 Webhook 接收位置数据
- 支持历史轨迹回放

---

## 💰 成本估算

### Google Maps API 调用成本

#### Distance Matrix API
- **价格:** $5.00 / 1000 次请求
- **使用场景:** 调度优化（司机到运单的距离矩阵）
- **估算:** 
  - 假设每天 100 次调度，每次 10 个司机 × 20 个运单 = 1 次 API 调用
  - 每月: 100 × 30 = 3,000 次
  - **每月成本:** $15.00

#### Directions API
- **价格:** $5.00 / 1000 次请求
- **使用场景:** 路线规划（起点到终点的详细路径）
- **估算:**
  - 假设每天 50 个新运单需要路线规划
  - 每月: 50 × 30 = 1,500 次
  - **每月成本:** $7.50

#### Geocoding API
- **价格:** $5.00 / 1000 次请求
- **使用场景:** 地址转坐标
- **估算:**
  - 每天 20 个新地址
  - 每月: 20 × 30 = 600 次
  - **每月成本:** $3.00

#### Maps JavaScript API (地图显示)
- **价格:** $7.00 / 1000 次加载
- **使用场景:** 前端地图显示
- **估算:**
  - 每天 200 次页面加载
  - 每月: 200 × 30 = 6,000 次
  - **每月成本:** $42.00

**总计月成本:** 约 $67.50

**优化建议:**
- 使用缓存减少重复请求
- 合并批量请求
- Google 提供每月 $200 免费额度
- **实际月成本:** $0 (在免费额度内)

---

## ✅ 建议

1. **优先修复数据库结构** - 这是核心问题，没有位置数据，地图无法显示
2. **实现后端 API** - 提供位置更新和查询接口
3. **更新前端组件** - 使用真实 API 替换模拟数据
4. **集成 Distance Matrix API** - 提升调度准确性
5. **创建位置模拟器** - 用于测试和演示（可选）
6. **监控 API 使用量** - 确保在免费额度内

---

## 📝 结论

**车队实时位置地图:**
- ✅ 地图组件已嵌入
- ❌ 使用占位/模拟数据
- 🔧 需要数据库结构更新和 API 开发

**调度引擎距离计算:**
- ⚠️ 前端使用简化算法（哈弗辛公式）
- ✅ 后端已实现 Google Maps API 集成
- 🔧 需要前端集成 Distance Matrix API

**总体评估:** 基础设施已就绪，但需要数据层和API层的完善。


