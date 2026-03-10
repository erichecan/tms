# TMS 种子数据关联性规范

**目标**：种子数据是“一个实体、一个 ID”，在车队、运单指派、行程、财务应付/应收、司机端登录等模块中**同一实体使用同一 ID**，避免各表各插一套互不对应。

---

## 1. 司机 (Driver)

| 表 | 字段 | 说明 |
|----|------|------|
| `drivers` | `id` | **主数据**：D-001, D-002, D-003, D-004, D-005 |
| `trips` | `driver_id` | 必须 ∈ drivers.id（行程上的司机 = 车队中的司机） |
| `waybills` | 通过 trip_id → trips.driver_id | 指派给某司机 = 该 trip 的 driver_id |
| `financial_records` | `reference_id`（type=payable） | 应付给谁 = 某司机，reference_id = drivers.id |
| `users` | `id`（roleId=R-DRIVER） | **司机登录账号 id 必须 = drivers.id**，这样 waybills?driver_id=user.id 才能看到自己的任务 |

**约定**：至少一名司机既有 `drivers` 行又有 `users` 行且 **users.id = drivers.id**（例如 D-002 = Jerry Driver），用于移动端登录与“我的任务”一致。

---

## 2. 车辆 (Vehicle)

| 表 | 字段 | 说明 |
|----|------|------|
| `vehicles` | `id` | **主数据**：V-101 ~ V-105 |
| `trips` | `vehicle_id` | 必须 ∈ vehicles.id（行程上的车辆 = 车队中的车辆） |
| 运单指派 | 选中的车辆 id | 来自 GET /api/vehicles，即 vehicles.id |

**约定**：行程管理、运单指派、车队管理中的车辆列表均来自同一张表 `vehicles`，ID 一致。

---

## 3. 客户 (Customer)

| 表 | 字段 | 说明 |
|----|------|------|
| `customers` | `id` | **主数据**：C-01, C-02, C-03 |
| `waybills` | `customer_id` | 必须 ∈ customers.id（运单上的客户 = 客户主数据） |
| `financial_records` | `reference_id`（type=receivable） | 向谁收款 = 某客户，reference_id = customers.id |

**约定**：创建运单时选择的客户、应收里的客户，与客户管理中的客户为同一批 ID。

---

## 4. 当前种子 ID 一览（规范用）

- **Drivers**: D-001 (James), D-002 (Robert/Jerry 登录), D-003 (Michael), D-004 (William), D-005 (David)
- **Vehicles**: V-101 ~ V-105
- **Customers**: C-01 (Apony Prime), C-02 (Global Logistics), C-03 (Retail Giant)
- **Users**: U-01 (Tom 调度), **D-002** (Jerry 司机，与 drivers.id 一致)
- **Trips**: T-1001 (D-001, V-101), T-1002 (D-003, V-103) — 仅当 trips 表空时插入
- **Waybills**: WB-001 (C-01, T-1001), WB-004 (C-03, T-1002), WB-002/WB-003 (C-02/C-01, 无 trip)

新增种子时请保持：**司机/车辆/客户只以 drivers/vehicles/customers 为主数据，其余表只存外键 ID**。

---

## 5. 一致性校验

运行 `npm run check:seed`（或 `ts-node scripts/seed-consistency-check.ts`）会检查：

- **默认（仅种子）**：只校验种子数据（运单 WB-001～WB-004、行程 T-1001/T-1002 等），迁移后跑一次即可确认种子关联正确。
- **全表**：`CHECK_SCOPE=all npm run check:seed` 会校验所有运单/行程/应付/应收，用于发现历史错误数据（如 customer_id 存成名称的脏数据）。

1. 所有 `trips.driver_id` ∈ `drivers.id`
2. 所有 `trips.vehicle_id` ∈ `vehicles.id`
3. 所有 `waybills.customer_id` ∈ `customers.id`
4. 所有 `waybills.trip_id` ∈ `trips.id` 或 NULL
5. 所有 R-DRIVER 用户：`users.id` ∈ `drivers.id`
6. 所有应付记录：`reference_id` ∈ `drivers.id`
7. 所有应收记录：`reference_id` ∈ `customers.id`

任一违反则脚本退出码 1，并打印违反项。
