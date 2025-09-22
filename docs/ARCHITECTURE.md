# TMS SaaS 系统架构设计文档

**创建时间：** 2025-01-27 15:30:45  
**版本：** 1.0  
**负责人：** AI Assistant

## 1. 系统概述

### 1.1 核心设计理念
- **多租户SaaS架构**：支持多个物流公司独立使用
- **规则引擎驱动**：所有业务逻辑通过json-rules-engine配置
- **微服务架构**：模块化设计，支持独立扩展
- **事件驱动**：基于事件的消息传递机制
- **数据隔离**：严格的租户数据隔离

### 1.2 技术栈选择
- **前端**：React 18 + TypeScript + Ant Design + Vite
- **后端**：Node.js + Express + TypeScript
- **数据库**：PostgreSQL 15+ (主库) + Redis (缓存)
- **规则引擎**：json-rules-engine
- **消息队列**：Redis Pub/Sub
- **认证**：JWT + RBAC
- **部署**：Docker + Kubernetes

## 2. 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer                           │
├─────────────────────────────────────────────────────────────┤
│  React App (SPA)                                           │
│  ├── 规则编辑器 (Rule Editor)                              │
│  ├── 报价管理 (Pricing)                                    │
│  ├── 运单管理 (Shipments)                                  │
│  ├── 财务对账 (Finance)                                    │
│  └── 司机薪酬 (Driver Payroll)                             │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway                              │
├─────────────────────────────────────────────────────────────┤
│  ├── 认证授权 (Auth)                                       │
│  ├── 请求路由 (Routing)                                    │
│  ├── 限流熔断 (Rate Limiting)                              │
│  └── 日志监控 (Logging)                                    │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                  Microservices Layer                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ 规则引擎服务 │ │ 报价服务    │ │ 运单服务    │           │
│  │ Rule Engine │ │ Pricing     │ │ Shipment    │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ 财务服务    │ │ 司机服务    │ │ 通知服务    │           │
│  │ Finance     │ │ Driver      │ │ Notification│           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                               │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ PostgreSQL  │ │ Redis       │ │ File Storage│           │
│  │ (主数据库)   │ │ (缓存/队列) │ │ (文件存储)   │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

## 3. 微服务划分

### 3.1 规则引擎服务 (Rule Engine Service)
**职责：**
- 管理计费规则和薪酬规则
- 提供规则执行引擎
- 规则冲突检测和验证
- 规则版本管理

**核心API：**
- `POST /api/rules` - 创建规则
- `GET /api/rules` - 获取规则列表
- `PUT /api/rules/:id` - 更新规则
- `DELETE /api/rules/:id` - 删除规则
- `POST /api/rules/validate` - 验证规则冲突
- `POST /api/rules/execute` - 执行规则

### 3.2 报价服务 (Pricing Service)
**职责：**
- 智能报价计算
- 运单费用预估
- 追加费用管理
- 客户等级管理

**核心API：**
- `POST /api/pricing/quote` - 生成报价
- `POST /api/pricing/additional-fee` - 添加追加费用
- `GET /api/pricing/history` - 报价历史

### 3.3 运单服务 (Shipment Service)
**职责：**
- 运单生命周期管理
- 司机分配和调度
- 运单状态跟踪
- 运单数据统计

**核心API：**
- `POST /api/shipments` - 创建运单
- `GET /api/shipments` - 获取运单列表
- `PUT /api/shipments/:id` - 更新运单
- `POST /api/shipments/:id/assign` - 分配司机
- `POST /api/shipments/:id/complete` - 完成运单

### 3.4 财务服务 (Finance Service)
**职责：**
- 应收账款管理
- 对账单生成
- 财务数据统计
- 支付状态跟踪

**核心API：**
- `GET /api/finance/receivables` - 应收账款列表
- `POST /api/finance/statements` - 生成对账单
- `GET /api/finance/reports` - 财务报告

### 3.5 司机服务 (Driver Service)
**职责：**
- 司机信息管理
- 薪酬计算
- 薪酬结算单生成
- 司机绩效统计

**核心API：**
- `GET /api/drivers` - 司机列表
- `POST /api/drivers/payroll` - 计算薪酬
- `POST /api/drivers/settlement` - 生成结算单
- `GET /api/drivers/performance` - 绩效统计

### 3.6 通知服务 (Notification Service)
**职责：**
- 消息推送
- 邮件通知
- 短信通知
- 系统通知

**核心API：**
- `POST /api/notifications/send` - 发送通知
- `GET /api/notifications` - 获取通知列表
- `PUT /api/notifications/:id/read` - 标记已读

