# Google Maps API 物流集成产品需求文档
**项目**: TMS 3PL/4PL 物流管理系统 - Google Maps 智能调度集成  
**版本**: v2.0 (物流优化版)  
**创建时间**: 2025-10-02  
**更新时间**: 2025-10-02

---

## 📋 文档概述

### 1.1 项目背景
作为3PL（第三方物流）和4PL（第四方物流）公司，我们需要在TMS系统中集成Google Maps来优化：
- **车队调度**: 智能分配司机/车辆到运单
- **路径规划**: 多地点配送和仓库转运最优化路径
- **成本控制**: 精确距离计算和燃油成本管理
- **效率提升**: 减少空车率和等待时间

### 1.2 核心业务场景分析

#### 🔍 **实际业务场景**（基于你的代码分析）：
1. **垃圾清运**: `WH_07仓库 → 垃圾填埋场 → 返回`
2. **仓库转运**: `内部仓库 → 第三方仓库（如亚马逊YYZ9）`
3. **客户直运**: `客户地址 → 最终目的地`
4. **多订单配送**: `一个司机/车辆配送多个运单`

#### 🎯 **关键差异点**：
- **B2B物流**，不是乘客运输
- **货物重量体积**是定价重要因素（不仅是距离）
- **仓库预约时间**和装卸效率至关重要
- **往返路径优化**，特别是垃圾清运和仓库间转运
- **多订单捆绑**，提高单车装载率

---

## 🏗 物流业务集成架构

### 2.1 核心业务流集成

#### 2.1.1 运单创建时的路径计算
```typescript
// 物流运单路径计算
interface LogisticsRoute {
  // 基础信息
  shipmentId: string;
  customerId: string;
  cargoInfo: {
    weight: number;
    volume: number;
    pallets: number;
    hazardous: boolean;
  };
  pickupAddress: AddressInfo;
  deliveryAddress: AddressInfo;
  
  // 物流特定
  warehouseId?: string;        // 仓库ID
  requiresAppointment: boolean; // 预约要求
  appointmentTime?: string;    // 预约时间
  waitingTimeLimit: number;    // 等待时间限制
  
  // 路径优化结果
  optimalRoute: {
    distance: number;           // 实际道路距离（km）
    duration: number;           // 预计行驶时间（分钟）
    fuelCost: number;          // 燃油成本（CAD）
    tolls?: number;            // 过路费
    returnRoute?: RouteInfo;   // 返程路径（仓储业务）
  };
}
```

#### 2.1.2 调度优化集成
```typescript
// 调度优化算法
class LogisticsDispatchOptimization {
  async findOptimalAssignment(shipments: Shipment[], drivers: Driver[]): Promise<Assignment[]> {
    // 1. 根据货物重量/体积选择合适的车辆类型
    // 2. 考虑司机当前位置到取货点的距离
    // 3. 计算配送路径和返程成本
    // 4. 考虑预约时间和等待成本
    // 5. 优化多订单捆绑路径
  }
}
```

### 2.2 Google Maps API 针对性集成

#### 2.2.1 物流专用API组合
```typescript
interface LogisticsMapsIntegration {
  // 核心API
  geocoding: {
    warehouseAddresses: 'API缓存24h';     // 仓库地址固定
    customerAddresses: 'API缓存4h';       // 客户地址定期更新
  };
  
  directions: {
    singleRoute: '实时计算';              // 新运单路径规划
    multiWaypoint: '优化算法';            // 多订单配送优化
    returnRoute: '往返成本';              // 仓储业务返程优化
  };
  
  distanceMatrix: {
    batchAssignment: '批量调度';          // 多司机多运单矩阵计算
    realTimeRouting: '动态重优化';       // 基于实际交通状况
  };
  
  places: {
    warehouseLookup: '仓库信息';           // 仓库POI和营业时间
    deliveryRestrictions: '配送限制';     // 客户区域限行政策
  };
}
```

#### 2.2.2 业务逻辑集成点

**1. 运单创建页面**：
- 输入收货地址 → Google Places 验证和补全
- 自动计算仓库到客户/客户到仓库的距离
- 实时估算运输成本和ETA

**2. 车队管理页面**：
- 可视化显示所有司机/车辆位置
- 显示在途运单的实际路径和执行状态
- 智能推荐调度方案

