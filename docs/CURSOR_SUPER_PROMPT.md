# Cursor实现Super Prompt - TMS系统MVP开发

## 项目概述

你正在开发一个智能物流运营平台(TMS)的MVP版本，基于PRD v3.0-PC。这是一个PC端的完整闭环系统，包含运单创建、调度分配、行程管理、执行流转、POD上传、财务结算等核心功能。

## 核心业务逻辑

### 1. 运单生命周期
- **创建运单**: 客户选择 → 地址自动填充 → 货物信息 → 提交创建
- **调度分配**: 运单详情页 → 可视化司机/车辆列表 → 直接指派或挂载到行程
- **执行流转**: assigned → picked_up → in_transit → delivered → completed
- **POD上传**: delivered前必须上传至少1张POD图片
- **财务结算**: completed时自动生成应收/应付记录

### 2. 行程管理
- **行程概念**: 一个行程可以挂载多个运单，支持联程/多段运输
- **状态流转**: planning → ongoing → completed
- **资源占用**: 司机+车辆在行程期间不可被其他行程占用
- **批量操作**: 行程中的运单可以批量推进状态

### 3. 客户管理
- **默认地址**: 选择客户后自动填充取货/送货地址
- **历史记录**: 客户详情页显示历史运单和财务记录
- **快速创建**: 支持从客户详情页快速创建新运单

## 技术架构

### 前端技术栈
- **框架**: React 18 + TypeScript
- **状态管理**: Zustand
- **UI组件**: Material-UI (MUI)
- **路由**: React Router v6
- **HTTP客户端**: Axios
- **表单处理**: React Hook Form + Yup
- **地图**: 预留地图组件接口

### 后端技术栈
- **框架**: Node.js + Express + TypeScript
- **数据库**: MySQL + Prisma ORM
- **认证**: JWT + 角色权限控制
- **文件上传**: Multer (POD图片)
- **API文档**: Swagger/OpenAPI
- **日志**: Winston
- **测试**: Jest + Supertest

### 数据库设计
- **多租户**: 所有表包含tenant_id字段
- **状态机**: 运单、行程、司机、车辆都有明确的状态流转
- **审计**: 时间线事件表记录所有状态变更
- **财务**: 自动生成应收/应付记录，支持费用分解

## 开发规范

### 1. 代码结构
```
apps/
├── frontend/                 # React前端应用
│   ├── src/
│   │   ├── components/      # 可复用组件
│   │   ├── pages/          # 页面组件
│   │   ├── hooks/          # 自定义Hooks
│   │   ├── services/       # API服务
│   │   ├── stores/         # Zustand状态管理
│   │   ├── types/          # TypeScript类型定义
│   │   └── utils/          # 工具函数
│   └── public/
├── backend/                 # Node.js后端应用
│   ├── src/
│   │   ├── controllers/    # 控制器
│   │   ├── services/       # 业务逻辑
│   │   ├── models/         # 数据模型
│   │   ├── routes/         # 路由定义
│   │   ├── middleware/     # 中间件
│   │   ├── utils/          # 工具函数
│   │   └── types/          # TypeScript类型定义
│   └── prisma/             # 数据库Schema
└── shared-types/           # 共享类型定义
```

### 2. 命名规范
- **文件命名**: kebab-case (如: shipment-create.tsx)
- **组件命名**: PascalCase (如: ShipmentCreate)
- **函数命名**: camelCase (如: createShipment)
- **常量命名**: UPPER_SNAKE_CASE (如: SHIPMENT_STATUS)
- **数据库字段**: snake_case (如: shipment_no)

### 3. 状态管理
- **全局状态**: 使用Zustand管理用户信息、权限等
- **页面状态**: 使用React Hook Form管理表单状态
- **服务端状态**: 使用React Query管理API数据缓存

### 4. 错误处理
- **API错误**: 统一错误响应格式，前端统一处理
- **表单验证**: 使用Yup进行客户端验证
- **状态机验证**: 服务端验证状态转换合法性

## 核心功能实现指南

### 1. 运单创建页面
```typescript
// 关键组件结构
<ShipmentCreate>
  <CustomerSelector />           // 客户选择器
  <AddressForm />               // 地址表单
  <CargoInfoForm />             // 货物信息
  <AdditionalServices />        // 附加服务
  <SubmitButton />              // 提交按钮
</ShipmentCreate>
```

**实现要点**:
- 客户选择后自动填充默认地址
- 地址表单支持从客户地址簿选择
- 表单验证确保必填字段完整
- 提交后跳转到运单详情页

