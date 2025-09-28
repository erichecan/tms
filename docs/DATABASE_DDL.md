# TMS系统数据库DDL (MySQL/Prisma)

## 数据库设计说明

本DDL基于PRD v3.0-PC版本设计，支持多租户架构，包含完整的运单生命周期管理、行程管理、客户管理等功能。

## 核心表结构

### 1. 客户表 (customers)

```sql
CREATE TABLE customers (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    default_pickup_address JSON,
    default_delivery_address JSON,
    billing_info JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_phone (phone),
    INDEX idx_name (name)
);
```

### 2. 运单表 (shipments)

```sql
CREATE TABLE shipments (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36) NOT NULL,
    shipment_no VARCHAR(20) NOT NULL UNIQUE,
    customer_id CHAR(36) NOT NULL,
    status ENUM('created', 'assigned', 'picked_up', 'in_transit', 'delivered', 'completed', 'exception', 'canceled') NOT NULL DEFAULT 'created',
    shipper_address JSON NOT NULL,
    receiver_address JSON NOT NULL,
    weight_kg DECIMAL(10,3) NOT NULL,
    length_cm DECIMAL(8,2) NOT NULL,
    width_cm DECIMAL(8,2) NOT NULL,
    height_cm DECIMAL(8,2) NOT NULL,
    description TEXT,
    tags JSON DEFAULT '[]',
    services JSON DEFAULT '{}',
    estimated_cost DECIMAL(12,2),
    pricing_components JSON DEFAULT '[]',
    pricing_rule_trace JSON DEFAULT '[]',
    final_cost DECIMAL(12,2),
    cost_currency CHAR(3) DEFAULT 'CNY',
    assigned_driver_id CHAR(36),
    assigned_vehicle_id CHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
    INDEX idx_tenant_status_created (tenant_id, status, created_at),
    INDEX idx_shipment_no (shipment_no),
    INDEX idx_customer_id (customer_id),
    INDEX idx_assigned_driver (assigned_driver_id),
    INDEX idx_assigned_vehicle (assigned_vehicle_id)
);
```

### 3. 司机表 (drivers)

```sql
CREATE TABLE drivers (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    status ENUM('available', 'busy', 'offline') NOT NULL DEFAULT 'available',
    level VARCHAR(20),
    home_city VARCHAR(50),
    current_trip_id CHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_tenant_status (tenant_id, status),
    INDEX idx_phone (phone),
    INDEX idx_current_trip (current_trip_id)
);
```

### 4. 车辆表 (vehicles)

```sql
CREATE TABLE vehicles (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36) NOT NULL,
    plate_number VARCHAR(20) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL,
    capacity_kg DECIMAL(10,3) NOT NULL,
    status ENUM('available', 'busy', 'offline', 'maintenance') NOT NULL DEFAULT 'available',
    current_trip_id CHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_tenant_status (tenant_id, status),
    INDEX idx_plate_number (plate_number),
    INDEX idx_current_trip (current_trip_id)
);
```

### 5. 行程表 (trips)

```sql
CREATE TABLE trips (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36) NOT NULL,
    trip_no VARCHAR(20) NOT NULL UNIQUE,
    status ENUM('planning', 'ongoing', 'completed', 'canceled') NOT NULL DEFAULT 'planning',
    driver_id CHAR(36) NOT NULL,
    vehicle_id CHAR(36) NOT NULL,
    legs JSON DEFAULT '[]',
    shipments JSON DEFAULT '[]',
    start_time_planned TIMESTAMP,
    end_time_planned TIMESTAMP,
    start_time_actual TIMESTAMP,
    end_time_actual TIMESTAMP,
    route_path JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE RESTRICT,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE RESTRICT,
    INDEX idx_tenant_status (tenant_id, status),
    INDEX idx_trip_no (trip_no),
    INDEX idx_driver_id (driver_id),
    INDEX idx_vehicle_id (vehicle_id)
);
```

### 6. 指派记录表 (assignments)

