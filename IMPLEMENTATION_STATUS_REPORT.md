# TMS 车队位置跟踪和调度优化实施报告
**日期:** 2025-10-17  
**状态:** 进行中 - 50% 完成

---

## 📊 任务完成情况

### ✅ 已完成的任务

#### 1. ✅ 创建数据库迁移脚本（添加位置字段）
**文件:** `database_migrations/001_add_location_tracking.sql`

**包含内容:**
- 为 `vehicles`, `drivers`, `trips` 表添加 `current_location` 和 `last_location_update` 字段
- 创建 `location_tracking` 历史表，记录位置轨迹
- 创建索引优化查询性能
- 创建视图 `v_realtime_tracking` 用于实时位置概览
- 创建函数 `calculate_distance()` 计算两点距离

#### 2. ✅ 生成测试数据脚本
**文件:** `database_migrations/002_generate_test_data.sql`

**数据内容:**
- 10个租户（包括 TMS Demo Company, Toronto Logistics, Express Delivery等）
- 10个用户（管理员、调度员、司机等角色）
- 10个客户（Walmart, Costco, Canadian Tire等，使用真实多伦多地址）
- 10个车辆（带真实多伦多地区位置信息）
- 10个司机（带真实位置信息）
- 10个运单（使用真实多伦多地址坐标）
- 10个行程（含位置和路线信息）
- 10条规则、分配、通知、时间线事件、财务记录、对账单等

所有地址使用**真实多伦多坐标**（43.65-43.77°N, -79.23~-79.46°W）

#### 3. ✅ 去掉车队管理中的实时跟踪二级导航
**文件:** `apps/frontend/src/pages/FleetManagement/FleetManagement.tsx`

- 移除了"实时跟踪"标签页
- 保留主车队管理页面（包含地图显示）
- 保留"司机薪酬"和"车辆维护"标签页

#### 4. ✅ 实现后端位置更新和查询 API
**文件:** `apps/backend/src/routes/locationRoutes.ts`

**API 端点:**
- `POST /api/location/vehicles/:vehicleId` - 更新车辆位置
- `POST /api/location/drivers/:driverId` - 更新司机位置
- `GET /api/location/realtime` - 获取所有实时位置
- `GET /api/location/history/:entityType/:entityId` - 获取历史轨迹
- `POST /api/location/bulk-update` - 批量更新位置（用于模拟器）

**特点:**
- 自动更新 `current_location` 字段
- 记录历史轨迹到 `location_tracking` 表
- 支持多租户隔离
- 完整的错误处理和日志记录

#### 5. ✅ 更新前端 API service 添加位置相关方法
**文件:** `apps/frontend/src/services/api.ts`

**新增 API:**
```typescript
locationApi.getRealTimeLocations()
locationApi.updateVehicleLocation(vehicleId, location)
locationApi.updateDriverLocation(driverId, location)
locationApi.getLocationHistory(entityType, entityId, params)
locationApi.bulkUpdateLocations(updates)
```

---

## ⏳ 待完成的任务

### 6. 🔄 修改 RealTimeTracking 组件使用真实 API
**当前状态:** 使用硬编码模拟数据（北京坐标）  
**需要:** 替换为 `locationApi.getRealTimeLocations()` 调用

### 7. 🔄 修改 FleetManagement 页面使用真实位置数据
**当前状态:** 尝试从数据中提取位置，但数据库字段不存在  
**需要:** 修改数据提取逻辑，使用新的 `current_location` 字段

### 8. 🔄 集成 Distance Matrix API 到调度算法
**当前状态:** 前端使用哈弗辛公式（直线距离），后端已实现但未使用  
**需要:** 修改 `apps/frontend/src/algorithms/dispatch.ts` 使用 `mapsService.calculateDistanceMatrix()`

### 9. 🔄 构建并部署更新到 GCP
**需要执行:**
- 构建后端镜像
- 构建前端镜像
- 部署到 Cloud Run

### 10. 🔄 测试所有功能并验证

---

## ⚠️ 重要：数据库迁移执行说明

由于 Cloud SQL Import 遇到权限问题，需要**手动执行数据库迁移**。