**3. 调度决策**：
- 算法自动推荐最优司机分配
- 考虑司机当前位置、车辆容量、预约时间
- 路径优化，特别是垃圾转运和仓库间运输

---

## 🚛 物流业务场景实现

### 3.1 垃圾清运场景 ✅
```typescript
// 垃圾清运路径规划
interface WasteCollectionRoute {
  pickup: WarehouseInfo;        // WH_07仓库
  delivery: LandfillInfo;        // 垃圾填埋场
  cargo: {                       // 垃圾纸皮
    type: 'RECYCLABLE_WASTE';
    weight: number;
    volume: number;
  };
  route: {
    outbound: RouteSegment;      // 仓库→填埋场
    inbound: RouteSegment;       // 填埋场→仓库
    totalCost: number;          // 燃油+时间成本
  };
}
```

**Google Maps集成**：
- **仓库定位**: `Geocoding API` 精确定位WH_07仓库
- **往返路径**: `Directions API` 计算往返最优路径
- **成本计算**: 基于距离+燃油费+司机时间成本

### 3.2 仓库转运场景 ✅
```typescript
// 仓库转运路径规划
interface WarehouseTransferRoute {
  pickup: { 
    warehouse: 'WH_07'; 
    requiresAppointment: true; 
    appointmentTime: '09:00';
  };
  delivery: { 
    warehouse: 'AMZ_YYZ9'; 
    requiredBy: '19:00';
  };
  cargo: {
    pallets: number;             // 托盘数量是关键
    estimatedVolume: number;
    waitingTimeLimit: number;    // 装卸等待时间
  };
}
```

**Google Maps集成**：
- **预约优化**: 考虑高速公路早晚高峰，避开17:00-19:00拥堵
- **等待成本**: 计算在仓库装卸的等待时间成本
- **时效保障**: 确保在19:00前送达亚马逊仓库

### 3.3 客户直运场景 ✅
```typescript
// 客户直运路径规划
interface DirectDeliveryRoute {
  pickup: CustomerAddress;      // 客户仓库/地址
  delivery: DeliveryAddress;    // 最终收货地址
  cargo: CustomerCargoInfo;    // 客户货物信息
  customerLevel: 'VIP' | 'Priority' | 'Standard';
  pricing: DeliveryPricing;     // 基于等级的定价
}
```

**Google Maps集成**：
- **实时定价**: 根据距离和客户等级动态计算价格
- **路径效率**: 优化配送路径，减少客户的等待成本
- **服务区域**: 验证配送地址是否在服务范围内

### 3.4 多订单捆绑配送 ✅
```typescript
// 多订单路径优化
interface MultiOrderRoute {
  orders: ShipmentOrder[];      // 多个运单
  vehicle: VehicleCapacity;
  driver: DriverInfo;
  optimizedRoute: {
    pickupSequence: Address[];   // 最优取货顺序
    deliverySequence: Address[]; // 最优配送顺序
    totalDistance: number;
    totalTime: number;
    costSavings: number;        // 相对于单独配送的节省
  };
}
```

**Google Maps集成**：
- **路径优化**: `Directions API` 多目标优化
- **时间窗约束**: 考虑各运单的时间要求
- **装载优化**: 确保路径符合车辆容量限制

---

## 🔧 技术实现细节

### 4.1 前端地图界面

#### 4.1.1 运单创建页面
```tsx
// 运单创建时的地图集成
const ShipmentCreateWithMap: React.FC = () => {
  return (
    <div className="shipment-create-layout">
      <div className="address-input-section">
        <AddressInputWithAutocomplete 
          label="取货地址"
          onAddressChange={handlePickupAddressChange}
        />
        <AddressInputWithAutocomplete 
          label="送货地址" 
          onAddressChange={handleDeliveryAddressChange}
        />
      </div>
      
      <div className="map-preview-section">
        <LogisticsMap
          pickupAddress={formData.pickup}
          deliveryAddress={formData.delivery}
          routeDetails={estimatedRoute}
          showCostBreakdown={true}
          onTap={setSelectedLocation}
        />
      </div>
      
      <div className="cost-calculation-section">
        <RouteCostBreakdown 
          distance={estimatedRoute.distance}
          duration={estimatedRoute.duration}
          fuelCost={estimatedRoute.fuelCost}
          driverCost={estimatedRoute.driverCost}
          customerLevel={formData.customerLevel}
        />
      </div>
    </div>
  );
};
```

