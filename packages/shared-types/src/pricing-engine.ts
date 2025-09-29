// 计费规则引擎类型定义
// 创建时间: 2025-09-29 02:20:00
// 作用: 定义智能计费规则引擎的完整类型系统

// =====================================================
// 1. 业务场景基础类型
// =====================================================

export type BusinessScenarioType = 
  | 'WASTE_COLLECTION'      // 垃圾清运
  | 'WAREHOUSE_TRANSFER'    // 仓库转运  
  | 'CLIENT_DIRECT'         // 客户直运
  | 'CUSTOM';               // 自定义场景

export type ComponentCategory = 
  | 'REVENUE'               // 收入侧（客户收费）
  | 'DRIVER_COMPENSATION'   // 司机薪酬
  | 'INTERNAL_COST';        // 内部成本

export type WarehouseType = 
  | 'OWN_WAREHOUSE'         // 自有仓库
  | 'THIRD_PARTY_WAREHOUSE' // 第三方仓库
  | 'DISPOSAL_SITE';        // 垃圾处理场

// =====================================================
// 2. 业务条件类型
// =====================================================

export interface BusinessConditions {
  // 运单类型条件
  pickupType?: 'OWN_WAREHOUSE' | 'CLIENT_LOCATION' | 'INTERNAL';
  deliveryType?: 'THIRD_PARTY_WAREHOUSE' | 'DISPOSAL_SITE' | 'CLIENT_ADDRESS';
  isReturnTrip?: boolean;
  requiresAppointment?: boolean;
  
  // 客户条件
  customerType?: 'INTERNAL' | 'EXTERNAL';
  customerTier?: 'VIP' | 'STANDARD' | 'PREMIUM';
  
  // 目的地条件
  destinationWarehouse?: 'AMAZON' | 'CUSTOM_WAREHOUSE';
  warehouseType?: WarehouseType;
  
  // 货物条件
  cargoType?: 'GENERAL_MERCHANDISE' | 'WASTE' | 'FRAGILE';
  hazardousMaterials?: boolean;
  requiresColdChain?: boolean;
}

// =====================================================
// 3. 计费组件类型
// =====================================================

export interface PricingComponent {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  description?: string;
  category: ComponentCategory;
  calculationType: 'fixed' | 'per_unit' | 'percentage' | 'conditional';
  formula?: string;
  defaultValue: number;
  unit?: string;
  currency: string;
  isTaxable: boolean;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

// =====================================================
// 4. 计费规则类型
// =====================================================

export interface PricingRule {
  ruleId: string;
  name: string;
  component: string;  // 引用的组件代码
  condition?: string; // 条件表达式
  formula: number | string; // 计算公式
  priority: number;   // 优先级
  description?: string;
}

export interface DriverRule {
  ruleId: string;
  name: string;
  component: string;
  condition?: string;
  formula: number | string;
  priority: number;
  driverSharing?: number; // 从总收入中分给司机的金额
}

// =====================================================
// 5. 计费模板类型
// =====================================================

export interface PricingTemplate {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  type: BusinessScenarioType;
  businessConditions: BusinessConditions;
  pricingRules: PricingRule[];
  driverRules: DriverRule[];
  costAllocation: CostAllocationRule;
  status: 'active' | 'inactive';
  version: number;
  createdAt: string;
  createdBy?: string;
  updatedAt: string;
  updatedBy?: string;
}

// =====================================================
// 6. 成本分摊规则类型
// =====================================================

export interface CostAllocationRule {
  // 固定成本
  WAREHOUSE_COST?: number;
  MAINTENANCE_COST?: number;
  INSURANCE_COST?: number;
  
  // 自动计算成本
  FLEET_COST?: 'auto_calculated';
  FUEL_COST?: 'auto_calculated';
  
  // 其他内部成本
  [key: string]: number | string;
}

// =====================================================
// 7. 仓库配置类型
// =====================================================

export interface Warehouse {
  id: string;
  tenantId: string;
  name: string;
  code: string;  // WH_07, AMZ_YYZ9
  type: WarehouseType;
  address: {
    street: string;
    city: string;
    province: string;
    postalCode?: string;
    country?: string;
  };
  operatingHours?: {
    weekday?: string;
    weekend?: string;
    holidays?: string;
  };
  appointmentRequired: boolean;
  waitingTimeLimit: number; // 默认等候时间限制(分钟)
  handlingCost: number;
  dockFee: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

// =====================================================
// 8. 距离矩阵类型
// =====================================================

export interface DistanceMatrix {
  id: string;
  tenantId: string;
  originWarehouseId?: string;
  destinationWarehouseId?: string;
  originAddress?: string;
  destinationAddress?: string;
  distanceKm: number;
  estimatedDrivingMinutes?: number;
  baseDistancePeriod: number;    // 基础距离范围(km)
  baseFreightRate: number;       // 基础运费
  extraDistanceRate: number;     // 超距费率(每20km)
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

// =====================================================
// 9. 运单计费上下文类型
// =====================================================

export interface ShipmentContext {
  // 运单基础信息
  shipmentId: string;
  tenantId: string;
  
