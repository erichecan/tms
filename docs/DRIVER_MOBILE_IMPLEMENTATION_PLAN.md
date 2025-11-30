# 司机移动端完整实现计划
> 创建时间: 2025-11-30T10:00:00Z
> 最后更新: 2025-11-30T10:00:00Z

## 🎯 目标

完成司机移动端应用的完整实现，包括核心功能、高级功能和优化功能，使司机能够高效地管理运单任务。

---

## 📊 当前状态分析

### ✅ 已实现功能

1. **基础认证**
   - ✅ 司机登录页面 (`/apps/frontend-mobile/src/pages/Auth/Login.tsx`)
   - ✅ JWT Token 认证
   - ✅ 租户隔离支持
   - ✅ 会话持久化

2. **任务管理基础**
   - ✅ 任务列表展示 (`/apps/frontend-mobile/src/pages/Dashboard/Dashboard.tsx`)
   - ✅ 运单状态更新（接单、开始取货、开始运输、确认送达）
   - ✅ POD 凭证上传

3. **后端 API 支持**
   - ✅ `/api/auth/login` - 司机登录
   - ✅ `/api/v1/shipments/driver/me` - 获取司机运单列表
   - ✅ `/api/shipments/:id/pickup` - 开始取货
   - ✅ `/api/shipments/:id/transit` - 开始运输
   - ✅ `/api/shipments/:id/delivery` - 确认送达
   - ✅ `/api/shipments/:id/pod` - 上传POD凭证
   - ✅ `/api/drivers/assignments/:shipmentId/acknowledge` - 确认接单

4. **技术栈**
   - ✅ React 18 + TypeScript
   - ✅ Ant Design Mobile
   - ✅ React Router
   - ✅ Axios 请求库
   - ✅ Vite 构建工具

### ⚠️ 待完善功能

1. **核心功能缺失**
   - ❌ 实时 GPS 位置上报
   - ❌ 运单详情页面
   - ❌ 导航集成（Google Maps）
   - ❌ 异常处理功能
   - ❌ 离线模式支持

2. **用户体验优化**
   - ❌ 消息推送通知
   - ❌ 任务筛选和排序
   - ❌ 历史记录查看
   - ❌ 加载状态优化
   - ❌ 错误处理完善

3. **后端 API 待补充**
   - ❌ 位置上报 API
   - ❌ 异常报告 API
   - ❌ 司机历史记录 API

---

## 📋 完整实现计划

### 阶段 1: 核心功能完善 (预计 2-3 天)

#### 1.1 运单详情页面 ⭐ 高优先级

**功能需求**:
- 显示完整运单信息（地址、联系人、货物信息）
- 显示运单时间线
- 支持状态更新操作
- 支持 POD 上传

**技术实现**:
- 创建 `/apps/frontend-mobile/src/pages/ShipmentDetail/ShipmentDetail.tsx`
- 集成现有的状态更新 API
- 使用 Ant Design Mobile 组件

**验收标准**:
- [ ] 可以查看运单完整信息
- [ ] 可以更新运单状态
- [ ] 可以上传 POD 凭证
- [ ] 显示运单时间线

---

#### 1.2 实时 GPS 位置上报 ⭐ 高优先级

**功能需求**:
- 后台自动上报位置（每 30 秒或按距离）
- 显示当前位置
- 位置上报开关
- 低电量模式（降低上报频率）

**技术实现**:
- 使用 `react-geolocated` 获取位置（已安装）
- 创建位置上报服务 `/apps/frontend-mobile/src/services/locationService.ts`
- 创建后端位置上报 API `/api/locations/report`
- 使用 Web Worker 处理后台上报

**后端 API 设计**:
```typescript
POST /api/locations/report
{
  "driverId": "string",
  "latitude": number,
  "longitude": number,
  "accuracy": number,
  "heading": number,
  "speed": number,
  "timestamp": "ISO8601"
}
```

**验收标准**:
- [ ] 位置自动上报功能
- [ ] 可以在设置中开关位置上报
- [ ] 低电量模式下降低上报频率
- [ ] 后台运行时持续上报

---

#### 1.3 导航集成 ⭐ 高优先级

**功能需求**:
- 集成 Google Maps 导航
- 一键导航到提货地址
- 一键导航到送达地址
- 显示路线预览

**技术实现**:
- 使用 Google Maps JavaScript API
- 创建导航组件 `/apps/frontend-mobile/src/components/Navigation/Navigation.tsx`
- 支持打开外部导航应用（Google Maps App）

**验收标准**:
- [ ] 可以查看路线预览
- [ ] 可以启动导航到提货地址
- [ ] 可以启动导航到送达地址
- [ ] 支持打开外部导航应用

---

#### 1.4 异常处理功能 ⭐ 中优先级

**功能需求**:
- 报告运单异常（延迟、货损、地址问题等）
- 异常分类选择
- 异常描述和照片
- 异常状态展示