#### 4.1.2 车队管理页面
```tsx
// 车队管理的实时地图
const FleetManagementMap: React.FC = () => {
  return (
    <div className="fleet-dashboard">
      <div className="driver-vehicle-list">
        <DriverVehicleList 
          drivers={currentDrivers}
          vehicles={availableVehicles}
          assignments={activeAssignments}
        />
      </div>
      
      <div className="real-time-map">
        <LogisticsTrackingMap
          shipments={inTransitShipments}    // 在途运单
          drivers={activeDrivers}           // 活跃司机位置
          vehicles={activeVehicles}         // 车辆位置
          showOptimizedRoutes={true}        // 显示优化路径
          realTimeTraffic={true}           // 实时交通状况
        />
      </div>
      
      <div className="dispatch-panel">
        <IntelligentDispatchPanel 
          pendingShipments={pendingShipments}
          availableDrivers={availableDrivers}
          onAssign={handleAutoAssignment}
          showCostAnalysis={true}
        />
      </div>
    </div>
  );
};
```

### 4.2 后端调度优化服务

#### 4.2.1 智能调度算法
```typescript
// 物流调度优化服务
class LogisticsDispatchService {
  async optimizeAssignments(shipments: Shipment[]): Promise<AssignmentMatrix> {
    // 1. 货物分析：重量体积匹配车辆类型
    const cargoAnalysis = await this.analyzeCargoRequirements(shipments);
    
    // 2. 距离计算：批量计算司机到取货点的距离
    const distanceMatrix = await this.calculateDispatchMatrix(shipments, drivers);
    
    // 3. 路径优化：优化多订单捆绑路径
    const optimizedRoutes = await this.optimizeMultiOrderRoutes(shipments);
    
    // 4. 成本计算：燃油+时间+等待成本
    const costAnalysis = await this.calculateTotalCosts(optimizedRoutes);
    
    // 5. 推荐分配：返回最优司机-运单配对
    return {
      assignments: this.generateOptimalAssignments(costAnalysis),
      totalCostSavings: this.calculateSavings(costAnalysis),
      expectedCompletionTime: this.calculateETAs(optimizedRoutes)
    };
  }
  
  // 专门处理垃圾清运和仓库转运的往返路径优化
  async optimizeWasteCollectionRoutes(shipments: WasteCollectionShipment[]): Promise<WasteCollectionPlan[]> {
    return shipments.map(shipment => {
      const warehouse = this.getWarehouseById(shipment.warehouseId);
      const landfillSite = this.getLandfillById(shipment.landfillId);
      
      // 计算往返路径
      const outboundRoute = this.calculateRoute(warehouse.location, landfillSite.location);
      const inboundRoute = this.calculateRoute(landfillSite.location, warehouse.location);
      
      return {
        shipment,
        route: {
          outbound: outboundRoute,
          inbound: inboundRoute,
          totalCost: outboundRoute.cost + inboundRoute.cost,
          fuelCost: (outboundRoute.distance + inboundRoute.distance) * this.fuelCostPerKm
        }
      };
    });
  }
}
```