  // 路线信息
  pickupLocation: {
    warehouseId?: string;
    warehouseCode?: string;
    address: string;
    city: string;
  };
  deliveryLocation: {
    warehouseId?: string;
    warehouseCode?: string;
    address: string;
    city: string;
  };
  
  // 距离信息
  distance: number; // km
  estimatedDrivingMinutes?: number;
  
  // 货物信息
  weight: number;
  volume?: number;
  pallets?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: string;
  };
  
  // 时间信息
  pickupTime?: string;
  deliveryTime?: string;
  appointmentTime?: string;
  actualWaitingTime?: number; // 分钟
  
  // 客户信息
  customerId?: string;
  customerTier?: 'VIP' | 'STANDARD' | 'PREMIUM';
  
  // 司机信息
  driverId?: string;
  vehicleId?: string;
  
  // 业务属性
  cargoType?: string;
  isHazardous?: boolean;
  isColdChain?: boolean;
  requiresInsulated?: boolean;
}

// =====================================================
// 10. 计费结果类型
// =====================================================

export interface PricingCalculation {
  shipmentId: string;
  templateId: string;
  templateName: string;
  
  // 总费用
  totalRevenue: number;
  totalDriverPay: number;
  totalInternalCosts: number;
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
  
  // 明细
  revenueBreakdown: PricingDetail[];
  driverBreakdown: PricingDetail[];
  costBreakdown: PricingDetail[];
  
  // 计费元数据
  calculationTime: number; // ms
  appliedRules: string[];
  pricingVersion: string;
  calculatedAt: string;
}

export interface PricingDetail {
  componentCode: string;
  componentName: string;
  amount: number;
  currency: string;
  formula: string;
  inputValues: Record<string, any>;
  sequence: number;
  ruleId?: string;
}

// =====================================================
// 11. API 请求/响应类型
// =====================================================

export interface PricingTemplateCreateRequest {
  name: string;
  description?: string;
  type: BusinessScenarioType;
  businessConditions: BusinessConditions;
  pricingRules: Omit<PricingRule, 'ruleId'>[];
  driverRules: Omit<DriverRule, 'ruleId'>[];
  costAllocation: CostAllocationRule;
}

export interface PricingTemplateUpdateRequest extends Partial<PricingTemplateCreateRequest> {}

export interface PricingCalculationRequest {
  shipmentContext: ShipmentContext;
  templateId?: string;
  forceRecalculate?: boolean;
}

export interface PricingPreviewResponse {
  calculation: PricingCalculation;
  recommendedTemplate?: PricingTemplate;
  alternativeTemplates?: PricingTemplate[];
}

export interface PricingTemplateTestRequest {
  templateId: string;
  testScenarios: {
    context: Partial<ShipmentContext>;
    expectedResult?: Partial<PricingCalculation>;
  }[];
}

// =====================================================
// 12. 错误类型
// =====================================================

export enum PricingErrorCode {
  TEMPLATE_NOT_FOUND = 'PRICING_TEMPLATE_NOT_FOUND',
  INVALID_TEMPLATE_FORMULA = 'INVALID_TEMPLATE_FORMULA',
  CALCULATION_TIMEOUT = 'CALCULATION_TIMEOUT',
  MISSING_REQUIRED_FIELDS = 'MISSING_REQUIRED_FIELDS',
  DISTANCE_NOT_CONFIGURED = 'DISTANCE_NOT_CONFIGURED',
  COMPONENT_NOT_FOUND = 'COMPONENT_NOT_FOUND',
  RULE_EXECUTION_ERROR = 'RULE_EXECUTION_ERROR'
}

export interface PricingError {
  code: PricingErrorCode;
  message: string;
  details?: Record<string, any>;
  context?: ShipmentContext;
}

// =====================================================
// 13. 查询参数类型
// =====================================================

export interface PricingTemplateQueryParams extends QueryParams {
  type?: BusinessScenarioType;
  status?: 'active' | 'inactive';
  tenantId?: string;
}

export interface PricingComponentQueryParams extends QueryParams {
  category?: ComponentCategory;
  code?: string;
  tenantId?: string;
}

export interface PricingCalculationHistoryQueryParams extends QueryParams {
  shipmentId?: string;
  templateId?: string;
  dateFrom?: string;
  dateTo?: string;
}

// =====================================================
// 14. 运单扩展类型 (扩展现有的Shipment类型)
// =====================================================

export interface ShipmentWithPricing extends Shipment {
  pricingTemplateId?: string;
  pricingCalculatedAt?: string;
  pricingVersion?: string;
  pricingTrace?: Record<string, any>;
  pricingDetails?: PricingDetail[];
}

// ==========================================================================
// 注释：文件结尾，无需重新导出避免循环依赖
// ==========================================================================
