# TMS 2.0 实施计划整合 (2026-01-21)

本文档整合了2026年1月21日下午制定的所有实施计划。

---

## 1. 修复运单创建中的客户下拉列表问题

用户反馈在运单创建页面的“账单发给 (Bill To)”下拉列表中无法看到已创建的客户。

### 根本原因
1. **响应处理**：前端 `WaybillCreate.tsx` 期望返回一个数组，但后端返回的是一个分页对象 `{ data: [...], total: ... }`。
2. **分页限制**：后端默认只返回 10 个客户，这对于下拉搜索来说太少了。

### 建议修改

#### 前端修改

**`WaybillCreate.tsx`** [修改]
- 更新获取客户的 `useEffect`：
    - 处理分页响应对象，将状态设置为 `result.data`。
    - 将获取 `limit` 增加到 `1000`，以确保所有活跃客户都能在下拉列表中显示。

### 验证计划

#### 自动化测试
- 在前端运行 `npm run lint` 以确保没有回归问题。

#### 手动验证
1. 打开“新建运单 (New Waybill)”页面。
2. 点击“账单发给 (Bill To)”下拉列表。
3. 验证客户列表是否包含除 "Ad Hoc Client" 以外的更多客户。
4. 确认在“客户管理 (Customer Management)”中新创建的客户出现在此列表中。

---

## 2. 在分配对话框中增加“添加新司机”和“添加新车辆”功能

此功能允许调度员直接从分配对话框中添加缺失的车队资源（司机或车辆），从而提高工作流效率。

### 建议修改

#### 车队表单组件

**[新增] `DriverForm.tsx`** (`apps/frontend/src/components/FleetForm/DriverForm.tsx`)
- 创建一个从 `FleetManagement.tsx` 中提取的可复用司机表单组件。
- Props: `onSuccess`, `onCancel`。

**[新增] `VehicleForm.tsx`** (`apps/frontend/src/components/FleetForm/VehicleForm.tsx`)
- 创建一个从 `FleetManagement.tsx` 中提取的可复用车辆表单组件。
- Props: `onSuccess`, `onCancel`。

#### 车队管理

**`FleetManagement.tsx`** [修改]
- 使用新的 `DriverForm` 和 `VehicleForm` 组件以减少代码重复。

#### 运单列表

**`WaybillsList.tsx`** [修改]
- 在分配模态框中的司机和车辆选择标签旁添加“新增 (Add New)”按钮。
- 实现状态切换，在选择视图和创建视图（子表单）之间切换。
- 在成功添加新司机或车辆后刷新可用资源列表。

### 验证计划

#### 手动验证
1. 打开“运单 (Waybills)”页面。
2. 选择一个运单并点击“调度 (Dispatch)”。
3. 验证“添加新司机”和“添加新车辆”按钮可见。
4. 点击“添加新司机”，填写表单并提交。
5. 验证新司机出现在下拉列表中并被选中。
6. 点击“添加新车辆”，填写表单并提交。
7. 验证新车辆出现在下拉列表中并被选中。
8. 完成分配并验证其工作正常。
9. 转到“车队 (Fleet)”页面，验证新司机和车辆是否存在。

---

## 3. 运单创建与司机交付流程优化

此计划解决了运单创建和司机交付流程中的几个问题，以提高自动化程度并修复错误。

### 建议修改

#### 前端改进

**`WaybillCreate.tsx`** [修改]
- **自动以此编号**：更改默认的 `waybillNo` 状态，使用基于时间戳的后缀（例如 `Y2601-210954`）。
- **创建时移除签名**：在运单创建期间有条件地隐藏 `SignaturePad` 组件。
- **两个模板的时间进/出**：确保 `time_in` 和 `time_out` 字段在“默认 (Default)”和“亚马逊 (Amazon)”模板（页脚部分）中均可见且可编辑。
- **亚马逊特定清单**：重新设计亚马逊模板的货物清单表格，以匹配提供的截图（7列：PRO/Carrier Ref, BOL/Vendor Ref, Vendor Name, Pallet Count, Carton Count, Unit Count, PO List）。
- **更小的操作按钮**：将“创建并完成运单 (Create & Finish Waybill)” / “更新运单 (Update Waybill)”按钮的大小减小到标准尺寸。
- **更新提交**：确保 `waybill_no` 经过清洗，并且所有新的清单和时间字段都正确保存到 `details` JSONB 列中。

**`DriverWaybillDetail.tsx`** [修改]
- **状态更新**：在 `handleUpdateStatus` 和 `handleSignatureSave` 中实现实际的 API 调用，以更新后端的运单状态。
- **记录 `time_out`**：当司机确认交付（通过签名）时，发送 `time_out`（当前时间）到后端，存储在运单的页脚信息中。
- **照片上传**：确保照片上传触发正确的 API 端点并优雅地处理错误。

#### 后端增强

**`main.ts`** (或其他相关后端文件) [修改]
- **运单编号**：在 `POST /api/waybills` 路由中添加后备逻辑，如果未提供编号则自动生成 `waybill_no`。
- **POD 照片上传**：审查并修复 `POST /api/waybills/:id/photos` 路由，确保 base64 图像正确保存到 `details` JSONB 列中。
- **运单更新**：确保 `PUT /api/waybills/:id` 路由正确处理对 `details` 字段的更新（特别是 `footerInfo.time_out` 和 `status`）。

### 验证计划

#### 手动验证
- **创建运单**：验证运单编号自动填充，且签名板隐藏。
- **司机流程**：
    1. 以司机身份登录。
    2. 开始任务（状态：`IN_TRANSIT`）。
    3. 上传照片并验证成功。
    4. 点击“已交付并签名 (Delivered & Sign)”，签名并确认。
    5. 验证运单状态变为 `DELIVERED` 并且记录了 `time_out`。
- **调度员视图**：验证运单详情中可见运单的 `time_out` 和照片。