#### 4.2.2 Google Maps API 调用优化
```typescript
// 物流专用的Google Maps服务
class LogisticMapsService {
  // 批量距离矩阵计算，用于调度决策
  async calculateDispatchCosts(shipments: Shipment[], drivers: Driver[]): Promise<DispatchCostMatrix> {
    const origins = drivers.map(d => d.currentLocation);
    const destinations = shipments.map(s => s.pickupAddress);
    
    const results = await this.distanceMatrixApi.batchCalculate({
      origins: origins,
      destinations: destinations,
      mode: 'driving',
      departure_time: 'now',
      traffic_model: 'best_guess',
      avoid: 'ferries', // 避免渡船，减少成本
      units: 'metric'
    });
    
    return results.map((driverCosts, driverIndex) => 
      driverCosts.map((routeCost, shipmentIndex) => ({
        driver: drivers[driverIndex],
        shipment: shipments[shipmentIndex],
        distance: routeCost.distance.value,
        duration: routeCost.duration_in_traffic.value,
        cost: this.calculateAssignmentCost(routeCost, shipments[shipmentIndex])
      }))
    );
  }
  
  // 多订单路径优化
  async optimizeMultiOrderRoute(waypoints: Address[]): Promise<OptimizedRoute> {
    const directions = await this.directionsApi.calculate({
      origin: waypoints[0],
      destination: waypoints[waypoints.length - 1],
      waypoints: waypoints.slice(1, -1),
      optimize_waypoints: true,    // 自动优化路径顺序
      avoid_highways: false,       // 物流允许使用高速
      avoid_tolls: false,         // 考虑过路费的成本效益
      departure_time: 'now',
      traffic_model: 'best_guess'
    });
    
    return {
      route: directions.routes[0],
      optimized_sequence: directions.routes[0].waypoint_order,
      total_distance: directions.routes[0].legs.reduce((sum, leg) => sum + leg.distance.value, 0),
      total_duration: directions.routes[0].legs.reduce((sum, leg) => sum + leg.duration.value, 0),
      fuel_cost: this.calculateFuelCost(directions.routes[0])
    };
  }
}
```

### 4.3 成本计算集成

#### 4.3.1 物流成本模型
```typescript
interface LogisticsCostCalculation {
  // 基础成本
  baseCost: number;                 // 起步价：CAD $80
  distanceCost: number;            // 距离费：CAD $2.00/km
  
  // 物流特定成本
  cargoHandlingCost: number;       // 装卸成本（基于托盘数量）
  waitingCost: number;            // 等待成本（司机时间成本）
  fuelCost: number;               // 燃油成本（基于距离）
  tollCost: number;               // 过路费
  
  // 时间成本
  driverHourlyRate: number;       // 司机时薪：CAD $25/hour
  overtimeMultiplier: number;      // 加班倍数：1.5x
  
  // 业务场景加成
  warehousTransferBonus: number;   // 仓库转运补贴：+CAD $20
  wasteCollectionDiscount: number; // 垃圾清运折扣：-CAD $15
  vipCustomerPremium: number;      // VIP客户加价：+20%
}
```

#### 4.3.2 动态定价计算
```typescript
class LogisticsPricingEngine {
  calculateRouteCost(route: LogisticsRoute, timestamp: Date): PricingDetails {
    const base = route.baseCost;
    
    // 1. 基础距离费用
    const distanceFee = route.distance * route.ratePerKm;
    
    // 2. 货物处理费（基于托盘）
    const cargoFee = route.cargo.pallets * 5; // CAD $5 per pallet
    
    // 3. 时间成本（司机工作时间）
    const timeCost = route.estimatedDrivingHours * 25; // CAD $25/hour
    
    // 4. 等待成本（在仓库等待）
    const waitingCost = (route.waitingTimeLimit / 60) * 20; // CAD $20/hour waiting
    
    // 5. 燃油成本（当前油价）
    const fuelCost = route.distance * 0.8; // CAD $0.8/km
    
    // 6. 业务场景调整
    let scenarioAdjustment = 0;
    if (route.businessType === 'WASTE_COLLECTION') {
      scenarioAdjustment = -15; // 垃圾清运内部折扣
    } else if (route.businessType === 'WAREHOUSE_TRANSFER') {
      scenarioAdjustment = 20;   // 仓库转运补贴
    }
    
    // 7. 客户等级加成
    const customerPremium = route.customerLevel === 'VIP' ? 0.2 : 0;
    
    const totalCost = (base + distanceFee + cargoFee + timeCost + waitingCost + fuelCost + scenarioAdjustment) * (1 + customerPremium);
    
    return {
      baseCost: totalCost,
      distanceKm: route.distance,
      businessType: route.businessType,
      breakdown: {
        basePrice: base,
        distanceFee,
        cargoFee,
        timeCost,
        waitingCost,
        fuelCost,
        scenarioAdjustment,
        customerPremium: totalCost * customerPremium / (1 + customerPremium)
      },
      customerCharge: Math.round(totalCost * 10) / 10, // 四舍五入到0.1元
      driverPay: Math.round((timeCost + route.distance * 0.5) * 10) / 10,
      companyProfit: totalCost - (timeCost + route.distance * 0.5)
    };
  }
}
```

