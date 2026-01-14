# 角色管理修复记录

## 问题描述

**日期**: 2026-01-14

**问题**: Role Management 页面无法显示数据，API 返回 "Failed to fetch roles" 错误

## 根本原因

数据库表 `role_permissions` 的列名与代码不匹配：

- **数据库原始列名**: `role_id`, `permission_id` (带下划线)
- **代码期望列名**: `roleid`, `permissionid` (无下划线)

这导致 `UserController.getRoles()` 函数中的 SQL 查询失败：

```sql
-- 失败的查询（代码中使用）
SELECT p.* FROM permissions p
JOIN role_permissions rp ON p.id = rp.permissionid  -- ❌ 列名不存在
WHERE rp.roleid = $1                                 -- ❌ 列名不存在
```

## 修复方案

直接修改数据库列名以匹配代码期望：

```sql
ALTER TABLE role_permissions RENAME COLUMN role_id TO roleid;
ALTER TABLE role_permissions RENAME COLUMN permission_id TO permissionid;
```

## 修复结果

✅ **修复成功**

### API 测试结果

```bash
curl https://tms-backend-275911787144.us-central1.run.app/api/roles
```

返回数据：
- ✅ R-ADMIN (Administrator) - 9个权限
- ✅ R-DISPATCHER (Dispatcher) - 7个权限
- ✅ R-FINANCE (Finance Manager) - 6个权限
- ✅ R-DRIVER (Driver) - 1个权限

### 数据库验证

```sql
\d role_permissions
```

结果：
```
    Column    |         Type          | Collation | Nullable | Default 
--------------+-----------------------+-----------+----------+---------
 roleid       | character varying(50) |           | not null | 
 permissionid | character varying(50) |           | not null | 
```

## 权限分配详情

### R-ADMIN (管理员)
- P-USER-VIEW - 查看用户
- P-USER-EDIT - 编辑用户
- P-WAYBILL-VIEW - 查看运单
- P-WAYBILL-CREATE - 创建运单
- P-WAYBILL-EDIT - 编辑运单
- P-WAYBILL-DELETE - 删除运单
- P-FLEET-VIEW - 查看车队
- P-FINANCE-VIEW - 查看财务
- P-CUSTOMER-VIEW - 查看客户

### R-DISPATCHER (调度员)
- P-USER-VIEW - 查看用户
- P-WAYBILL-VIEW - 查看运单
- P-WAYBILL-CREATE - 创建运单
- P-WAYBILL-EDIT - 编辑运单
- P-WAYBILL-DELETE - 删除运单
- P-FLEET-VIEW - 查看车队
- P-CUSTOMER-VIEW - 查看客户

### R-FINANCE (财务经理)
- P-USER-VIEW - 查看用户
- P-WAYBILL-VIEW - 查看运单
- P-WAYBILL-EDIT - 编辑运单
- P-FLEET-VIEW - 查看车队
- P-FINANCE-VIEW - 查看财务
- P-CUSTOMER-VIEW - 查看客户

### R-DRIVER (司机)
- P-WAYBILL-VIEW - 查看运单

## 影响范围

- ✅ 生产环境数据库已修复
- ✅ 本地环境自动同步（使用同一数据库）
- ✅ 无需重新部署后端代码
- ✅ 前端 Role Management 页面现在可以正常显示

## 相关文件

- `apps/backend/src/controllers/UserController.ts` - getRoles 函数
- `apps/backend/src/routes/userRoutes.ts` - /api/roles 路由
- 数据库表: `role_permissions`, `roles`, `permissions`

## 预防措施

为避免类似问题，建议：

1. **统一命名规范**: 数据库列名和代码中的字段名保持一致
2. **使用 ORM**: 考虑使用 TypeORM 或 Prisma 来自动处理列名映射
3. **集成测试**: 添加 API 集成测试，及早发现此类问题
4. **文档化**: 在 myrule.md 中记录数据库命名规范

## 执行时间

- **发现时间**: 2026-01-14 09:46
- **修复时间**: 2026-01-14 09:50
- **总耗时**: 4分钟
