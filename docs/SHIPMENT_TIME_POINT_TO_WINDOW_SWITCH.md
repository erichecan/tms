# 运单创建页面时间点/时间段切换功能优化

**完成时间**: 2025-12-11T16:00:00Z  
**修改文件**: `apps/frontend/src/pages/ShipmentCreate/ShipmentCreate.tsx`

## ✅ 修改内容

### 1. 将 Checkbox 改为 Switch 组件 ✅

将取货时间和送货时间的切换控件从 `Checkbox` 改为 `Switch`，提供更直观的开关体验。

### 2. 优化 UI 显示 ✅

- **默认状态**: 显示时间点选择器（`pickupAt` / `deliveryAt`）
- **开关打开**: 显示时间段选择器（`pickupStart` / `pickupEnd` 和 `deliveryStart` / `deliveryEnd`）
- **标签说明**: 添加"时间点"和"时间段"标签，清晰显示当前状态

## 📋 修改详情

### 取货时间切换

**修改前**:
```tsx
<Checkbox
  checked={usePickupTimeWindow}
  onChange={(e) => { ... }}
>
  使用时间段 (Use Time Window)
</Checkbox>
```

**修改后**:
```tsx
<Form.Item label="取货时间类型">
  <Space>
    <span>时间点</span>
    <Switch
      checked={usePickupTimeWindow}
      onChange={(checked) => { ... }}
      data-testid="use-pickup-time-window"
    />
    <span>时间段</span>
  </Space>
</Form.Item>
```

### 送货时间切换

**修改前**:
```tsx
<Checkbox
  checked={useDeliveryTimeWindow}
  onChange={(e) => { ... }}
>
  使用时间段 (Use Time Window)
</Checkbox>
```

**修改后**:
```tsx
<Form.Item label="送货时间类型">
  <Space>
    <span>时间点</span>
    <Switch
      checked={useDeliveryTimeWindow}
      onChange={(checked) => { ... }}
      data-testid="use-delivery-time-window"
    />
    <span>时间段</span>
  </Space>
</Form.Item>
```

## 🎯 功能说明

### 默认行为（开关关闭）

- ✅ 显示**时间点**选择器
- ✅ 字段名: `pickupAt` / `deliveryAt`
- ✅ 用户选择一个具体的时间点

### 开关打开后

- ✅ 显示**时间段**选择器
- ✅ 字段名: `pickupStart` / `pickupEnd` 和 `deliveryStart` / `deliveryEnd`
- ✅ 用户选择开始时间和结束时间

### 切换逻辑

当切换开关时：
1. **切换到时间段**: 清空 `pickupAt` / `deliveryAt` 字段
2. **切换到时间点**: 清空 `pickupStart` / `pickupEnd` 和 `deliveryStart` / `deliveryEnd` 字段

## 🔍 验证步骤

1. **访问创建运单页面**
   - 登录系统
   - 进入"运单管理" -> "创建运单"

2. **验证取货时间切换**
   - ✅ 默认显示"取货时间"时间点选择器
   - ✅ 开关显示"时间点" | [开关] | "时间段"
   - ✅ 开关关闭时显示时间点选择器
   - ✅ 打开开关后显示"取货开始时间"和"取货结束时间"
   - ✅ 切换时相关字段被清空

3. **验证送货时间切换**
   - ✅ 默认显示"送货时间"时间点选择器
   - ✅ 开关显示"时间点" | [开关] | "时间段"
   - ✅ 开关关闭时显示时间点选择器
   - ✅ 打开开关后显示"送货开始时间"和"送货结束时间"
   - ✅ 切换时相关字段被清空

## 📝 技术细节

### 状态管理

```typescript
const [usePickupTimeWindow, setUsePickupTimeWindow] = useState(false);
const [useDeliveryTimeWindow, setUseDeliveryTimeWindow] = useState(false);
```

- 默认值为 `false`，表示使用时间点
- 当值为 `true` 时，显示时间段选择器

### 字段映射

**时间点模式**:
- `pickupAt`: 取货时间点
- `deliveryAt`: 送货时间点

**时间段模式**:
- `pickupStart`: 取货开始时间
- `pickupEnd`: 取货结束时间
- `deliveryStart`: 送货开始时间
- `deliveryEnd`: 送货结束时间

## ✅ 完成状态

- ✅ Checkbox 改为 Switch
- ✅ 添加"时间点"和"时间段"标签
- ✅ 默认显示时间点选择器
- ✅ 开关打开时显示时间段选择器
- ✅ 切换时清空相关字段
- ✅ 保留 data-testid 用于 E2E 测试
- ✅ 代码无 lint 错误

## 🎉 总结

运单创建页面的时间选择功能已优化为更直观的开关模式：
- **默认**: 时间点选择（更常用）
- **开关打开**: 时间段选择（适用于需要时间窗口的场景）

用户体验更加清晰，操作更加直观！
