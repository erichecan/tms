
# 智能物流运营平台 (TMS SaaS) - API接口文档

**版本:** 3.1-PC (智能计费规则引擎完整版)
**最后更新:** 2025-09-29 09:12:36
**基础路径:** `/api/v1` (注意: 根据路由文件, 版本号可能在Nginx或Express顶层应用)
**认证方式:** 所有端点均需提供 `Authorization: Bearer <JWT>` 请求头.

---

## 模块: 运单管理 (Shipment Management)

**Controller:** `ShipmentController.ts`
**Routes:** `shipmentRoutes.ts`
**Data Models:** `packages/shared-types/src/index.ts`

### 1. 获取运单列表

- **Endpoint:** `GET /shipments`
- **描述:** 获取当前租户的运单列表, 支持丰富的分页、排序和过滤功能.
- **查询参数 (Query Parameters):**
  - `page` (number, optional, default: 1): 页码.
  - `limit` (number, optional, default: 20): 每页数量.
  - `sort` (string, optional, default: 'created_at'): 排序字段.
  - `order` ('asc' | 'desc', optional, default: 'desc'): 排序顺序.
  - `search` (string, optional): 全局模糊搜索.
  - `filters.status` (`ShipmentStatus`, optional): 按运单状态过滤.
  - `filters.customerId` (string, optional): 按客户ID过滤.
  - `filters.driverId` (string, optional): 按司机ID过滤.
  - `filters.startDate` (Date string, optional): 按创建时间的起始日期过滤.
  - `filters.endDate` (Date string, optional): 按创建时间的结束日期过滤.
- **成功响应 (200 OK):**
  - **Body:** `PaginatedResponse<Shipment>`
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "uuid-1",
        "shipmentNumber": "TMS202509110001",
        "status": "in_transit",
        "actualCost": 1300.00,
        // ... 其他 Shipment 字段
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    },
    "timestamp": "...",
    "requestId": "..."
  }
  ```

### 2. 获取单个运单详情

- **Endpoint:** `GET /shipments/:id`
- **描述:** 根据运单ID获取其详细信息.
- **路径参数 (Path Parameters):**
  - `id` (string, required): 运单的UUID.
- **成功响应 (200 OK):**
  - **Body:** `ApiResponse<Shipment>`
- **失败响应 (404 Not Found):** 如果运单不存在.

### 3. 更新运单信息

- **Endpoint:** `PUT /shipments/:id`
- **描述:** 更新一个已存在的运单. 用于少量字段的修改.
- **路径参数:**
  - `id` (string, required): 运单的UUID.
- **请求体 (`application/json`):** (所有字段均为可选)
  ```json
  {
    "status": "exception",
    "actualCost": 1550.50,
    "notes": "客户要求更改目的地, 产生额外费用."
  }
  ```
- **成功响应 (200 OK):**
  - **Body:** `ApiResponse<Shipment>` (返回更新后的运单对象).

### 4. 分配司机

- **Endpoint:** `POST /shipments/:id/assign`
- **描述:** 为一个处于 `quoted` 或 `confirmed` 状态的运单分配司机.
- **路径参数:**
  - `id` (string, required): 运单的UUID.
- **请求体 (`application/json`):**
  ```json
  {
    "driverId": "uuid-of-driver", // required
    "notes": "请在下午3点前联系客户." // optional
  }
  ```
- **成功响应 (200 OK):** 运单状态变为 `assigned`.
- **失败响应 (400 Bad Request):** 如果运单状态不正确, 或司机ID无效/不可用.

### 5. 运单状态流转 (State Machine Actions)

以下端点用于驱动运单生命周期的变化, 通常由司机或运营人员触发.

- **确认运单:** `POST /shipments/:id/confirm`
  - **描述:** 将 `quoted` 状态的运单确认为 `confirmed`.
  - **请求体:** (空)

- **开始取货:** `POST /shipments/:id/pickup`
  - **描述:** 将 `assigned` 状态的运单更新为 `picked_up`. 司机已到达取货点.
  - **请求体:** (空)

- **开始运输:** `POST /shipments/:id/transit`
  - **描述:** 将 `picked_up` 状态的运单更新为 `in_transit`. 货物已在运输途中.
  - **请求体:** (空)

- **完成配送:** `POST /shipments/:id/delivery`
  - **描述:** 将 `in_transit` 状态的运单更新为 `delivered`. 货物已送达, 等待最终确认.
  - **请求体:**
    ```json
    {
      "deliveryNotes": "收货人已签收, 货物完好." // optional
    }
    ```

- **完成运单:** `POST /shipments/:id/complete`
  - **描述:** 将 `delivered` 状态的运单最终确认为 `completed`. 这是运单的最终状态, 将触发财务结算(如司机薪酬计算).
  - **请求体:**
    ```json
    {
      "finalCost": 1280.00 // optional, 如果与预估费用不同, 可在此处提供最终确认的费用
    }
    ```

- **取消运单:** `POST /shipments/:id/cancel`
  - **描述:** 取消一个运单. 只有在 `completed` 状态之前的运单可以被取消.
  - **请求体:**
    ```json
    {
      "reason": "客户因计划变更取消订单." // required
    }
    ```

### 6. 获取运单统计

- **Endpoint:** `GET /shipments/stats`
- **描述:** 获取运单的统计数据.
- **查询参数:**
  - `startDate` (Date string, optional): 统计周期的开始日期.
  - `endDate` (Date string, optional): 统计周期的结束日期.
- **成功响应 (200 OK):**
  - **Body:** `ApiResponse<ShipmentStats>`

### 7. 获取指定司机的运单列表

- **Endpoint:** `GET /shipments/driver/:driverId`
- **描述:** 获取分配给特定司机的运单列表.
- **路径参数:**
  - `driverId` (string, required): 司机的UUID.
- **查询参数:**
  - `status` (`ShipmentStatus`, optional): 按运单状态过滤.
- **成功响应 (200 OK):**
  - **Body:** `ApiResponse<Shipment[]>`

---

## 模块: 智能计费规则引擎 (Pricing Engine)

**Controller:** `PricingEngineController.ts`
**Routes:** `pricingEngineRoutes.ts`
**Data Models:** `packages/shared-types/src/pricing-engine.ts`

### 1. 获取计费模板列表

- **Endpoint:** `GET /api/pricing/templates`
- **描述:** 获取当前租户的计费模板列表
- **查询参数:**
  - `page` (number, optional, default: 1): 页码
  - `limit` (number, optional, default: 20): 每页数量
  - `search` (string, optional): 模板名称搜索
  - `type` (string, optional): 模板类型过滤
- **成功响应 (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "template-uuid",
        "name": "标准快递计费",
        "type": "pricing",
        "description": "适用于标准快递业务的计费规则",
        "rules": [...],
        "isActive": true,
        "createdAt": "2025-09-29T09:12:36Z"
      }
    ],
    "count": 5,
    "timestamp": "2025-09-29T09:12:36Z"
  }
  ```