**技术实现**:
- 创建异常报告页面 `/apps/frontend-mobile/src/pages/ExceptionReport/ExceptionReport.tsx`
- 创建后端异常报告 API `/api/shipments/:id/exception`

**异常类型**:
- DELAY - 延迟
- DAMAGE - 货损
- LOST - 丢失
- PARTIAL_LOSS - 部分丢失
- ADDRESS_ISSUE - 地址问题
- WEATHER - 天气
- OTHER - 其他

**验收标准**:
- [ ] 可以报告运单异常
- [ ] 支持异常分类选择
- [ ] 支持上传异常照片
- [ ] 异常状态在任务列表中显示

---

### 阶段 2: 用户体验优化 (预计 1-2 天)

#### 2.1 任务筛选和排序 ⭐ 中优先级

**功能需求**:
- 按状态筛选（待接单、进行中、已完成）
- 按时间排序
- 搜索运单号
- 下拉刷新

**技术实现**:
- 在 Dashboard 组件中添加筛选器
- 使用 Ant Design Mobile 的 `Picker` 组件
- 实现本地筛选逻辑

**验收标准**:
- [ ] 可以按状态筛选任务
- [ ] 可以按时间排序
- [ ] 可以搜索运单号
- [ ] 支持下拉刷新

---

#### 2.2 历史记录查看 ⭐ 低优先级

**功能需求**:
- 查看已完成运单列表
- 查看运单详情和历史记录
- 查看 POD 凭证

**技术实现**:
- 创建历史记录页面 `/apps/frontend-mobile/src/pages/History/History.tsx`
- 复用运单详情组件
- 使用后端 API `/api/v1/shipments/driver/me?status=completed`

**验收标准**:
- [ ] 可以查看已完成运单列表
- [ ] 可以查看历史运单详情
- [ ] 可以查看历史 POD 凭证

---

#### 2.3 消息推送通知 ⭐ 高优先级

**功能需求**:
- 新任务推送通知
- 任务状态变更通知
- 系统消息通知
- 通知设置

**技术实现**:
- 使用浏览器 Notification API
- 集成 Web Push (可选)
- 创建通知服务 `/apps/frontend-mobile/src/services/notificationService.ts`

**验收标准**:
- [ ] 新任务分配时收到通知
- [ ] 任务状态变更时收到通知
- [ ] 可以在设置中开关通知

---

#### 2.4 UI/UX 优化 ⭐ 中优先级

**功能需求**:
- 加载状态优化（骨架屏）
- 错误处理完善（友好提示）
- 空状态展示
- 操作反馈优化

**技术实现**:
- 使用 Ant Design Mobile 的 `Skeleton` 组件
- 统一错误处理组件
- 添加 Toast 提示

**验收标准**:
- [ ] 加载时显示骨架屏
- [ ] 错误时显示友好提示
- [ ] 空状态有提示信息
- [ ] 操作有明确反馈

---

### 阶段 3: 高级功能 (预计 2-3 天)

#### 3.1 离线模式支持 ⭐ 高优先级

**功能需求**:
- 离线时缓存任务数据
- 离线操作队列
- 网络恢复后自动同步
- 离线状态提示

**技术实现**:
- 使用 IndexedDB 存储离线数据
- 创建离线队列服务 `/apps/frontend-mobile/src/services/offlineService.ts`
- 使用 Service Worker (可选)

**验收标准**:
- [ ] 离线时可以查看任务列表
- [ ] 离线操作会加入队列
- [ ] 网络恢复后自动同步
- [ ] 显示离线状态提示

---

#### 3.2 语音播报 ⭐ 低优先级

**功能需求**:
- 新任务语音播报
- 到达目的地语音提示
- 语音设置

**技术实现**:
- 使用 Web Speech API
- 创建语音服务 `/apps/frontend-mobile/src/services/voiceService.ts`

**验收标准**:
- [ ] 新任务时语音播报
- [ ] 到达目的地时语音提示
- [ ] 可以开关语音功能

---

#### 3.3 司机个人中心 ⭐ 低优先级

**功能需求**:
- 个人信息查看
- 绩效统计（完成率、评分）
- 设置页面（通知、位置上报、语音等）
- 退出登录

**技术实现**:
- 创建个人中心页面 `/apps/frontend-mobile/src/pages/Profile/Profile.tsx`
- 创建设置页面 `/apps/frontend-mobile/src/pages/Settings/Settings.tsx`
- 使用后端 API `/api/drivers/:id`

**验收标准**:
- [ ] 可以查看个人信息
- [ ] 可以查看绩效统计
- [ ] 可以修改设置
- [ ] 可以退出登录

---

### 阶段 4: 后端 API 完善 (预计 1-2 天)

#### 4.1 位置上报 API ⭐ 高优先级

**实现内容**:
- 创建位置上报路由 `/apps/backend/src/routes/locationRoutes.ts`
- 实现位置存储逻辑
- 实现位置查询接口

**API 设计**:
```typescript
POST /api/locations/report
GET /api/locations/driver/:driverId
GET /api/locations/shipment/:shipmentId
```