### 2. 运单详情页面
```typescript
// 关键组件结构
<ShipmentDetails>
  <ShipmentInfo />              // 运单基本信息
  <AssignmentPanel>             // 指派面板
    <AvailableDrivers />        // 可用司机列表
    <AvailableVehicles />       // 可用车辆列表
    <TripCandidates />          // 可拼行程候选
  </AssignmentPanel>
  <ExecutionPanel>              // 执行面板
    <StatusProgress />          // 状态进度条
    <StatusButtons />           // 状态推进按钮
    <PODUpload />               // POD上传
  </ExecutionPanel>
  <Timeline />                  // 时间线
</ShipmentDetails>
```

**实现要点**:
- 根据当前状态显示可用的操作按钮
- 指派面板支持直接指派和挂载到行程两种方式
- POD上传支持多图片，缩略图展示
- 时间线实时更新状态变更记录

### 3. 车队管理页面
```typescript
// 关键组件结构
<FleetManagement>
  <InTransitList />             // 在途列表
  <AvailableResources>          // 空闲资源
    <AvailableDrivers />        // 空闲司机
    <AvailableVehicles />       // 空闲车辆
  </AvailableResources>
  <MapView />                   // 地图视图
  <HistoryList />               // 历史记录
</FleetManagement>
```

**实现要点**:
- 在途列表显示当前执行中的行程和运单
- 空闲资源列表支持筛选和排序
- 地图视图显示行程轨迹（MVP可用模拟数据）
- 历史记录支持分页和筛选

### 4. 客户管理页面
```typescript
// 关键组件结构
<CustomerManagement>
  <CustomerList />              // 客户列表
  <CustomerDetails>             // 客户详情
    <BasicInfo />               // 基本信息
    <AddressBook />             // 地址簿
    <ShipmentHistory />         // 运单历史
    <FinancialRecords />        // 财务记录
  </CustomerDetails>
</CustomerManagement>
```

**实现要点**:
- 客户列表支持搜索和筛选
- 客户详情页支持编辑和快速创建运单
- 地址簿管理默认取货/送货地址
- 历史记录支持分页和状态筛选

## API设计规范

### 1. RESTful API设计
```
GET    /api/shipments           # 获取运单列表
POST   /api/shipments           # 创建运单
GET    /api/shipments/:id       # 获取运单详情
PUT    /api/shipments/:id       # 更新运单
POST   /api/shipments/:id/assign # 指派司机/车辆
POST   /api/shipments/:id/status # 更新状态
POST   /api/shipments/:id/pod   # 上传POD
```

### 2. 响应格式
```typescript
// 成功响应
{
  success: true,
  data: T,
  message?: string
}

// 错误响应
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: any
  }
}
```

### 3. 状态码规范
- **200**: 成功
- **201**: 创建成功
- **400**: 请求参数错误
- **401**: 未授权
- **403**: 权限不足
- **404**: 资源不存在
- **409**: 状态转换冲突
- **500**: 服务器错误

## 测试策略

### 1. 单元测试
- **组件测试**: 使用React Testing Library
- **服务测试**: 使用Jest测试业务逻辑
- **工具函数测试**: 测试纯函数

### 2. 集成测试
- **API测试**: 使用Supertest测试接口
- **数据库测试**: 测试数据操作和状态机
- **端到端测试**: 使用Playwright测试完整流程

### 3. 测试用例重点
- 运单创建到完成的完整流程
- 状态机转换的合法性验证
- 权限控制和数据隔离
- 异常情况的处理

## 部署和监控

### 1. 环境配置
- **开发环境**: 本地开发，使用本地数据库
- **测试环境**: 集成测试，使用测试数据库
- **生产环境**: 生产部署，使用生产数据库

### 2. 监控指标
- **业务指标**: 运单处理量、状态转换时间、异常率
- **技术指标**: API响应时间、错误率、数据库性能
- **用户指标**: 页面加载时间、用户操作成功率

## 开发注意事项

### 1. 数据一致性
- 状态转换必须通过服务端验证
- 并发操作使用乐观锁或悲观锁
- 重要操作使用事务保证原子性

### 2. 性能优化
- 列表查询使用分页和索引
- 图片上传使用压缩和CDN
- 前端使用虚拟滚动处理大数据量

### 3. 安全考虑
- 所有API都需要身份验证
- 敏感数据需要脱敏处理
- 文件上传需要类型和大小限制

### 4. 用户体验
- 加载状态和错误提示要友好
- 表单验证要实时和准确
- 操作反馈要及时和明确

## 开发优先级

### Phase 1: 核心功能 (S1-S2)
1. 运单创建和客户管理
2. 运单详情和基本指派
3. 状态机实现和POD上传
4. 基础的车队管理页面

### Phase 2: 高级功能 (S3-S4)
1. 行程管理和多运单挂载
2. 地图轨迹和可视化
3. 财务结算和报表
4. 通知系统和异常处理

