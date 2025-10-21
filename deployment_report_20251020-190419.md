# TMS 平台部署报告

**部署时间**: 2025-10-20 19:10:00  
**构建ID**: 20251020-190419  
**项目ID**: aponytms  
**区域**: asia-east2  
**部署状态**: ✅ 成功

---

## 📊 部署概览

本次部署成功将 TMS（运输管理系统）平台部署到 Google Cloud Platform，包括：
- ✅ 后端服务 (Cloud Run)
- ✅ 前端服务 (Cloud Run)
- ✅ 数据库初始化脚本准备完成
- ✅ 测试数据生成脚本准备完成

---

## 🚀 部署服务详情

### 后端服务

**服务信息**:
- **服务名称**: tms-backend
- **服务URL**: https://tms-backend-1038443972557.asia-east2.run.app
- **健康检查**: ✅ 通过 (HTTP 200)
- **镜像**: gcr.io/aponytms/tms-backend:20251020-190419
- **版本**: tms-backend-00002-v8l

**配置详情**:
- **内存**: 2Gi
- **CPU**: 2 核
- **最小实例**: 1
- **最大实例**: 10
- **超时**: 300s
- **端口**: 8080

**环境变量**:
- `NODE_ENV=production`
- `CORS_ORIGIN=https://tms-frontend-1038443972557.asia-east2.run.app`

**密钥配置** (从 Secret Manager 注入):
- `DATABASE_URL` (latest)
- `JWT_SECRET` (latest)
- `GOOGLE_MAPS_API_KEY` (latest)

**Cloud SQL 连接**:
- 实例: `aponytms:asia-east2:tms-database`
- 通过 Unix socket 连接

### 前端服务

**服务信息**:
- **服务名称**: tms-frontend
- **服务URL**: https://tms-frontend-1038443972557.asia-east2.run.app
- **访问检查**: ✅ 可访问 (HTTP 200)
- **镜像**: gcr.io/aponytms/tms-frontend:20251020-190419
- **版本**: tms-frontend-00001-f85

**配置详情**:
- **内存**: 512Mi
- **CPU**: 1 核
- **最小实例**: 0
- **最大实例**: 5
- **超时**: 60s
- **端口**: 80

**环境变量**:
- `VITE_API_BASE_URL=https://tms-backend-1038443972557.asia-east2.run.app`

---

## 💾 数据库信息

### Cloud SQL 实例

- **实例名称**: tms-database
- **项目**: aponytms
- **区域**: asia-east2
- **连接方式**: Cloud SQL Proxy (Unix socket)
- **数据库名**: tms_platform
- **用户**: tms_user

### 数据库初始化

数据库初始化脚本已准备就绪：
- ✅ `complete_database_init.sql` - 完整的数据库 schema
- ✅ `generate_test_data_with_locations.sql` - 测试数据生成脚本

**执行步骤**：请参考 `database_init_guide.md`

---

## 📝 测试数据

已准备生成以下测试数据（每个表10条记录）：

### 核心业务表

| 表名 | 记录数 | 包含位置信息 | 说明 |
|------|--------|--------------|------|
| Tenants | 10 | - | 租户信息，包含 10 个测试公司 |
| Users | 10 | - | 用户账号，包含管理员、调度员、司机等角色 |
| Customers | 10 | ✅ | 客户信息，包含多伦多地区真实地址和坐标 |
| Vehicles | 10 | - | 车辆信息，包含不同类型的运输车辆 |
| Drivers | 10 | - | 司机信息，关联到具体车辆 |
| Shipments | 10 | ✅ | 运单信息，包含完整的取货和送货位置坐标 |
| Assignments | 10 | - | 运单分配记录 |
| Notifications | 10 | - | 系统通知记录 |
| Timeline Events | 10 | ✅ | 运输时间线事件，包含途中位置信息 |
| Financial Records | 10 | - | 财务记录 |
| Statements | 10 | - | 对账单 |
| Proof of Delivery | 10 | - | 签收证明 |
| Rules | 10 | - | 业务规则 |
| Rule Executions | 10 | - | 规则执行记录 |

**总计**: 140 条测试记录

### 位置信息详情

测试数据中包含真实的多伦多地区地址：

