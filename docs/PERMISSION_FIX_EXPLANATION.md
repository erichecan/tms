# 权限中间件修复说明

**修复时间**: 2025-12-11T15:20:00Z  
**问题**: dispatcher 用户访问 `/api/rules` 返回 403 Forbidden

## 🔍 问题分析

### 根本原因

权限中间件 (`apps/backend/src/middleware/authMiddleware.ts`) 只检查 `req.user.permissions`（来自数据库 `tenant_users.granted_permissions`），但没有回退到角色权限映射 (`ROLE_PERMISSIONS`)。

**问题场景**:
1. 用户登录时，`authMiddleware` 从 `tenant_users` 表读取权限
2. 如果 `tenant_users` 表中没有该用户的记录，`permissions` 数组为空
3. 权限中间件只检查 `req.user.permissions`，没有检查用户角色对应的 `ROLE_PERMISSIONS`
4. 即使 `ROLE_PERMISSIONS[DISPATCHER]` 包含 `RULES_MANAGE`，也会返回 403

### 修复方案

修改权限中间件，使其：
1. **优先使用数据库权限**: 如果 `tenant_users` 表中有权限，使用数据库权限
2. **回退到角色权限映射**: 如果数据库权限为空，使用 `ROLE_PERMISSIONS` 映射
3. **合并两者**: 将数据库权限和角色权限合并，确保所有权限都被检查

## 🔧 修复内容

### 修改文件
`apps/backend/src/middleware/authMiddleware.ts`

### 修改前
```typescript
const missing = requiredPermissions.filter(permission => {
  const candidates = [permission, ...(PERMISSION_ALIASES[permission] ?? [])];
  return !candidates.some(candidate => req.user?.permissions?.includes(candidate));
});
```

### 修改后
```typescript
// 合并数据库权限和角色权限映射
const dbPermissions = req.user?.permissions ?? [];
const userRole = req.user.role as keyof typeof ROLE_PERMISSIONS;
const rolePermissions = ROLE_PERMISSIONS[userRole]?.map(p => p.toString()) ?? [];

// 合并权限列表（去重）
const allPermissions = Array.from(new Set([...dbPermissions, ...rolePermissions]));

const missing = requiredPermissions.filter(permission => {
  const candidates = [permission, ...(PERMISSION_ALIASES[permission] ?? [])];
  return !candidates.some(candidate => allPermissions.includes(candidate));
});
```

## ✅ 修复效果

### 修复前
- dispatcher 用户如果没有 `tenant_users` 记录 → 403 Forbidden
- dispatcher 用户即使有 `tenant_users` 记录但权限为空 → 403 Forbidden

### 修复后
- dispatcher 用户即使没有 `tenant_users` 记录 → ✅ 200 OK（使用 `ROLE_PERMISSIONS[DISPATCHER]`）
- dispatcher 用户有 `tenant_users` 记录且有权限 → ✅ 200 OK（使用数据库权限）
- dispatcher 用户有 `tenant_users` 记录但权限为空 → ✅ 200 OK（回退到 `ROLE_PERMISSIONS`）

## 📋 权限检查流程

1. **检查 admin 角色**: 如果是 admin，直接通过 ✅
2. **检查 tenant admin 角色**: 如果是 SYSTEM_ADMIN 或 TENANT_ADMIN，直接通过 ✅
3. **合并权限**:
   - 从 `req.user.permissions` 获取数据库权限
   - 从 `ROLE_PERMISSIONS[req.user.role]` 获取角色权限
   - 合并两者（去重）
4. **检查权限**: 验证合并后的权限列表是否包含所需权限

## 🎯 验证步骤

部署后，验证以下场景：

### 场景 1: dispatcher 用户有 tenant_users 记录
```bash
# 应该返回 200
curl -H "Authorization: Bearer DISPATCHER_TOKEN" \
  https://tms-backend-v4estohola-df.a.run.app/api/rules
```

### 场景 2: dispatcher 用户没有 tenant_users 记录
```bash
# 现在也应该返回 200（使用 ROLE_PERMISSIONS 映射）
curl -H "Authorization: Bearer DISPATCHER_TOKEN" \
  https://tms-backend-v4estohola-df.a.run.app/api/rules
```

### 场景 3: 无权限用户
```bash
# 应该返回 403
curl -H "Authorization: Bearer NO_PERMISSION_TOKEN" \
  https://tms-backend-v4estohola-df.a.run.app/api/rules
```

## 📝 日志输出

修复后，权限检查会输出详细日志：

```
Permission check for user dispatcher@example.com: 
  role=dispatcher, 
  dbPermissions=[rules:manage], 
  rolePermissions=[shipment:read, shipment:update, ..., rules:manage], 
  allPermissions=[shipment:read, shipment:update, ..., rules:manage]
```

这有助于调试权限问题。

## ✨ 总结

修复后的权限中间件现在支持：
1. ✅ 数据库权限（`tenant_users.granted_permissions`）
2. ✅ 角色权限映射（`ROLE_PERMISSIONS`）
3. ✅ 两者合并，确保权限检查的完整性

这确保了即使 `tenant_users` 表中没有记录，dispatcher 用户也能通过角色权限映射访问规则管理功能。