---

#### 4.2 异常报告 API ⭐ 中优先级

**实现内容**:
- 扩展运单异常字段
- 创建异常报告接口
- 实现异常查询接口

**API 设计**:
```typescript
POST /api/shipments/:id/exception
GET /api/shipments/:id/exceptions
```

---

#### 4.3 司机统计 API ⭐ 低优先级

**实现内容**:
- 创建司机统计服务
- 实现统计查询接口

**API 设计**:
```typescript
GET /api/drivers/:id/stats
```

---

## 🔧 技术细节

### 技术栈

- **前端框架**: React 18 + TypeScript
- **UI 组件库**: Ant Design Mobile 5.x
- **路由**: React Router 6.x
- **HTTP 客户端**: Axios
- **位置服务**: react-geolocated
- **地图服务**: Google Maps JavaScript API
- **状态管理**: React Context + Hooks
- **离线存储**: IndexedDB (localForage)
- **构建工具**: Vite

### 项目结构

```
apps/frontend-mobile/
├── src/
│   ├── components/          # 可复用组件
│   │   ├── Navigation/      # 导航组件
│   │   ├── LocationTracker/ # 位置追踪组件
│   │   └── ...
│   ├── pages/               # 页面组件
│   │   ├── Auth/            # 认证页面
│   │   ├── Dashboard/       # 任务列表
│   │   ├── ShipmentDetail/  # 运单详情
│   │   ├── ExceptionReport/ # 异常报告
│   │   ├── History/         # 历史记录
│   │   ├── Profile/         # 个人中心
│   │   └── Settings/        # 设置页面
│   ├── services/            # 服务层
│   │   ├── api.ts           # API 客户端
│   │   ├── locationService.ts # 位置服务
│   │   ├── notificationService.ts # 通知服务
│   │   ├── offlineService.ts # 离线服务
│   │   └── voiceService.ts  # 语音服务
│   ├── hooks/               # 自定义 Hooks
│   ├── contexts/            # Context 上下文
│   ├── types/               # TypeScript 类型定义
│   └── utils/               # 工具函数
└── package.json
```

---

## 📅 执行时间表

### 第 1 周
- **Day 1-2**: 运单详情页面 + GPS 位置上报
- **Day 3-4**: 导航集成 + 异常处理
- **Day 5**: 测试和修复

### 第 2 周
- **Day 1**: 任务筛选和排序
- **Day 2**: 消息推送通知
- **Day 3**: UI/UX 优化
- **Day 4-5**: 离线模式支持

### 第 3 周
- **Day 1-2**: 历史记录 + 个人中心
- **Day 3**: 语音播报（可选）
- **Day 4-5**: 后端 API 完善 + 测试

---

## ✅ 验收标准

### 核心功能验收
- [ ] 司机可以登录系统
- [ ] 司机可以查看分配给自己的任务列表
- [ ] 司机可以查看运单详情
- [ ] 司机可以更新运单状态（接单、取货、运输、送达）
- [ ] 司机可以上传 POD 凭证
- [ ] 司机可以上报位置信息
- [ ] 司机可以使用导航功能

### 高级功能验收
- [ ] 司机可以报告运单异常
- [ ] 司机可以在离线模式下操作
- [ ] 司机可以收到推送通知
- [ ] 司机可以查看历史记录
- [ ] 司机可以管理个人设置

### 性能验收
- [ ] 应用加载时间 < 3 秒
- [ ] 位置上报不影响应用性能
- [ ] 离线模式响应时间 < 1 秒

### 兼容性验收
- [ ] 支持 iOS Safari
- [ ] 支持 Android Chrome
- [ ] 支持各种屏幕尺寸

---

## 🐛 已知问题和风险

### 问题
1. **位置上报电量消耗**: 需要优化上报频率，支持低电量模式
2. **离线模式数据一致性**: 需要处理网络恢复后的数据冲突
3. **浏览器兼容性**: 某些 API 可能不支持旧版本浏览器

### 风险
1. **Google Maps API 费用**: 需要控制 API 调用次数
2. **位置精度**: 移动设备 GPS 精度可能不够
3. **网络不稳定**: 需要处理网络中断和恢复

---

## 📝 后续优化建议

### 短期优化（1-2 个月）
- [ ] 添加多语言支持
- [ ] 添加深色模式
- [ ] 优化电池使用
- [ ] 添加数据统计图表

### 长期优化（3-6 个月）
- [ ] 开发原生 App (React Native)
- [ ] 添加语音识别输入
- [ ] 集成第三方导航应用
- [ ] 添加 AR 导航功能

---

## 🔗 相关文档

- [产品需求文档](./PRODUCT_REQUIREMENT_DOCUMENT.md) - 第 27 节：司机移动端交互与权限细化
- [API 规范文档](./API_SPECIFICATION.md) - 司机相关 API
- [架构文档](./ARCHITECTURE.md) - 移动端架构设计

---

**最后更新**: 2025-11-30T10:00:00Z