### Phase 3: 优化和扩展 (S5-S6)
1. 性能优化和缓存
2. 高级调度算法
3. 移动端适配
4. 智能报价系统

## 代码示例

### 1. 运单状态机实现
```typescript
// 状态转换验证
export const validateStatusTransition = (
  currentStatus: ShipmentStatus,
  targetStatus: ShipmentStatus
): boolean => {
  const validTransitions: Record<ShipmentStatus, ShipmentStatus[]> = {
    [ShipmentStatus.CREATED]: [ShipmentStatus.ASSIGNED, ShipmentStatus.CANCELED, ShipmentStatus.EXCEPTION],
    [ShipmentStatus.ASSIGNED]: [ShipmentStatus.PICKED_UP, ShipmentStatus.CANCELED, ShipmentStatus.EXCEPTION],
    [ShipmentStatus.PICKED_UP]: [ShipmentStatus.IN_TRANSIT, ShipmentStatus.EXCEPTION],
    [ShipmentStatus.IN_TRANSIT]: [ShipmentStatus.DELIVERED, ShipmentStatus.EXCEPTION],
    [ShipmentStatus.DELIVERED]: [ShipmentStatus.COMPLETED, ShipmentStatus.EXCEPTION],
    [ShipmentStatus.COMPLETED]: [],
    [ShipmentStatus.EXCEPTION]: [ShipmentStatus.ASSIGNED, ShipmentStatus.PICKED_UP, ShipmentStatus.IN_TRANSIT, ShipmentStatus.DELIVERED, ShipmentStatus.CANCELED],
    [ShipmentStatus.CANCELED]: []
  };
  
  return validTransitions[currentStatus]?.includes(targetStatus) ?? false;
};
```

### 2. 运单创建表单
```typescript
// 运单创建表单组件
export const ShipmentCreateForm: React.FC = () => {
  const { register, handleSubmit, watch, setValue } = useForm<ShipmentCreateData>();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  const onSubmit = async (data: ShipmentCreateData) => {
    try {
      const shipment = await shipmentService.createShipment(data);
      navigate(`/shipments/${shipment.id}`);
    } catch (error) {
      toast.error('创建运单失败');
    }
  };
  
  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    // 自动填充默认地址
    if (customer.defaultPickupAddress) {
      setValue('shipperAddress', customer.defaultPickupAddress);
    }
    if (customer.defaultDeliveryAddress) {
      setValue('receiverAddress', customer.defaultDeliveryAddress);
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <CustomerSelector onSelect={handleCustomerSelect} />
      <AddressForm register={register} />
      <CargoInfoForm register={register} />
      <SubmitButton type="submit">创建运单</SubmitButton>
    </form>
  );
};
```

### 3. 运单详情页面
```typescript
// 运单详情页面组件
export const ShipmentDetails: React.FC<{ shipmentId: string }> = ({ shipmentId }) => {
  const { data: shipment, isLoading } = useQuery(
    ['shipment', shipmentId],
    () => shipmentService.getShipment(shipmentId)
  );
  
  const { data: availableDrivers } = useQuery(
    ['available-drivers'],
    () => driverService.getAvailableDrivers()
  );
  
  const { data: availableVehicles } = useQuery(
    ['available-vehicles'],
    () => vehicleService.getAvailableVehicles()
  );
  
  const updateStatus = useMutation(
    (status: ShipmentStatus) => shipmentService.updateStatus(shipmentId, status),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['shipment', shipmentId]);
        toast.success('状态更新成功');
      }
    }
  );
  
  if (isLoading) return <LoadingSpinner />;
  if (!shipment) return <NotFound />;
  
  return (
    <div className="shipment-details">
      <ShipmentInfo shipment={shipment} />
      <AssignmentPanel 
        shipment={shipment}
        drivers={availableDrivers}
        vehicles={availableVehicles}
      />
      <ExecutionPanel 
        shipment={shipment}
        onStatusUpdate={updateStatus.mutate}
      />
      <Timeline shipmentId={shipmentId} />
    </div>
  );
};
```

## 总结

这个Super Prompt提供了TMS系统MVP开发的完整指导，包括业务逻辑、技术架构、开发规范、实现指南等。按照这个指导进行开发，可以确保代码质量和系统的一致性。

关键成功因素：
1. **理解业务逻辑**: 深入理解运单生命周期和状态机
2. **遵循架构设计**: 严格按照技术架构和代码规范
3. **注重用户体验**: 确保界面友好和操作流畅
4. **保证数据一致性**: 重视状态转换和数据完整性
5. **持续测试**: 确保功能正确性和系统稳定性

<!-- Added by assistant @ 2025-01-27 15:30:00 -->