## 4. 数据库设计

### 4.1 多租户数据隔离策略
采用**Schema隔离**方式，每个租户拥有独立的数据库Schema，确保数据完全隔离。

### 4.2 核心数据表设计

#### 4.2.1 租户管理
```sql
-- 租户表
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE NOT NULL,
    schema_name VARCHAR(63) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用户表
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, email)
);
```

#### 4.2.2 规则引擎相关
```sql
-- 规则表
CREATE TABLE rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL, -- 'pricing' or 'payroll'
    priority INTEGER NOT NULL,
    conditions JSONB NOT NULL,
    actions JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 规则执行日志
CREATE TABLE rule_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    rule_id UUID REFERENCES rules(id),
    context JSONB NOT NULL,
    result JSONB NOT NULL,
    execution_time INTEGER, -- 执行时间(ms)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 4.2.3 业务核心表
```sql
-- 客户表
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    level VARCHAR(50) DEFAULT 'standard', -- 'standard', 'vip', 'premium'
    contact_info JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 司机表
CREATE TABLE drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    license_number VARCHAR(50),
    vehicle_info JSONB,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 运单表
CREATE TABLE shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    shipment_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id),
    driver_id UUID REFERENCES drivers(id),
    pickup_address JSONB NOT NULL,
    delivery_address JSONB NOT NULL,
    cargo_info JSONB NOT NULL,
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    additional_fees JSONB DEFAULT '[]',
    applied_rules JSONB DEFAULT '[]',
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 财务记录表
CREATE TABLE financial_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'receivable', 'payable'
    reference_id UUID NOT NULL, -- 关联运单ID或司机ID
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'CNY',
    status VARCHAR(20) DEFAULT 'pending',
    due_date DATE,
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 5. API设计规范

### 5.1 RESTful API设计
- 使用标准HTTP方法：GET, POST, PUT, DELETE
- 统一的响应格式
- 版本控制：`/api/v1/`
- 租户隔离：所有API自动包含租户上下文

### 5.2 统一响应格式
```json
{
  "success": true,
  "data": {},
  "message": "操作成功",
  "timestamp": "2025-01-27T15:30:45Z",
  "requestId": "req_123456"
}
```

### 5.3 错误处理
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "参数验证失败",
    "details": [
      {
        "field": "email",
        "message": "邮箱格式不正确"
      }
    ]
  },
  "timestamp": "2025-01-27T15:30:45Z",
  "requestId": "req_123456"
}
```

## 6. 安全设计

### 6.1 认证授权
- JWT Token认证
- RBAC权限控制
- API密钥管理
- 多因素认证支持

### 6.2 数据安全
- 数据加密存储
- 传输层加密(HTTPS)
- 敏感数据脱敏
- 审计日志记录

### 6.3 租户隔离
- 数据库Schema隔离
- API请求租户验证
- 文件存储隔离
- 缓存数据隔离

## 7. 性能优化

### 7.1 缓存策略
- Redis缓存热点数据
- 规则引擎结果缓存
- 数据库查询结果缓存
- CDN静态资源缓存

### 7.2 数据库优化
- 索引优化
- 查询优化
- 连接池管理
- 读写分离

### 7.3 前端优化
- 代码分割
- 懒加载
- 虚拟滚动
- 图片优化

## 8. 监控和日志

### 8.1 系统监控
- 服务健康检查
- 性能指标监控
- 错误率监控
- 资源使用监控

### 8.2 业务监控
- 规则执行统计
- 报价成功率
- 运单完成率
- 财务数据监控

### 8.3 日志管理
- 结构化日志
- 日志聚合
- 错误追踪
- 审计日志

## 9. 部署架构

### 9.1 容器化部署
- Docker镜像构建
- Kubernetes编排
- 服务发现
- 负载均衡

### 9.2 环境管理
- 开发环境
- 测试环境
- 预生产环境
- 生产环境

### 9.3 CI/CD流程
- 代码提交触发
- 自动化测试
- 镜像构建
- 自动部署

## 10. 扩展性设计

### 10.1 水平扩展
- 无状态服务设计
- 数据库分片
- 缓存集群
- 消息队列集群

### 10.2 功能扩展
- 插件化架构
- 第三方集成
- API开放平台
- 微服务拆分

### 10.3 业务扩展
- 多语言支持
- 多币种支持
- 多地区部署
- 行业定制化

---

**文档状态：** 已完成  
**下一步：** 开始创建项目基础结构
