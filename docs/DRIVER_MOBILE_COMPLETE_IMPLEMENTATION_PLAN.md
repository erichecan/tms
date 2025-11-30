# 司机移动端完整实现计划
> 创建时间: 2025-11-30T10:30:00Z
> 最后更新: 2025-11-30T10:30:00Z

## 📋 目录

1. [当前状态分析](#一当前状态分析)
2. [需要实现的核心功能](#二需要实现的核心功能)
3. [技术实现方案](#三技术实现方案)
4. [实施步骤](#四实施步骤)
5. [文件结构规划](#五文件结构规划)
6. [API 接口确认](#六api-接口确认)
7. [UI/UX 设计要求](#七uiux-设计要求)
8. [技术难点和解决方案](#八技术难点和解决方案)
9. [测试计划](#九测试计划)
10. [实施优先级](#十实施优先级)
11. [预期成果](#十一预期成果)

---

## 一、当前状态分析

### 1.1 已实现的功能

#### 基础功能：

- ✅ **司机登录页面** (`Login.tsx`)
  - 基础登录表单
  - JWT Token 认证
  - 会话持久化
  
- ✅ **任务列表页面** (`Dashboard.tsx`)
  - 显示分配给司机的运单列表
  - 基础状态更新操作
  - POD 上传基础实现
  
- ✅ **运单状态更新**
  - 提货（pickup）
  - 在途（transit）
  - 送达（delivery）
  
- ✅ **POD 凭证上传**（基础实现）
  - 文件选择上传
  - 基础错误处理
  
- ✅ **API 服务封装** (`api.ts`)
  - Axios 拦截器配置
  - Token 自动注入
  - 租户隔离支持

#### 后端支持：

- ✅ `/api/auth/login` - 司机登录
- ✅ `/api/shipments/driver/me` - 获取司机运单列表
- ✅ `/api/shipments/:id/pickup` - 开始提货
- ✅ `/api/shipments/:id/transit` - 开始运输
- ✅ `/api/shipments/:id/delivery` - 确认送达
- ✅ `/api/shipments/:id/pod` - 上传 POD 凭证
- ✅ `/api/location/drivers/:driverId` - 更新司机位置

---

### 1.2 缺失或不完整的功能

#### UI/UX 问题：

- ❌ **UI 非常简陋**
  - 使用原生 HTML 样式，未使用 Ant Design Mobile
  - 没有移动端适配的布局和样式
  - 缺乏现代化的视觉设计

- ❌ **交互体验差**
  - 没有加载状态和错误提示的优化
  - 没有空状态和引导提示
  - 没有下拉刷新功能
  - 没有骨架屏加载效果

#### 功能缺失：

- ❌ **实时位置上报** - 代码中完全没有实现
- ❌ **运单详情页面** - 无法查看运单详细信息
- ❌ **导航功能** - 无法导航到提货/送达地址
- ❌ **地图集成** - 无法在地图上查看位置
- ❌ **拍照上传** - POD 上传使用文件选择，不是拍照
- ❌ **离线支持** - 没有离线缓存机制
- ❌ **推送通知** - 没有新任务通知

#### 技术问题：

- ⚠️ 使用了 `antd-mobile` 但未实际使用组件
- ⚠️ 没有使用 React Router 的导航守卫
- ⚠️ 没有错误边界处理
- ⚠️ 没有网络状态检测

---

## 二、需要实现的核心功能

### 2.1 登录和认证

**当前状态**：✅ 基础实现完成

**需要改进**：

1. **使用 Ant Design Mobile 组件优化 UI**
   - 使用 `NavBar` 组件作为顶部导航
   - 使用 `Input` 组件替代原生 input
   - 使用 `Button` 组件替代原生 button
   - 使用 `Toast` 组件显示提示消息

2. **功能增强**
   - 添加记住密码功能
   - 添加忘记密码功能（如果后端支持）
   - 优化错误提示（使用 Toast）
   - 添加表单验证

3. **用户体验优化**
   - 添加加载状态（Loading 组件）
   - 优化布局（居中、间距）
   - 添加 Logo 或标题
   - 支持回车键提交

---

### 2.2 任务列表（Dashboard）

**当前状态**：⚠️ 基础实现，UI 简陋

**需要实现**：

1. **使用 Ant Design Mobile 组件重构**
   - `NavBar` - 顶部导航栏
   - `Card` - 运单卡片
   - `List` - 运单列表容器
   - `PullToRefresh` - 下拉刷新
   - `Tag` - 状态标签

2. **功能增强**
   - 下拉刷新功能
   - 上拉加载更多（如果有分页）
   - 筛选功能（按状态筛选）
   - 搜索功能（搜索运单号）

3. **运单卡片优化**
   - 状态标签（使用颜色区分）
   - 地址信息展示优化
   - 时间信息展示
   - 客户名称展示
   - 操作按钮优化

4. **用户体验优化**
   - 空状态提示
   - 加载骨架屏
   - 错误提示优化
   - 点击卡片跳转到详情页

---

### 2.3 运单详情页面

**当前状态**：❌ 完全缺失

**需要实现**：

1. **创建 ShipmentDetail.tsx 页面**

2. **显示完整运单信息**
   - 发货人信息（姓名、电话、地址）
   - 收货人信息（姓名、电话、地址）
   - 货物信息（重量、体积、数量、描述）
   - 运单状态和时间线
   - POD 凭证展示（如果已上传）

3. **功能支持**
   - 状态更新操作
   - POD 上传功能
   - 导航到地址（集成地图或外部导航应用）
   - 一键拨打电话（联系发货人/收货人）
   - 查看地图（标记地址位置）

4. **UI 组件**
   - 使用 `Card` 组件展示信息区块
   - 使用 `Button` 组件展示操作按钮
   - 使用 `Timeline` 组件展示时间线
   - 使用 `Image` 组件展示 POD 图片

---

### 2.4 实时位置上报

**当前状态**：❌ 完全缺失

**需要实现**：

1. **集成浏览器 Geolocation API**
   - 使用 `navigator.geolocation.getCurrentPosition()` 获取当前位置
   - 使用 `navigator.geolocation.watchPosition()` 持续跟踪位置

2. **定期上报位置**
   - 每 30 秒或 1 分钟上报一次
   - 或者按距离变化上报（移动 50 米）
   - 在后台运行时继续上报（使用 Service Worker 或 Web Worker）

3. **位置上报服务**
   - 创建 `locationService.ts` 服务
   - 封装位置获取逻辑
   - 封装位置上报逻辑
   - 错误处理和重试机制

4. **用户体验**
   - 显示位置上报状态（开关、状态指示器）
   - 处理位置权限请求
   - 处理位置获取失败的情况
   - 低电量模式（降低上报频率）

5. **技术实现**
   - 使用 `react-geolocated` 库（已安装）
   - 创建 `useLocation` Hook
   - 集成后端 API `/api/location/drivers/:driverId`

---

### 2.5 POD 凭证上传

**当前状态**：⚠️ 基础实现，使用文件选择

**需要改进**：

1. **使用相机拍照功能**
   - 使用 `<input type="file" accept="image/*" capture="camera">` 属性
   - 或使用 Ant Design Mobile 的 `ImageUploader` 组件

2. **功能增强**
   - 支持从相册选择
   - 图片预览功能
   - 图片压缩（减少上传大小）
   - 上传进度显示
   - 多张图片上传支持

3. **用户体验优化**
   - 创建 `PODUploader` 组件
   - 使用 `Toast` 显示上传状态
   - 使用 `Progress` 显示上传进度
   - 错误处理和重试

4. **技术实现**
   - 使用 Canvas API 压缩图片
   - 使用 FormData 上传文件
   - 集成后端 API `/api/shipments/:id/pod`

---

### 2.6 导航功能

**当前状态**：❌ 完全缺失

**需要实现**：

1. **集成 Google Maps 导航**（如果可用）
   - 使用 Google Maps JavaScript API
   - 显示路线预览

2. **使用设备默认导航应用**
   - iOS: 使用 Apple Maps
   - Android: 使用 Google Maps
   - 使用 `geo:` URI scheme（通用方案）

3. **功能支持**
   - 在运单详情页显示"导航到提货地址"按钮
   - 显示"导航到送达地址"按钮
   - 支持一键拨打电话（联系发货人/收货人）

4. **技术实现**
   - 创建 `navigationService.ts` 服务
   - 检测设备类型
   - 使用对应的导航应用
   - 处理地址格式转换

---

### 2.7 地图集成

**当前状态**：❌ 完全缺失

**需要实现**：

1. **在运单详情页显示地图**
   - 集成 Google Maps JavaScript API
   - 或使用 Ant Design Mobile 的 `Map` 组件（如果有）

2. **标记地址位置**
   - 标记提货地址
   - 标记送达地址
   - 显示当前司机位置（如果允许）

3. **显示路线**（如果 Google Maps 可用）
   - 显示从当前位置到提货地址的路线
   - 显示从提货地址到送达地址的路线

4. **技术实现**
   - 创建 `MapView` 组件
   - 使用 Google Maps JavaScript API
   - 处理地图加载和错误

---

### 2.8 其他功能

1. **设置页面**（可选）
   - 位置上报开关
   - 通知开关
   - 语言设置
   - 退出登录

2. **网络状态检测**
   - 检测网络连接状态
   - 离线提示
   - 自动重连

3. **错误边界处理**
   - 使用 React Error Boundary
   - 错误日志记录
   - 错误提示

---

## 三、技术实现方案

### 3.1 UI 框架选择

**推荐使用：Ant Design Mobile**

- ✅ 已在 `package.json` 中安装 (`antd-mobile@5.41.1`)
- ✅ 专为移动端设计
- ✅ 组件丰富，开箱即用

#### 主要组件：

- `NavBar` - 导航栏
- `Card` - 卡片
- `List` - 列表
- `Button` - 按钮
- `Input` - 输入框
- `ImageUploader` - 图片上传
- `Toast` - 提示消息
- `Loading` - 加载状态
- `PullToRefresh` - 下拉刷新
- `Tag` - 标签
- `Timeline` - 时间线
- `Dialog` - 对话框
- `Skeleton` - 骨架屏

---

### 3.2 位置上报实现

#### 方案 1：使用浏览器 Geolocation API（推荐）

```typescript
// 获取当前位置
navigator.geolocation.getCurrentPosition(
  (position) => {
    const { latitude, longitude } = position.coords;
    // 上报位置
  },
  (error) => {
    // 处理错误
  }
);

// 持续跟踪位置
const watchId = navigator.geolocation.watchPosition(
  (position) => {
    // 定期上报
  },
  (error) => {
    // 处理错误
  },
  {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0
  }
);
```

#### 方案 2：使用 react-geolocated 库

✅ 已在 `package.json` 中安装 (`react-geolocated@4.4.0`)

提供 React Hook 封装：
```typescript
import { useGeolocated } from 'react-geolocated';

const { coords, isGeolocationAvailable, isGeolocationEnabled } = useGeolocated({
  positionOptions: {
    enableHighAccuracy: false,
  },
  userDecisionTimeout: 5000,
});
```

#### 位置上报服务实现

创建 `locationService.ts`:
- 封装位置获取逻辑
- 封装位置上报逻辑
- 错误处理和重试机制
- 上报频率控制

---

### 3.3 路由结构

```
/login          - 登录页面
/dashboard      - 任务列表（首页）
/shipment/:id   - 运单详情
/settings       - 设置页面（可选）
```

#### 路由守卫

- 检查登录状态
- 未登录自动跳转到登录页
- Token 过期处理

---

### 3.4 状态管理

**当前**：使用 React Hooks (`useState`, `useEffect`)

**建议**：保持简单，使用 Context API（如果需要全局状态）

#### 全局状态 Context

- `AuthContext` - 认证状态
- `LocationContext` - 位置上报状态
- `NetworkContext` - 网络状态

---

### 3.5 图片处理

#### 图片压缩

使用 Canvas API 压缩图片：
```typescript
function compressImage(file: File, maxWidth: number = 1920, quality: number = 0.8): Promise<File> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          }
        }, file.type, quality);
      };
    };
  });
}
```

---

## 四、实施步骤

### 阶段 1：UI 重构和基础功能完善（高优先级）

**预计时间**：3-4 天

#### 任务 1.1：重构登录页面

- [ ] 使用 Ant Design Mobile 组件
  - [ ] 使用 `NavBar` 组件
  - [ ] 使用 `Input` 组件
  - [ ] 使用 `Button` 组件
  - [ ] 使用 `Toast` 组件显示提示
- [ ] 优化布局和样式
  - [ ] 居中布局
  - [ ] 添加 Logo 或标题
  - [ ] 优化间距和字体
- [ ] 添加加载状态
  - [ ] 使用 `Loading` 组件
- [ ] 改进错误提示
  - [ ] 使用 `Toast` 显示错误消息
- [ ] 添加表单验证
  - [ ] 邮箱格式验证
  - [ ] 密码非空验证

**验收标准**：
- 界面美观，符合移动端设计规范
- 错误提示友好
- 加载状态明确

---

#### 任务 1.2：重构任务列表页面

- [ ] 使用 Ant Design Mobile 组件
  - [ ] 使用 `NavBar` 组件作为顶部导航
  - [ ] 使用 `Card` 组件展示运单卡片
  - [ ] 使用 `List` 组件作为列表容器
  - [ ] 使用 `Tag` 组件展示状态标签
- [ ] 添加下拉刷新
  - [ ] 使用 `PullToRefresh` 组件
- [ ] 优化运单卡片展示
  - [ ] 状态标签（使用颜色区分）
  - [ ] 地址信息展示优化
  - [ ] 时间信息展示
  - [ ] 客户名称展示
- [ ] 添加空状态提示
  - [ ] 没有任务时的友好提示
- [ ] 添加加载骨架屏
  - [ ] 使用 `Skeleton` 组件
- [ ] 点击卡片跳转到详情页
  - [ ] 使用 React Router 导航

**验收标准**：
- 界面美观，信息层次清晰
- 下拉刷新流畅
- 空状态提示友好
- 加载状态明确

---

#### 任务 1.3：创建运单详情页面

- [ ] 创建 `ShipmentDetail.tsx` 页面
- [ ] 显示完整运单信息
  - [ ] 发货人信息卡片
  - [ ] 收货人信息卡片
  - [ ] 货物信息卡片
  - [ ] 运单状态和时间线
- [ ] 集成状态更新功能
  - [ ] 使用现有的状态更新 API
- [ ] 集成 POD 上传功能
  - [ ] 使用改进后的 POD 上传组件
- [ ] 添加导航按钮
  - [ ] "导航到提货地址"按钮
  - [ ] "导航到送达地址"按钮
- [ ] 添加拨打电话功能
  - [ ] 联系发货人
  - [ ] 联系收货人

**验收标准**：
- 可以查看运单完整信息
- 可以更新运单状态
- 可以上传 POD 凭证
- 可以使用导航功能

---

### 阶段 2：核心功能实现（高优先级）

**预计时间**：4-5 天

#### 任务 2.1：实现实时位置上报

- [ ] 集成 Geolocation API
  - [ ] 创建 `useLocation` Hook
  - [ ] 处理位置权限请求
  - [ ] 处理位置获取失败
- [ ] 创建位置上报服务
  - [ ] 创建 `locationService.ts`
  - [ ] 封装位置获取逻辑
  - [ ] 封装位置上报逻辑
  - [ ] 错误处理和重试机制
- [ ] 实现定期上报逻辑
  - [ ] 每 30 秒或 1 分钟上报一次
  - [ ] 或按距离变化上报（移动 50 米）
- [ ] 添加位置上报状态显示
  - [ ] 在 Dashboard 显示上报状态
  - [ ] 在设置页面显示开关
- [ ] 处理权限和错误
  - [ ] 位置权限被拒绝的提示
  - [ ] 位置获取失败的提示
- [ ] 低电量模式
  - [ ] 降低上报频率

**验收标准**：
- 位置自动上报功能正常
- 可以在设置中开关位置上报
- 低电量模式下降低上报频率
- 后台运行时持续上报

---

#### 任务 2.2：优化 POD 上传

- [ ] 支持相机拍照
  - [ ] 使用 `capture="camera"` 属性
  - [ ] 或使用 Ant Design Mobile 的 `ImageUploader` 组件
- [ ] 支持从相册选择
  - [ ] 使用文件选择器
- [ ] 添加图片预览功能
  - [ ] 使用 `Image` 组件预览
- [ ] 添加图片压缩
  - [ ] 使用 Canvas API 压缩
  - [ ] 创建 `imageCompress.ts` 工具
- [ ] 优化上传体验
  - [ ] 上传进度显示
  - [ ] 使用 `Toast` 显示上传状态
  - [ ] 错误处理和重试
- [ ] 创建 `PODUploader` 组件
  - [ ] 封装上传逻辑
  - [ ] 支持多张图片上传

**验收标准**：
- 可以使用相机拍照上传
- 可以从相册选择上传
- 图片自动压缩
- 上传进度明确
- 错误提示友好

---

#### 任务 2.3：实现导航功能

- [ ] 创建导航服务
  - [ ] 创建 `navigationService.ts`
  - [ ] 检测设备类型
  - [ ] 使用对应的导航应用
- [ ] 添加导航按钮
  - [ ] 在运单详情页添加"导航到提货地址"按钮
  - [ ] 添加"导航到送达地址"按钮
- [ ] 集成外部导航应用
  - [ ] iOS: 使用 Apple Maps
  - [ ] Android: 使用 Google Maps
  - [ ] 使用 `geo:` URI scheme
- [ ] 添加一键拨打电话功能
  - [ ] 使用 `tel:` URI scheme
  - [ ] 联系发货人
  - [ ] 联系收货人

**验收标准**：
- 可以查看路线预览
- 可以启动导航到提货地址
- 可以启动导航到送达地址
- 可以一键拨打电话

---

### 阶段 3：高级功能（中优先级）

**预计时间**：2-3 天

#### 任务 3.1：地图集成

- [ ] 集成 Google Maps JavaScript API
  - [ ] 获取 API Key
  - [ ] 创建 `MapView` 组件
- [ ] 在运单详情页显示地图
  - [ ] 显示提货地址标记
  - [ ] 显示送达地址标记
  - [ ] 显示当前司机位置（如果允许）
- [ ] 显示路线（如果 Google Maps 可用）
  - [ ] 从当前位置到提货地址的路线
  - [ ] 从提货地址到送达地址的路线

**验收标准**：
- 可以在地图上查看地址位置
- 可以查看路线
- 地图加载流畅

---

#### 任务 3.2：优化和增强

- [ ] 添加网络状态检测
  - [ ] 创建 `NetworkContext`
  - [ ] 检测网络连接状态
  - [ ] 离线提示
- [ ] 添加离线支持
  - [ ] 使用 IndexedDB 存储离线数据
  - [ ] 网络恢复后自动同步
- [ ] 优化错误处理
  - [ ] 使用 React Error Boundary
  - [ ] 错误日志记录
  - [ ] 错误提示优化
- [ ] 添加操作确认对话框
  - [ ] 使用 `Dialog` 组件
  - [ ] 重要操作确认

**验收标准**：
- 网络异常时有友好提示
- 离线操作正常
- 错误处理完善

---

## 五、文件结构规划

```
apps/frontend-mobile/src/
├── pages/
│   ├── Auth/
│   │   └── Login.tsx (重构)
│   ├── Dashboard/
│   │   └── Dashboard.tsx (重构)
│   ├── ShipmentDetail/
│   │   └── ShipmentDetail.tsx (新建)
│   └── Settings/
│       └── Settings.tsx (可选，新建)
│
├── components/
│   ├── ShipmentCard/
│   │   └── ShipmentCard.tsx (新建)
│   ├── LocationTracker/
│   │   └── LocationTracker.tsx (新建)
│   ├── PODUploader/
│   │   └── PODUploader.tsx (新建)
│   ├── MapView/
│   │   └── MapView.tsx (新建)
│   └── ErrorBoundary/
│       └── ErrorBoundary.tsx (新建)
│
├── services/
│   ├── api.ts (已有，可能需要扩展)
│   ├── locationService.ts (新建)
│   └── navigationService.ts (新建)
│
├── hooks/
│   ├── useLocation.ts (新建)
│   ├── useShipments.ts (新建)
│   └── useNetworkStatus.ts (新建)
│
├── contexts/
│   ├── AuthContext.tsx (可选，新建)
│   ├── LocationContext.tsx (可选，新建)
│   └── NetworkContext.tsx (可选，新建)
│
├── types/
│   └── index.ts (已有，可能需要扩展)
│
└── utils/
    ├── imageCompress.ts (新建)
    ├── formatUtils.ts (新建)
    └── validation.ts (新建)
```

---

## 六、API 接口确认

### 6.1 已确认可用的 API

- ✅ `POST /api/auth/login` - 登录
- ✅ `GET /api/shipments/driver/me` - 获取司机运单列表
- ✅ `POST /api/shipments/:id/pickup` - 开始提货
- ✅ `POST /api/shipments/:id/transit` - 开始运输
- ✅ `POST /api/shipments/:id/delivery` - 确认送达
- ✅ `POST /api/shipments/:id/pod` - 上传 POD
- ✅ `POST /api/location/drivers/:driverId` - 更新位置

### 6.2 需要确认的 API

- ⚠️ `GET /api/shipments/:id` - 获取单个运单详情（需要确认）
- ⚠️ 位置上报是否需要认证和租户信息（需要确认）
- ⚠️ 是否有推送通知 API（需要确认）

### 6.3 需要新增的 API（如果需要）

- 📝 `GET /api/shipments/:id` - 获取单个运单详情
- 📝 `GET /api/shipments/:id/timeline` - 获取运单时间线
- 📝 `POST /api/shipments/:id/exception` - 报告异常

---

## 七、UI/UX 设计要求

### 7.1 设计原则

1. **简洁明了**
   - 移动端界面要简洁
   - 信息层次清晰
   - 避免信息过载

2. **易于操作**
   - 按钮要大，易于点击（最小 44x44px）
   - 操作流程简单
   - 减少输入操作

3. **即时反馈**
   - 操作要有明确的反馈
   - 加载状态明确
   - 成功/失败提示清晰

4. **离线友好**
   - 网络异常时要有友好提示
   - 支持离线查看（如果可能）

### 7.2 页面布局

#### 登录页面：
- 居中布局
- 大标题
- 输入框和按钮
- 错误提示区域

#### 任务列表页面：
- 顶部导航栏（标题、刷新按钮、退出按钮）
- 下拉刷新
- 运单卡片列表
- 空状态提示

#### 运单详情页面：
- 顶部导航栏（返回、标题）
- 运单信息卡片
- 操作按钮区域
- 地图区域（可选）

### 7.3 颜色方案

- **主色**：`#1890ff`（蓝色）
- **成功**：`#52c41a`（绿色）
- **警告**：`#faad14`（橙色）
- **错误**：`#f5222d`（红色）
- **文本**：`#333333`（深灰色）
- **次要文本**：`#888888`（灰色）

### 7.4 字体大小

- **标题**：20px
- **正文**：16px
- **次要文本**：14px
- **小字**：12px

---

## 八、技术难点和解决方案

### 8.1 位置上报

**难点**：
- 浏览器权限管理
- 后台运行限制
- 电池消耗

**解决方案**：
- 使用 `watchPosition` 持续跟踪
- 设置合理的上报间隔（30-60秒）
- 提供手动上报按钮作为备选
- 在设置中允许用户调整上报频率
- 低电量模式下降低上报频率

---

### 8.2 图片上传

**难点**：
- 移动端拍照权限
- 图片大小限制
- 网络不稳定

**解决方案**：
- 使用 `capture="camera"` 属性
- 实现图片压缩（使用 Canvas API）
- 添加上传重试机制
- 显示上传进度
- 支持多张图片上传

---

### 8.3 导航集成

**难点**：
- 不同设备的导航应用
- 地址格式转换

**解决方案**：
- 使用 `geo:` URI scheme（通用）
- 检测设备类型，使用对应的导航应用
- 提供多个导航选项（Google Maps、Apple Maps）
- 地址格式标准化处理

---

### 8.4 后台位置上报

**难点**：
- 浏览器后台运行限制
- Service Worker 支持有限

**解决方案**：
- 使用 Web Worker 处理后台上报
- 设置合理的上报间隔
- 提供手动上报按钮
- 在应用可见时自动上报

---

## 九、测试计划

### 9.1 功能测试

- [ ] **登录功能测试**
  - [ ] 正常登录
  - [ ] 错误密码提示
  - [ ] Token 持久化
  - [ ] 自动登录

- [ ] **任务列表加载测试**
  - [ ] 列表正常加载
  - [ ] 下拉刷新
  - [ ] 空状态显示
  - [ ] 错误处理

- [ ] **运单状态更新测试**
  - [ ] 提货状态更新
  - [ ] 运输状态更新
  - [ ] 送达状态更新
  - [ ] 状态流转验证

- [ ] **POD 上传测试**
  - [ ] 相机拍照上传
  - [ ] 相册选择上传
  - [ ] 图片压缩
  - [ ] 上传进度显示
  - [ ] 多张图片上传

- [ ] **位置上报测试**
  - [ ] 位置获取
  - [ ] 位置上报
  - [ ] 权限处理
  - [ ] 后台上报

- [ ] **导航功能测试**
  - [ ] 导航到提货地址
  - [ ] 导航到送达地址
  - [ ] 拨打电话
  - [ ] 不同设备兼容性

---

### 9.2 兼容性测试

- [ ] **iOS Safari 测试**
  - [ ] iOS 13+
  - [ ] 不同屏幕尺寸
  - [ ] 横屏/竖屏

- [ ] **Android Chrome 测试**
  - [ ] Android 8+
  - [ ] 不同屏幕尺寸
  - [ ] 横屏/竖屏

- [ ] **不同屏幕尺寸测试**
  - [ ] iPhone SE (小屏)
  - [ ] iPhone 12/13 (中屏)
  - [ ] iPhone 14 Pro Max (大屏)
  - [ ] Android 各种尺寸

---

### 9.3 性能测试

- [ ] **页面加载速度**
  - [ ] 首次加载 < 3 秒
  - [ ] 路由切换 < 1 秒

- [ ] **图片上传速度**
  - [ ] 图片压缩时间 < 2 秒
  - [ ] 上传进度准确

- [ ] **位置上报对电池的影响**
  - [ ] 上报频率合理
  - [ ] 低电量模式有效

- [ ] **网络异常处理**
  - [ ] 离线提示
  - [ ] 自动重连
  - [ ] 数据同步

---

## 十、实施优先级

### 高优先级（必须实现）

1. **UI 重构** - 使用 Ant Design Mobile 组件
2. **运单详情页面** - 完整显示运单信息
3. **实时位置上报** - 核心功能
4. **POD 上传优化** - 支持拍照和压缩

### 中优先级（重要功能）

1. **导航功能** - 提升用户体验
2. **地图集成** - 可视化地址位置
3. **下拉刷新** - 提升交互体验
4. **错误处理优化** - 提升稳定性

### 低优先级（优化功能）

1. **离线支持** - 网络异常处理
2. **推送通知** - 新任务提醒
3. **设置页面** - 个性化配置
4. **历史记录** - 查看已完成运单

---

## 十一、预期成果

### 11.1 功能完整性

- ✅ 司机可以登录移动端
- ✅ 司机可以查看任务列表
- ✅ 司机可以查看运单详情
- ✅ 司机可以更新运单状态
- ✅ 司机可以上传 POD 凭证（支持拍照）
- ✅ 司机可以实时上报位置
- ✅ 司机可以导航到地址

### 11.2 用户体验

- ✅ 界面美观，符合移动端设计规范
- ✅ 操作流畅，响应及时
- ✅ 错误提示友好
- ✅ 加载状态明确

### 11.3 技术质量

- ✅ 代码结构清晰
- ✅ 组件可复用
- ✅ 错误处理完善
- ✅ 性能优化到位

---

## 十二、时间估算

### 总体时间：10-12 个工作日

- **阶段 1：UI 重构和基础功能完善** - 3-4 天
- **阶段 2：核心功能实现** - 4-5 天
- **阶段 3：高级功能** - 2-3 天
- **阶段 4：测试和优化** - 1 天

---

## 十三、后续优化建议

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

## 十四、相关文档

- [产品需求文档](./PRODUCT_REQUIREMENT_DOCUMENT.md) - 第 27 节：司机移动端交互与权限细化
- [API 规范文档](./API_SPECIFICATION.md) - 司机相关 API
- [架构文档](./ARCHITECTURE.md) - 移动端架构设计
- [Google Maps 集成指南](./GOOGLE_MAPS_INTEGRATION.md) - 地图集成说明

---

**文档维护**：TMS 开发团队  
**最后更新**：2025-11-30T10:30:00Z