---

## 🎯 页面集成实施

### 5.1 运单创建页面增强
```tsx
// 运单创建页面的地图集成
const MapIntegrationForShipmentCreate = () => {
  const [routePreview, setRoutePreview] = useState(null);
  const [costEstimate, setCostEstimate] = useState(null);
  
  // 地址变更时重新计算路径和成本
  const handleAddressesChange = async (pickup, delivery) => {
    if (pickup && delivery) {
      // 实时计算最优路径
      const route = await logisticsMapsService.calculateOptimizedRoute({
        pickup, 
        delivery,
        businessType: formData.businessType, // 'WASTE_COLLECTION', 'WAREHOUSE_TRANSFER', etc.
        cargoInfo: formData.cargoInfo
      });
      
      setRoutePreview(route);
      
      // 计算运输成本
      const cost = await pricingEngine.calculateLogisticsCost({
        route,
        businessType: formData.businessType,
        customerLevel: formData.customerLevel
      });
      
      setCostEstimate(cost);
    }
  };
  
  return (
    <Card title="🎯 运单路径规划与成本估算">
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="取货地址">
            <AddressAutocomplete 
              value={formData.pickupAddress}
              onChange={(address) => handleAddressesChange(address, formData.deliveryAddress)}
              placeholder="选择或输入取货地址"
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="送货地址">
            <AddressAutocomplete 
              value={formData.deliveryAddress}
              onChange={(address) => handleAddressesChange(formData.pickupAddress, address)}
              placeholder="选择或输入送货地址"
            />
          </Form.Item>
        </Col>
      </Row>
      
      <Row gutter={16}>
        <Col span={12}>
          <LogisticsMapPreview 
            routeData={routePreview}
            showCostBreakdown={true}
            businessType={formData.businessType}
          />
        </Col>
        <Col span={12}>
          <CostEstimationPanel 
            estimate={costEstimate}
            businessType={formData.businessType}
            editable={true}
            onPriceAdjustment={handlePriceAdjustment}
          />
        </Col>
      </Row>
    </Card>
  );
};
```

### 5.2 车队管理页面实时调度
```tsx
// 车队管理的智能调度界面
const FleetDashboardWithDispatchOptimization = () => {
  const [dispatchMatrix, setDispatchMatrix] = useState(null);
  const [optimizedAssignments, setOptimizedAssignments] = useState(null);
  
  // 自动调度优化
  const handleAutoDispatch = async () => {
    const pendingShipments = await shipmentsApi.getPendingShipments();
    const availableDrivers = await driversApi.getAvailableDrivers();
    
    // 智能调度算法
    const assignments = await dispatchOptimizationService.optimizeAssignments(
      pendingShipments,
      availableDrivers
    );
    
    setOptimizedAssignments(assignments);
    
    // 显示调度建议
    message.success(`已优化 ${assignments.length} 个运单分配，预计节省 CAD $${assignments.totalSavings}`);
  };
  
  return (
    <div className="fleet-dispatch-dashboard">
      <Row gutter={16}>
        <Col span={16}>
          <RealTimeLogisticsMap 
            shipments={pendingShipments}
            drivers={availableDrivers}
            optimizedAssignments={optimizedAssignments}
            displayMode="dispatch_optimization"
          />
        </Col>
        <Col span={8}>
          <IntelligentDispatchPanel 
            pendingShipments={pendingShipments}
            availableDrivers={availableDrivers}
            assignments={optimizedAssignments}
            onAutoDispatch={handleAutoDispatch}
            onManualAdjustment={handleManualAdjustment}
          />
        </Col>
      </Row>
    </div>
  );
};
```

---

## 🔒 安全与成本控制

