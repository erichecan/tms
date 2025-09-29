# TMS系统ER图 (Mermaid)

```mermaid
erDiagram
    Customer {
        uuid id PK
        string name
        string phone
        string email
        json defaultPickupAddress
        json defaultDeliveryAddress
        json billingInfo
        timestamp createdAt
        timestamp updatedAt
    }

    Shipment {
        uuid id PK
        string shipmentNo UK
        uuid customerId FK
        string status
        json shipperAddress
        json receiverAddress
        decimal weightKg
        decimal lengthCm
        decimal widthCm
        decimal heightCm
        string description
        json tags
        json services
        decimal estimatedCost
        json pricingComponents
        json pricingRuleTrace
        decimal finalCost
        string costCurrency
        uuid assignedDriverId FK
        uuid assignedVehicleId FK
        timestamp createdAt
        timestamp updatedAt
    }

    Driver {
        uuid id PK
        string name
        string phone
        string status
        string level
        string homeCity
        uuid currentTripId FK
        timestamp createdAt
        timestamp updatedAt
    }

    Vehicle {
        uuid id PK
        string plateNumber
        string type
        decimal capacityKg
        string status
        uuid currentTripId FK
        timestamp createdAt
        timestamp updatedAt
    }

    Trip {
        uuid id PK
        string tripNo UK
        string status
        uuid driverId FK
        uuid vehicleId FK
        json legs
        json shipments
        timestamp startTimePlanned
        timestamp endTimePlanned
        timestamp startTimeActual
        timestamp endTimeActual
        json routePath
        timestamp createdAt
        timestamp updatedAt
    }

    Assignment {
        uuid id PK
        uuid shipmentId FK
        uuid driverId FK
        uuid vehicleId FK
        timestamp assignedAt
        uuid assignedBy
        string type
        string notes
    }

    TimelineEvent {
        uuid id PK
        uuid shipmentId FK
        string eventType
        string fromStatus
        string toStatus
        string actorType
        uuid actorId
        timestamp timestamp
        json extra
    }

    POD {
        uuid id PK
        uuid shipmentId FK
        string filePath
        timestamp uploadedAt
        uuid uploadedBy
        string note
    }

    Notification {
        uuid id PK
        string type
        string targetRole
        uuid shipmentId FK
        uuid driverId FK
        timestamp createdAt
        json payload
        boolean delivered
    }

    FinancialRecord {
        uuid id PK
        uuid shipmentId FK
        string type
        uuid partyId
        decimal amount
        string currency
        string status
        timestamp generatedAt
        timestamp paidAt
    }

    FinancialComponent {
        uuid id PK
        uuid financialRecordId FK
        string code
        string label
        decimal amount
        integer sequence
    }

    %% 关系定义
    Customer ||--o{ Shipment : "creates"
    Shipment ||--o{ Assignment : "has"
    Shipment ||--o{ TimelineEvent : "tracks"
    Shipment ||--o{ POD : "has"
    Shipment ||--o{ Notification : "triggers"
    Shipment ||--o{ FinancialRecord : "generates"
    
    Driver ||--o{ Assignment : "assigned_to"
    Driver ||--o{ Trip : "drives"
    Driver ||--o{ Notification : "receives"
    
    Vehicle ||--o{ Assignment : "assigned_to"
    Vehicle ||--o{ Trip : "used_in"
    
    Trip ||--o{ Shipment : "contains"
    
    FinancialRecord ||--o{ FinancialComponent : "composed_of"
```

## 实体说明

### 核心实体
- **Customer**: 客户信息，包含默认地址
- **Shipment**: 运单主表，包含状态和费用信息
- **Driver**: 司机信息，包含当前状态和行程
- **Vehicle**: 车辆信息，包含载重和状态
- **Trip**: 行程表，支持多运单挂载

### 关联实体
- **Assignment**: 指派记录，记录运单与司机/车辆的关联
- **TimelineEvent**: 时间线事件，记录状态变更历史
- **POD**: 签收凭证，存储上传的图片
- **Notification**: 通知记录，支持多种通知类型

### 财务实体
- **FinancialRecord**: 财务记录，应收/应付
- **FinancialComponent**: 财务组件，费用分解

## 关键关系
1. 一个客户可以有多个运单
2. 一个运单可以指派给一个司机和一辆车
3. 一个行程可以包含多个运单（联程/多段）
4. 一个司机/车辆在特定时间只能属于一个行程
5. 运单状态变更会生成时间线事件
6. 运单完成会生成财务记录

<!-- Added by assistant @ 2025-09-29 09:12:36 15:30:00 -->
