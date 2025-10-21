# 数据库初始化指南

本指南说明如何初始化 TMS 数据库并生成测试数据。

## 前提条件

- 已部署 Cloud SQL 实例：`aponytms:asia-east2:tms-database`
- 已安装 `psql` 客户端工具
- 已下载 Cloud SQL Proxy

## 步骤1: 下载 Cloud SQL Proxy

```bash
cd /Users/apony-it/Desktop/tms

# 如果还没有下载，执行以下命令
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.0/cloud-sql-proxy.darwin.amd64
chmod +x cloud-sql-proxy
```

## 步骤2: 启动 Cloud SQL Proxy

在一个终端窗口中运行：

```bash
cd /Users/apony-it/Desktop/tms
./cloud-sql-proxy --port 5433 aponytms:asia-east2:tms-database
```

保持这个窗口打开。

## 步骤3: 执行数据库初始化脚本

在另一个终端窗口中执行：

```bash
cd /Users/apony-it/Desktop/tms

# 设置数据库连接信息
export PGHOST=localhost
export PGPORT=5433
export PGUSER=tms_user
export PGDATABASE=tms_platform

# 提示输入密码，然后执行初始化脚本
psql -f complete_database_init.sql
```

## 步骤4: 生成测试数据

```bash
cd /Users/apony-it/Desktop/tms

# 执行测试数据生成脚本
psql -f generate_test_data_with_locations.sql
```

## 步骤5: 验证数据

```bash
# 检查表数量
psql -c "SELECT 
    'Tenants: ' || COUNT(*) FROM tenants
    UNION ALL
    SELECT 'Users: ' || COUNT(*) FROM users
    UNION ALL
    SELECT 'Customers: ' || COUNT(*) FROM customers
    UNION ALL
    SELECT 'Vehicles: ' || COUNT(*) FROM vehicles
    UNION ALL
    SELECT 'Drivers: ' || COUNT(*) FROM drivers
    UNION ALL
    SELECT 'Shipments: ' || COUNT(*) FROM shipments;"
```

预期结果：每个表应该有 10 条记录。

## 生成的测试数据

### 测试账号

所有测试账号的密码都是：`password`（请登录后立即修改）

**管理员账号**:
- 邮箱: `admin@demo.tms-platform.com`
- 角色: admin

**调度员账号**:
- 邮箱: `dispatcher@demo.tms-platform.com`
- 角色: dispatcher

**司机账号**:
- 邮箱: `driver@demo.tms-platform.com`
- 角色: driver

### 测试数据包含的表

每个表都生成了 10 条测试数据：

1. ✅ **Tenants** (租户) - 10 条
2. ✅ **Users** (用户) - 10 条
3. ✅ **Customers** (客户) - 10 条，包含完整位置信息（多伦多地区）
4. ✅ **Vehicles** (车辆) - 10 条
5. ✅ **Drivers** (司机) - 10 条
6. ✅ **Shipments** (运单) - 10 条，包含取货和送货位置信息
7. ✅ **Assignments** (分配) - 10 条
8. ✅ **Notifications** (通知) - 10 条
9. ✅ **Timeline Events** (时间线事件) - 10 条，包含位置信息
10. ✅ **Financial Records** (财务记录) - 10 条
11. ✅ **Statements** (对账单) - 10 条
12. ✅ **Proof of Delivery** (签收证明) - 10 条
13. ✅ **Rules** (规则) - 10 条
14. ✅ **Rule Executions** (规则执行) - 10 条

### 位置信息说明

测试数据中的位置信息均为真实的多伦多地区地址，包括：

**客户地址**:
- Walmart Canada (3401 Dufferin St, North York)
- Costco Toronto (1411 Warden Ave, Scarborough)
- Canadian Tire (839 Yonge St, Toronto)
- Home Depot (50 Bloor St W, Toronto)
- IKEA Toronto (15 Provost Dr, North York)
- Best Buy Toronto (2200 Yonge St, Toronto)
- Sobeys (595 Bay St, Toronto)
- Metro Grocery (87 Front St E, Toronto)
- Loblaws (60 Carlton St, Toronto)
- Shoppers Drug Mart (123 King St W, Toronto)

每个地址都包含：
- 完整街道地址
- 城市、省份、邮政编码
- 精确的纬度和经度坐标

**运单位置信息**:
- `pickup_address`: 包含取货地址的完整信息和坐标
- `delivery_address`: 包含送货地址的完整信息和坐标

**时间线事件位置**:
- 记录了货物在运输过程中的实时位置
- 包含检查点和中转站的位置信息

## 故障排查

### 无法连接到数据库

1. 检查 Cloud SQL Proxy 是否正在运行
2. 确认数据库实例名称正确
3. 检查防火墙规则

### 权限不足

如果遇到权限错误，可能需要授予 tms_user 用户权限：

```sql
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO tms_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO tms_user;
```

### 重置数据库

如果需要重新初始化：

```bash
# 删除所有表
psql -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# 重新执行初始化脚本
psql -f complete_database_init.sql
psql -f generate_test_data_with_locations.sql
```

## 备份数据

建议在初始化后立即备份：

```bash
pg_dump -h localhost -p 5433 -U tms_user -d tms_platform > backup_$(date +%Y%m%d).sql
```

## 下一步

1. 登录前端应用：https://tms-frontend-1038443972557.asia-east2.run.app
2. 使用测试账号登录
3. 修改默认密码
4. 开始使用 TMS 系统

---

**创建时间**: 2025-10-20 19:10:00