```sql
CREATE TABLE assignments (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36) NOT NULL,
    shipment_id CHAR(36) NOT NULL,
    driver_id CHAR(36) NOT NULL,
    vehicle_id CHAR(36) NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by CHAR(36) NOT NULL,
    type ENUM('direct', 'via_trip') NOT NULL DEFAULT 'direct',
    notes TEXT,
    
    FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE RESTRICT,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE RESTRICT,
    INDEX idx_tenant_shipment (tenant_id, shipment_id),
    INDEX idx_driver_id (driver_id),
    INDEX idx_vehicle_id (vehicle_id),
    INDEX idx_assigned_at (assigned_at)
);
```

### 7. 时间线事件表 (timeline_events)

```sql
CREATE TABLE timeline_events (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36) NOT NULL,
    shipment_id CHAR(36) NOT NULL,
    event_type ENUM('CREATED', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED', 'POD_UPLOADED', 'EXCEPTION_SET', 'EXCEPTION_RESOLVED', 'CANCELED') NOT NULL,
    from_status VARCHAR(20),
    to_status VARCHAR(20),
    actor_type ENUM('system', 'user', 'driver') NOT NULL,
    actor_id CHAR(36),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    extra JSON,
    
    FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE,
    INDEX idx_tenant_shipment_timestamp (tenant_id, shipment_id, timestamp),
    INDEX idx_event_type (event_type),
    INDEX idx_actor (actor_type, actor_id)
);
```

### 8. POD表 (proof_of_deliveries)

```sql
CREATE TABLE proof_of_deliveries (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36) NOT NULL,
    shipment_id CHAR(36) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uploaded_by CHAR(36) NOT NULL,
    note TEXT,
    
    FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE,
    INDEX idx_tenant_shipment (tenant_id, shipment_id),
    INDEX idx_uploaded_at (uploaded_at)
);
```

### 9. 通知表 (notifications)

```sql
CREATE TABLE notifications (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36) NOT NULL,
    type ENUM('ASSIGNMENT', 'STATUS_CHANGE') NOT NULL,
    target_role ENUM('DRIVER', 'FLEET_MANAGER') NOT NULL,
    shipment_id CHAR(36),
    driver_id CHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payload JSON,
    delivered BOOLEAN DEFAULT FALSE,
    
    FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE,
    INDEX idx_tenant_type (tenant_id, type),
    INDEX idx_target_role (target_role),
    INDEX idx_created_at (created_at)
);
```

### 10. 财务记录表 (financial_records)

```sql
CREATE TABLE financial_records (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36) NOT NULL,
    shipment_id CHAR(36) NOT NULL,
    type ENUM('receivable', 'payable') NOT NULL,
    party_id CHAR(36),
    amount DECIMAL(12,2) NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'CNY',
    status ENUM('pending', 'paid', 'cancelled') NOT NULL DEFAULT 'pending',
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP,
    
    FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE,
    UNIQUE KEY uk_shipment_type (shipment_id, type),
    INDEX idx_tenant_type_status (tenant_id, type, status),
    INDEX idx_party_id (party_id)
);
```

### 11. 财务组件表 (financial_components)

```sql
CREATE TABLE financial_components (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36) NOT NULL,
    financial_record_id CHAR(36) NOT NULL,
    code VARCHAR(32) NOT NULL,
    label VARCHAR(64),
    amount DECIMAL(12,2) NOT NULL,
    sequence INTEGER NOT NULL,
    
    FOREIGN KEY (financial_record_id) REFERENCES financial_records(id) ON DELETE CASCADE,
    INDEX idx_tenant_record (tenant_id, financial_record_id),
    INDEX idx_code (code)
);
```

## Prisma Schema