**客户地址列表**:
1. Walmart Canada - 3401 Dufferin St, North York (43.7615, -79.4635)
2. Costco Toronto - 1411 Warden Ave, Scarborough (43.7532, -79.2985)
3. Canadian Tire - 839 Yonge St, Toronto (43.6735, -79.3867)
4. Home Depot - 50 Bloor St W, Toronto (43.6707, -79.3873)
5. IKEA Toronto - 15 Provost Dr, North York (43.7735, -79.4042)
6. Best Buy Toronto - 2200 Yonge St, Toronto (43.7068, -79.3983)
7. Sobeys - 595 Bay St, Toronto (43.6559, -79.3832)
8. Metro Grocery - 87 Front St E, Toronto (43.6486, -79.3735)
9. Loblaws - 60 Carlton St, Toronto (43.6615, -79.3792)
10. Shoppers Drug Mart - 123 King St W, Toronto (43.6488, -79.3817)

每个运单都包含：
- 详细的取货地址和坐标
- 详细的送货地址和坐标
- 货物信息（重量、体积、描述）
- 预估成本和实际成本

---

## 🔑 测试账号

所有测试账号的默认密码为：`password`

⚠️ **重要**: 请在首次登录后立即修改密码！

### 管理员账号
- **邮箱**: admin@demo.tms-platform.com
- **角色**: admin
- **权限**: 完整系统管理权限

### 调度员账号
- **邮箱**: dispatcher@demo.tms-platform.com
- **角色**: dispatcher
- **权限**: 运单管理、司机调度

### 司机账号
- **邮箱**: driver@demo.tms-platform.com
- **角色**: driver
- **权限**: 查看和执行自己的运单

### 其他测试账号

还包括其他 7 个测试账号，分别属于不同的租户，可用于测试多租户功能。

---

## ✅ 部署验证

### 服务健康检查

| 服务 | URL | 状态 | HTTP 状态码 |
|------|-----|------|-------------|
| 后端 API | https://tms-backend-1038443972557.asia-east2.run.app/health | ✅ 正常 | 200 |
| 前端应用 | https://tms-frontend-1038443972557.asia-east2.run.app/ | ✅ 正常 | 200 |

### 镜像信息

| 服务 | 镜像仓库 | 标签 | 大小 |
|------|----------|------|------|
| 后端 | gcr.io/aponytms/tms-backend | 20251020-190419, latest | - |
| 前端 | gcr.io/aponytms/tms-frontend | 20251020-190419, latest | - |

---

## 📋 后续步骤

### 必须执行的步骤

1. **初始化数据库**
   ```bash
   # 参考 database_init_guide.md 执行数据库初始化
   ./cloud-sql-proxy --port 5433 aponytms:asia-east2:tms-database
   psql -h localhost -p 5433 -U tms_user -d tms_platform -f complete_database_init.sql
   psql -h localhost -p 5433 -U tms_user -d tms_platform -f generate_test_data_with_locations.sql
   ```

2. **修改默认密码**
   - 登录系统：https://tms-frontend-1038443972557.asia-east2.run.app
   - 使用测试账号登录
   - 在个人设置中修改密码

3. **配置 Google Maps API**
   - 确认 Google Maps API Key 已正确配置
   - 测试地图功能是否正常

### 建议执行的步骤

4. **配置自定义域名（可选）**
   ```bash
   # 为前端配置自定义域名
   gcloud run domain-mappings create \
     --service=tms-frontend \
     --domain=your-domain.com \
     --region=asia-east2
   
   # 为后端配置自定义域名
   gcloud run domain-mappings create \
     --service=tms-backend \
     --domain=api.your-domain.com \
     --region=asia-east2
   ```
   
   然后更新后端的 CORS_ORIGIN 环境变量

5. **设置监控和告警**
   - 在 Cloud Console 中配置 Cloud Monitoring
   - 设置告警规则：
     - 服务响应时间 > 3s
     - 错误率 > 5%
     - CPU 使用率 > 80%
     - 内存使用率 > 85%

6. **配置日志导出**
   ```bash
   # 创建日志接收器
   gcloud logging sinks create tms-logs \
     storage.googleapis.com/your-log-bucket \
     --log-filter='resource.type="cloud_run_revision"'
   ```