### 6.1 物流专用安全策略
```typescript
// API密钥管理
const API_KEY_CONFIG = {
  frontend: {
    key: process.env.VITE_GOOGLE_MAPS_FRONTEND_KEY,
    restrictions: {
      http_referrers: ['.yourlogistics.com', 'localhost:3000'],
      allowed_apis: ['Maps JavaScript API', 'Places API']
    }
  },
  backend: {
    key: process.env.GOOGLE_MAPS_BACKEND_KEY,
    restrictions: {
      ip_addresses: ['Vercel IP范围', 'Supabase IP范围'],
      allowed_apis: ['Geocoding API', 'Directions API', 'Distance Matrix API']
    }
  }
};

// 成本控制策略
const COST_CONTROL = {
  // 物流业务的API使用优化
  geocoding: {
    warehouse_addresses: '缓存30天',     // 仓库地址不会变化
    customer_addresses: '缓存7天',       // 客户地址变化较少
    new_warehouses: '实时更新'           // 新仓库地址实时验证
  },
  
  directions: {
    waste_collection_routes: '缓存24小时',  // 垃圾清运路径相对固定
    warehouse_transfer_routes: '缓存12小时', // 仓库转运考虑早晚高峰变化
    customer_delivery_routes: '缓存1小时',   // 客户配送考虑实时交通
    multi_waypoint_optimization: '实时计算' // 多订单优化需要实时考虑
  },
  
  预算控制: {
    每日API费用上限: 'CAD $100',
    每月API费用上限: 'CAD $2000',
    告警阈值: '预算80%',
    自动限制: '预算95%时暂停非关键API调用'
  }
};
```

### 6.2 业务连续性保障
```typescript
// 物流业务中断时的降级策略
class LogisticsMapsFallback {
  async routeCalculation(route: LogisticsRoute): Promise<RouteResult> {
    try {
      // 优先尝试Google Maps
      return await this.googleMapsService.calculateRoute(route);
    } catch (error) {
      // 降级到缓存的路由数据
      const cachedRoute = await this.getCachedRoute(route);
      if (cachedRoute) {
        return {
          ...cachedRoute,
          from_cache: true,
          cache_age: 'h小时前更新'
        };
      }
      
      // 最终降级：基于直线距离的估算
      return {
        distance: this.calculateEuclideanDistance(route.pickup, route.delivery) * 1.4,
        duration: this.calculateEuclideanDistance(route.pickup, route.delivery) * 2,
        cost: this.estimateCostFromDistance(this.calculateEuclideanDistance(route.pickup, route.delivery)),
        fallback_reason: 'API服务不可用，使用估算数据'
      };
    }
  }
}
```

---

## 🧪 测试策略

### 7.1 业务场景测试
- **垃圾清运**: WH_07到各填埋场的路径优化测试
- **亚马逊转运**: 仓库到AMZ_YYZ9的时效和成本测试  
- **多订单配送**: 多运单路径优化算法测试
- **成本计算**: 各种业务场景的成本公式验证

### 7.2 性能测试
- **调度算法**: 100+运单，50+司机的调度计算时间 < 30秒
- **路径计算**: 地图加载和路径绘制时间 < 2秒
- **缓存命中率**: 仓库地址缓存命中率 > 95%
- **API成本控制**: 确保月度API费用在预算内

---

## 📈 成功指标

### 8.1 物流业务指标
- **调度效率**: 自动调度成功率 > 90%
- **路径优化**: 里程减少 15%+
- **成本节约**: 燃油成本降低 10%+
- **时效提升**: 平均配送时间减少 20%+

### 8.2 技术指标
- **API响应**: 路径计算 < 500ms
- **用户满意**: 地图功能使用率 > 80%
- **运营效率**: 决策时间减少 70%+

---

## 📝 实施计划

### 9.1 第一阶段：基础集成 (Week 1-2)
- [ ] Google Maps JavaScript API 集成
- [ ] 仓库和客户地址的 geocoding 功能
- [ ] 基础路径计算和地图显示

### 9.2 第二阶段：调度优化 (Week 3-4)  
- [ ] Directions API 集成
- [ ] Distance Matrix API 批量计算
- [ ] 智能调度算法开发

### 9.3 第三阶段：成本计算 (Week 5-6)
- [ ] 物流成本模型集成
- [ ] 动态定价计算
- [ ] 业务场景差异化处理

### 9.4 第四阶段：优化与监控 (Week 7-8)
- [ ] 多订单路径优化
- [ ] 性能调优和缓存策略
- [ ] 成本监控和告警系统

---

**版本**: v2.0 (物流优化版)  
**最后更新**: 2025-10-02  
**审核状态**: 物流业务场景review  
**下一步行动**: 确认业务场景范围和技术实现优先级