### 方法 A: 使用 Cloud SQL Proxy（推荐）

```bash
# 1. 启动 Cloud SQL Proxy
cloud_sql_proxy -instances=aponytms:northamerica-northeast2:tms-database-toronto=tcp:5432

# 2. 在另一个终端执行迁移
cd /Users/apony-it/Desktop/tms

# 执行第一个迁移（添加字段）
PGPASSWORD='LeD7g2RjvH9sk6PZ0LC3pi0HDFE25pqp4sAFZhzNPFo=' psql \
  -h 127.0.0.1 \
  -p 5432 \
  -U tms_user \
  -d tms_db \
  -f database_migrations/001_add_location_tracking.sql

# 执行第二个迁移（生成测试数据）
PGPASSWORD='LeD7g2RjvH9sk6PZ0LC3pi0HDFE25pqp4sAFZhzNPFo=' psql \
  -h 127.0.0.1 \
  -p 5432 \
  -U tms_user \
  -d tms_db \
  -f database_migrations/002_generate_test_data.sql
```

### 方法 B: 使用 Cloud Run Job

创建一个 Cloud Run Job 来执行迁移脚本（在 VPC 内运行）：

```bash
# 1. 创建迁移 Docker 镜像
cd /Users/apony-it/Desktop/tms
docker build -t gcr.io/aponytms/db-migrator:latest -f - . << 'EOF'
FROM postgres:15-alpine
COPY database_migrations/*.sql /migrations/
WORKDIR /migrations
CMD ["sh", "-c", "psql $DATABASE_URL -f 001_add_location_tracking.sql && psql $DATABASE_URL -f 002_generate_test_data.sql"]
EOF

# 2. 推送镜像
docker push gcr.io/aponytms/db-migrator:latest

# 3. 创建并运行 Cloud Run Job
gcloud run jobs create db-migration \
  --image=gcr.io/aponytms/db-migrator:latest \
  --region=northamerica-northeast2 \
  --set-secrets=DATABASE_URL=database-url:latest \
  --execute-now
```

### 方法 C: 使用 Cloud Shell

```bash
# 1. 在 Cloud Console 打开 Cloud Shell
# 2. 连接到 Cloud SQL
gcloud sql connect tms-database-toronto --user=postgres --database=tms_db

# 3. 在 psql 中直接粘贴 SQL 脚本内容
```

---

## 🔍 验证数据库迁移

执行迁移后，验证数据是否正确：

```sql
-- 检查表结构
\d+ vehicles
\d+ drivers
\d+ trips
\d+ location_tracking

-- 检查数据数量
SELECT 'tenants' as table_name, COUNT(*) FROM tenants
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'customers', COUNT(*) FROM customers
UNION ALL
SELECT 'vehicles', COUNT(*) FROM vehicles
UNION ALL
SELECT 'drivers', COUNT(*) FROM drivers
UNION ALL
SELECT 'shipments', COUNT(*) FROM shipments
UNION ALL
SELECT 'trips', COUNT(*) FROM trips
UNION ALL
SELECT 'location_tracking', COUNT(*) FROM location_tracking;

-- 检查位置数据
SELECT 
  id, 
  plate_number, 
  current_location,
  last_location_update
FROM vehicles
WHERE current_location IS NOT NULL
LIMIT 5;
```

预期结果：
- `vehicles`, `drivers`, `trips` 表有 `current_location` 字段
- 每个表至少有 10 条记录
- `location_tracking` 表有约 125 条记录（5个车辆 × 25个轨迹点）
- 位置数据包含多伦多地区坐标（43.6-43.8°N, -79.5~-79.2°W）

---

## 📁 新增/修改的文件

### 数据库相关
- ✅ `database_migrations/001_add_location_tracking.sql` (新建)
- ✅ `database_migrations/002_generate_test_data.sql` (新建)
- ✅ `run_migrations.sh` (新建 - 自动化脚本)

### 后端
- ✅ `apps/backend/src/routes/locationRoutes.ts` (新建)
- ✅ `apps/backend/src/app.ts` (修改 - 添加路由)