7. **配置数据库备份**
   - 在 Cloud SQL 中配置自动备份
   - 设置备份保留期（建议 7-30 天）
   - 测试备份恢复流程

8. **安全加固**
   - 启用 Cloud Armor（WAF）
   - 配置 IAM 角色和权限
   - 启用 VPC Service Controls
   - 设置 Secret Manager 访问控制

---

## 🔧 故障排查

### 后端服务问题

**问题：服务无法启动**
```bash
# 查看后端日志
gcloud run services logs read tms-backend --region=asia-east2 --limit=100

# 检查服务配置
gcloud run services describe tms-backend --region=asia-east2
```

**问题：数据库连接失败**
- 检查 DATABASE_URL 密钥是否正确
- 确认 Cloud SQL 实例正在运行
- 验证 Cloud SQL 连接配置

### 前端服务问题

**问题：API 请求失败**
- 检查 VITE_API_BASE_URL 环境变量
- 验证后端 CORS 配置
- 检查网络防火墙规则

**查看前端日志**:
```bash
gcloud run services logs read tms-frontend --region=asia-east2 --limit=100
```

### 数据库问题

**连接测试**:
```bash
# 使用 Cloud SQL Proxy
./cloud-sql-proxy --port 5433 aponytms:asia-east2:tms-database

# 测试连接
psql -h localhost -p 5433 -U tms_user -d tms_platform -c "SELECT version();"
```

**查看数据库日志**:
```bash
gcloud sql operations list --instance=tms-database
```

---

## 📊 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                         用户/浏览器                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  前端服务 (Cloud Run)                                        │
│  https://tms-frontend-1038443972557.asia-east2.run.app     │
│  - Nginx + React SPA                                        │
│  - 内存: 512Mi, CPU: 1                                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  后端服务 (Cloud Run)                                        │
│  https://tms-backend-1038443972557.asia-east2.run.app      │
│  - Node.js + Express API                                    │
│  - 内存: 2Gi, CPU: 2                                        │
│  - 连接到 Cloud SQL                                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Cloud SQL (PostgreSQL)                                     │
│  aponytms:asia-east2:tms-database                          │
│  - 数据库: tms_platform                                     │
│  - 用户: tms_user                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 💰 成本估算

基于当前配置的预估成本（按月）：

| 服务 | 配置 | 预估成本 (USD) |
|------|------|----------------|
| Cloud Run (Backend) | 2Gi 内存, 2 CPU, 最小1实例 | ~$50-100 |
| Cloud Run (Frontend) | 512Mi 内存, 1 CPU, 最小0实例 | ~$10-20 |
| Cloud SQL | db-f1-micro | ~$7-15 |
| Cloud Storage (GCR) | 镜像存储 | ~$5-10 |
| Secret Manager | 3 个密钥 | ~$0.06 |
| 网络流量 | 出站流量 | 变动 |
| **总计** | | **~$72-145** |

*注意：实际成本取决于使用量*

---

## 📚 相关文档

- **数据库初始化指南**: `database_init_guide.md`
- **完整数据库 Schema**: `complete_database_init.sql`
- **测试数据生成脚本**: `generate_test_data_with_locations.sql`
- **部署脚本**: `deploy_with_data.sh`
- **产品需求文档**: `docs/PRODUCT_REQUIREMENT_DOCUMENT.md`
- **技术设计文档**: `docs/TECHNICAL_DESIGN_DOCUMENT.md`
- **API 文档**: `docs/API.md`

---

## 📞 支持与联系

如有问题或需要支持，请：
1. 查看故障排查部分
2. 检查 Cloud Run 日志
3. 查阅相关文档

---

## 🎉 部署完成

恭喜！TMS 平台已成功部署到 Google Cloud Platform。

**快速开始**:
1. 访问前端：https://tms-frontend-1038443972557.asia-east2.run.app
2. 初始化数据库（参考 database_init_guide.md）
3. 使用测试账号登录（admin@demo.tms-platform.com / password）
4. 开始使用 TMS 系统！

---

**报告生成时间**: 2025-10-20 19:15:00  
**报告版本**: 1.0