### 2. 创建计费模板

- **Endpoint:** `POST /api/pricing/templates`
- **描述:** 创建新的计费模板
- **请求体:**
  ```json
  {
    "name": "新模板名称",
    "type": "pricing",
    "description": "模板描述",
    "rules": [
      {
        "condition": "weight > 1000",
        "action": "addFee('HEAVY', weight * 0.2, 'CNY')",
        "priority": 1
      }
    ]
  }
  ```
- **成功响应 (201 Created):** 返回创建的模板信息

### 3. 更新计费模板

- **Endpoint:** `PUT /api/pricing/templates/:id`
- **描述:** 更新现有的计费模板
- **路径参数:**
  - `id` (string, required): 模板UUID
- **请求体:** 与创建请求相同
- **成功响应 (200 OK):** 返回更新后的模板信息

### 4. 删除计费模板

- **Endpoint:** `DELETE /api/pricing/templates/:id`
- **描述:** 删除计费模板
- **路径参数:**
  - `id` (string, required): 模板UUID
- **成功响应 (200 OK):** 删除确认

### 5. 实时费用计算

- **Endpoint:** `POST /api/pricing/calculate`
- **描述:** 基于运单信息和规则模板实时计算费用
- **请求体:**
  ```json
  {
    "templateId": "template-uuid",
    "shipmentData": {
      "weight": 1500,
      "volume": 2.5,
      "distance": 50,
      "cargoType": "GENERAL",
      "pickup": { "city": "上海" },
      "delivery": { "city": "北京" }
    }
  }
  ```
- **成功响应 (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "totalCost": 850.00,
      "currency": "CNY",
      "components": [
        {
          "code": "BASE",
          "label": "基础运费",
          "amount": 400.00,
          "calcType": "fixed"
        },
        {
          "code": "WEIGHT",
          "label": "重量附加费",
          "amount": 300.00,
          "calcType": "weight_based"
        },
        {
          "code": "DISTANCE",
          "label": "距离费用",
          "amount": 150.00,
          "calcType": "distance_based"
        }
      ],
      "calculationTrace": [...],
      "templateUsed": "template-uuid"
    },
    "timestamp": "2025-09-29T09:12:36Z"
  }
  ```

### 6. 费用预览

- **Endpoint:** `POST /api/pricing/preview`
- **描述:** 预览运单的费用计算（不保存）
- **请求体:** 与计算请求相同
- **成功响应 (200 OK):** 返回费用预览结果

### 7. 规则测试

- **Endpoint:** `POST /api/pricing/test`
- **描述:** 测试计费规则的执行结果
- **请求体:**
  ```json
  {
    "rules": [...],
    "testData": {
      "weight": 1000,
      "distance": 100
    }
  }
  ```
- **成功响应 (200 OK):** 返回测试执行结果