### 前端
- ✅ `apps/frontend/src/services/api.ts` (修改 - 添加 locationApi)
- ✅ `apps/frontend/src/pages/FleetManagement/FleetManagement.tsx` (修改 - 去掉实时跟踪标签)

### 文档
- ✅ `FLEET_MAP_AND_DISPATCH_ANALYSIS.md` (新建 - 分析报告)
- ✅ `IMPLEMENTATION_STATUS_REPORT.md` (本文件)

---

## 🚀 下一步行动

### 优先级 1: 执行数据库迁移（必须）
在继续其他工作前，**必须先执行数据库迁移**，否则 API 会因为缺少字段而失败。

使用上述任一方法执行迁移脚本。

### 优先级 2: 完成剩余代码修改
1. 修改 FleetManagement 页面使用真实位置数据
2. 修改 RealTimeTracking 组件（如果还需要）
3. 集成 Distance Matrix API 到调度算法

### 优先级 3: 构建和部署
```bash
# 构建并部署后端
cd /Users/apony-it/Desktop/tms
docker build -t gcr.io/aponytms/tms-backend:location-api -f docker/backend/Dockerfile .
docker push gcr.io/aponytms/tms-backend:location-api
gcloud run deploy tms-backend --image gcr.io/aponytms/tms-backend:location-api --region northamerica-northeast2

# 构建并部署前端
docker build -t gcr.io/aponytms/tms-frontend:location-ui -f docker/frontend/Dockerfile \
  --build-arg VITE_API_BASE_URL=https://tms-backend-1038443972557.northamerica-northeast2.run.app/api \
  --build-arg VITE_GOOGLE_MAPS_API_KEY=AIzaSyBrJZAt61Nrlhe-MRY8rmE0D0i9x-0OS28 .
docker push gcr.io/aponytms/tms-frontend:location-ui
gcloud run deploy tms-frontend --image gcr.io/aponytms/tms-frontend:location-ui --region northamerica-northeast2
```

### 优先级 4: 测试和验证
1. 测试位置 API 端点
2. 验证地图显示真实位置
3. 测试调度算法使用实际距离
4. 检查地图上的标记点

---

## 💡 可选：创建位置模拟器

为了演示和测试，可以创建一个位置模拟器来自动生成车辆移动轨迹：

```typescript
// apps/frontend/src/utils/locationSimulator.ts
export class LocationSimulator {
  async simulateVehicleMovement(vehicleId: string, route: LatLng[]) {
    for (const point of route) {
      await locationApi.updateVehicleLocation(vehicleId, {
        latitude: point.lat,
        longitude: point.lng,
        speed: Math.random() * 60,
        direction: Math.random() * 360
      });
      
      await new Promise(resolve => setTimeout(resolve, 5000)); // 5秒更新一次
    }
  }
}
```

---

## 📝 备注

1. **所有位置数据使用多伦多地区坐标**，范围：43.65-43.77°N, -79.23~-79.46°W
2. **测试数据包含真实地址**：Walmart Canada (3401 Dufferin St), Costco Toronto, Canadian Tire 等
3. **密码已从 Secret Manager 获取**：`LeD7g2RjvH9sk6PZ0LC3pi0HDFE25pqp4sAFZhzNPFo=`
4. **数据库连接字符串**：`postgresql://tms_user:密码@/tms_platform?host=/cloudsql/aponytms:northamerica-northeast2:tms-database-toronto`

---

## ❓ 常见问题

### Q: 为什么 Cloud SQL Import 失败？
A: 可能是服务账号权限或 VPC 配置问题。建议使用 Cloud SQL Proxy 或 Cloud Run Job 方法。

### Q: 如何验证位置数据是否正确？
A: 部署后访问 `/api/location/realtime` 端点，应该返回包含 `current_location` 的车辆列表。

### Q: Google Maps API 成本是多少？
A: 根据分析报告，估计月成本约 $67.50，但在 Google 提供的 $200 免费额度内。

### Q: 如何添加更多测试数据？
A: 修改 `002_generate_test_data.sql` 脚本中的 INSERT 语句，增加更多记录。

---

**报告生成时间:** 2025-10-17 23:30:00  
**下次更新:** 完成剩余任务后