```prisma
// schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model Customer {
  id                      String   @id @default(cuid())
  tenantId               String
  name                   String
  phone                  String
  email                  String?
  defaultPickupAddress   Json?
  defaultDeliveryAddress Json?
  billingInfo            Json?
  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt

  // Relations
  shipments              Shipment[]

  @@index([tenantId])
  @@index([phone])
  @@index([name])
}

model Shipment {
  id                    String   @id @default(cuid())
  tenantId             String
  shipmentNo           String   @unique
  customerId           String
  status               ShipmentStatus @default(CREATED)
  shipperAddress       Json
  receiverAddress      Json
  weightKg             Decimal
  lengthCm             Decimal
  widthCm              Decimal
  heightCm             Decimal
  description          String?
  tags                 Json     @default("[]")
  services             Json     @default("{}")
  estimatedCost        Decimal?
  pricingComponents    Json     @default("[]")
  pricingRuleTrace     Json     @default("[]")
  finalCost            Decimal?
  costCurrency         String   @default("CNY")
  assignedDriverId     String?
  assignedVehicleId    String?
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  // Relations
  customer             Customer @relation(fields: [customerId], references: [id])
  assignedDriver       Driver?  @relation(fields: [assignedDriverId], references: [id])
  assignedVehicle      Vehicle? @relation(fields: [assignedVehicleId], references: [id])
  assignments          Assignment[]
  timelineEvents       TimelineEvent[]
  pods                 ProofOfDelivery[]
  notifications        Notification[]
  financialRecords     FinancialRecord[]

  @@index([tenantId, status, createdAt])
  @@index([shipmentNo])
  @@index([customerId])
  @@index([assignedDriverId])
  @@index([assignedVehicleId])
}

model Driver {
  id            String      @id @default(cuid())
  tenantId     String
  name         String
  phone        String
  status       DriverStatus @default(AVAILABLE)
  level        String?
  homeCity     String?
  currentTripId String?
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt

  // Relations
  currentTrip  Trip?       @relation(fields: [currentTripId], references: [id])
  trips        Trip[]
  assignments  Assignment[]
  notifications Notification[]
  shipments    Shipment[]

  @@index([tenantId, status])
  @@index([phone])
  @@index([currentTripId])
}

model Vehicle {
  id            String       @id @default(cuid())
  tenantId     String
  plateNumber  String       @unique
  type         String
  capacityKg   Decimal
  status       VehicleStatus @default(AVAILABLE)
  currentTripId String?
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt

  // Relations
  currentTrip  Trip?        @relation(fields: [currentTripId], references: [id])
  trips        Trip[]
  assignments  Assignment[]
  shipments    Shipment[]

  @@index([tenantId, status])
  @@index([plateNumber])
  @@index([currentTripId])
}

model Trip {
  id                String     @id @default(cuid())
  tenantId         String
  tripNo           String     @unique
  status           TripStatus @default(PLANNING)
  driverId         String
  vehicleId        String
  legs             Json       @default("[]")
  shipments        Json       @default("[]")
  startTimePlanned DateTime?
  endTimePlanned   DateTime?
  startTimeActual  DateTime?
  endTimeActual    DateTime?
  routePath        Json?
  createdAt        DateTime   @default(now())
  updatedAt        DateTime   @updatedAt

  // Relations
  driver           Driver     @relation(fields: [driverId], references: [id])
  vehicle          Vehicle    @relation(fields: [vehicleId], references: [id])
  currentDrivers   Driver[]   @relation("CurrentTrip")
  currentVehicles  Vehicle[]  @relation("CurrentTrip")

  @@index([tenantId, status])
  @@index([tripNo])
  @@index([driverId])
  @@index([vehicleId])
}

model Assignment {
  id         String        @id @default(cuid())
  tenantId  String
  shipmentId String
  driverId   String
  vehicleId  String
  assignedAt DateTime      @default(now())
  assignedBy String
  type       AssignmentType @default(DIRECT)
  notes      String?

  // Relations
  shipment   Shipment      @relation(fields: [shipmentId], references: [id], onDelete: Cascade)
  driver     Driver        @relation(fields: [driverId], references: [id])
  vehicle    Vehicle       @relation(fields: [vehicleId], references: [id])

  @@index([tenantId, shipmentId])
  @@index([driverId])
  @@index([vehicleId])
  @@index([assignedAt])
}

model TimelineEvent {
  id         String      @id @default(cuid())
  tenantId  String
  shipmentId String
  eventType  EventType
  fromStatus String?
  toStatus   String?
  actorType  ActorType
  actorId    String?
  timestamp  DateTime    @default(now())
  extra      Json?

  // Relations
  shipment   Shipment    @relation(fields: [shipmentId], references: [id], onDelete: Cascade)

  @@index([tenantId, shipmentId, timestamp])
  @@index([eventType])
  @@index([actorType, actorId])
}

model ProofOfDelivery {
  id         String   @id @default(cuid())
  tenantId  String
  shipmentId String
  filePath   String
  uploadedAt DateTime @default(now())
  uploadedBy String
  note       String?

  // Relations
  shipment   Shipment @relation(fields: [shipmentId], references: [id], onDelete: Cascade)

  @@index([tenantId, shipmentId])
  @@index([uploadedAt])
}

model Notification {
  id         String         @id @default(cuid())
  tenantId  String
  type       NotificationType
  targetRole TargetRole
  shipmentId String?
  driverId   String?
  createdAt  DateTime       @default(now())
  payload    Json?
  delivered  Boolean        @default(false)

  // Relations
  shipment   Shipment?      @relation(fields: [shipmentId], references: [id], onDelete: Cascade)
  driver     Driver?        @relation(fields: [driverId], references: [id], onDelete: Cascade)

  @@index([tenantId, type])
  @@index([targetRole])
  @@index([createdAt])
}

model FinancialRecord {
  id          String            @id @default(cuid())
  tenantId   String
  shipmentId  String
  type        FinancialType
  partyId     String?
  amount      Decimal
  currency    String            @default("CNY")
  status      FinancialStatus   @default(PENDING)
  generatedAt DateTime          @default(now())
  paidAt      DateTime?

  // Relations
  shipment    Shipment          @relation(fields: [shipmentId], references: [id], onDelete: Cascade)
  components  FinancialComponent[]

  @@unique([shipmentId, type])
  @@index([tenantId, type, status])
  @@index([partyId])
}

model FinancialComponent {
  id                String          @id @default(cuid())
  tenantId         String
  financialRecordId String
  code             String
  label            String?
  amount           Decimal
  sequence         Int

  // Relations
  financialRecord  FinancialRecord @relation(fields: [financialRecordId], references: [id], onDelete: Cascade)

  @@index([tenantId, financialRecordId])
  @@index([code])
}

// Enums
enum ShipmentStatus {
  CREATED
  ASSIGNED
  PICKED_UP
  IN_TRANSIT
  DELIVERED
  COMPLETED
  EXCEPTION
  CANCELED
}

enum DriverStatus {
  AVAILABLE
  BUSY
  OFFLINE
}

enum VehicleStatus {
  AVAILABLE
  BUSY
  OFFLINE
  MAINTENANCE
}

enum TripStatus {
  PLANNING
  ONGOING
  COMPLETED
  CANCELED
}

enum AssignmentType {
  DIRECT
  VIA_TRIP
}

enum EventType {
  CREATED
  ASSIGNED
  PICKED_UP
  IN_TRANSIT
  DELIVERED
  COMPLETED
  POD_UPLOADED
  EXCEPTION_SET
  EXCEPTION_RESOLVED
  CANCELED
}

enum ActorType {
  SYSTEM
  USER
  DRIVER
}

enum NotificationType {
  ASSIGNMENT
  STATUS_CHANGE
}

enum TargetRole {
  DRIVER
  FLEET_MANAGER
}

enum FinancialType {
  RECEIVABLE
  PAYABLE
}

enum FinancialStatus {
  PENDING
  PAID
  CANCELLED
}
```

## 索引优化建议

### 查询性能优化
1. **多租户隔离**: 所有表都包含tenant_id索引，确保查询时首先过滤租户
2. **状态查询**: 运单、司机、车辆表的状态字段建立复合索引
3. **时间序列**: 时间线事件表按时间戳降序索引，支持分页查询
4. **关联查询**: 外键字段建立索引，优化JOIN查询性能

### 数据完整性
1. **唯一约束**: 运单号、行程号、车牌号等业务唯一字段建立唯一索引
2. **外键约束**: 确保数据引用完整性，防止孤儿记录
3. **级联删除**: 相关表设置适当的级联删除规则

### 扩展性考虑
1. **JSON字段**: 使用JSON字段存储灵活的结构化数据，便于后续扩展
2. **枚举类型**: 状态字段使用枚举类型，确保数据一致性
3. **时间戳**: 所有表包含创建和更新时间戳，支持审计和版本控制

<!-- Added by assistant @ 2025-01-27 15:30:00 -->
