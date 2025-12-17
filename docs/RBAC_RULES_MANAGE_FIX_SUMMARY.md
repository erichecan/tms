# RBAC 规则管理权限修复总结

**创建时间**: 2025-12-10T20:00:00Z  
**修复内容**: 为规则管理功能添加完整的 RBAC 权限支持，包括权限树配置、调度员赋权、前端可见性控制和端到端测试

## 修复内容概览

### 1. 前端权限定义 ✅

**文件**: `apps/frontend/src/types/permissions.ts`

- ✅ 添加 `RULES_MANAGE = 'rules:manage'` 权限枚举
- ✅ 在 `DISPATCHER` 角色的权限列表中添加 `Permission.RULES_MANAGE`

**修改内容**:
```typescript
// 规则管理权限
RULES_MANAGE = 'rules:manage', // 2025-12-10T20:00:00Z Added by Assistant: 规则管理权限

// 在 DISPATCHER 角色中添加
Permission.RULES_MANAGE, // 2025-12-10T20:00:00Z Added by Assistant: 调度员可管理规则
```

### 2. 菜单配置 ✅

**文件**: `apps/frontend/src/components/Sidebar/Sidebar.tsx`

- ✅ 将规则管理菜单项的权限要求从 `Permission.SYSTEM_CONFIG` 改为 `Permission.RULES_MANAGE`
- ✅ 确保只有拥有 `rules:manage` 权限的用户才能看到规则管理菜单

**修改内容**:
```typescript
{
  key: '/admin/rules',
  icon: <SettingOutlined />,
  label: '规则管理',
  requiredPermissions: [Permission.RULES_MANAGE], // 2025-12-10T20:00:00Z Updated by Assistant: 使用 RULES_MANAGE 权限
},
```

### 3. 权限树配置 ✅

**文件**: `apps/frontend/src/components/GranularPermissions/GranularPermissions.tsx`

- ✅ 在权限树数据中添加"规则管理"模块节点
- ✅ 包含 `rules:manage` 权限子节点

**修改内容**:
```typescript
{
  id: 'P004',
  name: '规则管理',
  code: 'rules_management',
  type: 'module',
  description: '规则管理相关功能模块',
  children: [
    {
      id: 'P004-01',
      name: '规则管理',
      code: 'rules:manage',
      type: 'action',
      parentId: 'P004',
      description: '管理计费规则和司机薪酬规则',
    },
  ],
}, // 2025-12-10T20:00:00Z Added by Assistant: 添加规则管理权限节点
```

### 4. 数据库迁移 ✅

**文件**: `database_migrations/016_add_rules_manage_permission.sql`

- ✅ 为所有 `dispatcher` 角色的用户添加 `rules:manage` 权限到 `tenant_users.granted_permissions`
- ✅ 如果存在独立的权限表，插入 `rules:manage` 权限记录
- ✅ 如果存在 `role_permissions` 表，为 `dispatcher` 角色添加权限映射
- ✅ 包含验证逻辑，确保迁移成功

**执行方式**:
```bash
# 在数据库中执行迁移脚本
psql -U your_user -d your_database -f database_migrations/016_add_rules_manage_permission.sql
```

### 5. 规则管理页面权限检查 ✅

**文件**: `apps/frontend/src/pages/RuleManagement/RuleManagement.tsx`

- ✅ 在页面初始化时检查用户是否拥有 `Permission.RULES_MANAGE` 权限
- ✅ 无权限时显示 403 Forbidden 视图，不发起 API 请求
- ✅ 有权限时正常加载规则列表

**修改内容**:
```typescript
import { usePermissions } from '../../contexts/PermissionContext';
import { Permission } from '../../types/permissions';

const { hasPermission } = usePermissions();

// 权限检查，无权限时显示 Forbidden 视图
if (!hasPermission(Permission.RULES_MANAGE)) {
  return (
    <Result
      status="403"
      title="403"
      subTitle="抱歉，您没有权限访问规则管理功能。"
      icon={<LockOutlined style={{ color: '#ff4d4f' }} />}
      extra={
        <Button type="primary" onClick={() => window.location.href = '/'}>
          返回首页
        </Button>
      }
    />
  );
}
```

### 6. 后端权限中间件 ✅

**文件**: `apps/backend/src/middleware/authMiddleware.ts`

- ✅ 权限中间件已正确实现，从 `tenant_users.granted_permissions` 读取权限
- ✅ 改进错误消息，提供更详细的权限不足提示
- ✅ 支持 `rules:manage` 权限的校验

**修改内容**:
```typescript
error: { 
  code: 'FORBIDDEN', 
  message: `Insufficient permission: ${missing.join(', ')}`, // 2025-12-10T20:00:00Z Updated by Assistant: 更详细的错误消息
  details: missing 
},
```

**注意**: 后端路由 (`apps/backend/src/routes/ruleRoutes.ts`) 已经配置了 `permissionMiddleware(['rules:manage'])`，无需修改。

### 7. E2E 测试 ✅

**文件**: `tests/e2e/rules-management-permissions.spec.ts`

- ✅ 测试 dispatcher 角色能看到规则管理菜单
- ✅ 测试 dispatcher 角色能访问规则管理页面
- ✅ 测试 dispatcher 角色能成功调用规则 API（返回 200）
- ✅ 测试无权限用户看不到规则管理菜单
- ✅ 测试无权限用户直接访问规则管理页面显示 403
- ✅ 测试无权限用户调用规则 API 返回 403
- ✅ 测试权限树中包含规则管理节点

**运行测试**:
```bash
# 运行规则管理权限测试
npx playwright test tests/e2e/rules-management-permissions.spec.ts

# 运行所有 E2E 测试
npx playwright test
```

## 验证步骤

### 本地验证

1. **执行数据库迁移**:
   ```bash
   psql -U your_user -d your_database -f database_migrations/016_add_rules_manage_permission.sql
   ```

2. **启动后端服务**:
   ```bash
   cd apps/backend
   npm run dev
   ```

3. **启动前端服务**:
   ```bash
   cd apps/frontend
   npm run dev
   ```

4. **以 dispatcher 身份登录**:
   - 访问 `http://localhost:3000/login`
   - 使用 dispatcher 账号登录
   - 验证能看到"规则管理"菜单项
   - 点击进入规则管理页面，验证能正常加载规则列表（API 返回 200）

5. **以无权限用户身份登录**:
   - 使用没有 `rules:manage` 权限的用户登录
   - 验证看不到"规则管理"菜单项
   - 直接访问 `http://localhost:3000/admin/rules`，验证显示 403 Forbidden 页面

6. **验证权限树**:
   - 以管理员身份登录
   - 访问 `http://localhost:3000/admin/granular-permissions`
   - 验证权限树中包含"规则管理"节点

### 生产环境验证（GCP Cloud Run）

1. **部署前执行数据库迁移**:
   ```bash
   # 连接到生产数据库并执行迁移
   gcloud sql connect your-instance --user=your-user
   \i database_migrations/016_add_rules_manage_permission.sql
   ```

2. **部署服务**:
   ```bash
   # 部署后端
   gcloud run deploy tms-backend --source . --region asia-east2

   # 部署前端
   gcloud run deploy tms-frontend --source . --region asia-east2
   ```

3. **验证步骤**:
   - 访问生产环境管理后台
   - 以 dispatcher 身份登录
   - 验证规则管理功能可正常访问
   - 检查 API 响应状态码为 200（不是 403）

## API 端点验证

### 有权限用户（dispatcher）

```bash
# 获取规则列表
curl -X GET "https://tms-backend-275911787144.asia-east2.run.app/api/rules" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# 预期响应: 200 OK
```

### 无权限用户

```bash
# 获取规则列表
curl -X GET "https://tms-backend-275911787144.asia-east2.run.app/api/rules" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# 预期响应: 403 Forbidden
# {
#   "success": false,
#   "error": {
#     "code": "FORBIDDEN",
#     "message": "Insufficient permission: rules:manage",
#     "details": ["rules:manage"]
#   },
#   "timestamp": "2025-12-10T20:00:00.000Z",
#   "requestId": "..."
# }
```

## 相关文件清单

### 修改的文件

1. `apps/frontend/src/types/permissions.ts` - 添加权限定义
2. `apps/frontend/src/components/Sidebar/Sidebar.tsx` - 更新菜单权限要求
3. `apps/frontend/src/components/GranularPermissions/GranularPermissions.tsx` - 添加权限树节点
4. `apps/frontend/src/pages/RuleManagement/RuleManagement.tsx` - 添加权限检查
5. `apps/backend/src/middleware/authMiddleware.ts` - 改进错误消息

### 新增的文件

1. `database_migrations/016_add_rules_manage_permission.sql` - 数据库迁移脚本
2. `tests/e2e/rules-management-permissions.spec.ts` - E2E 测试文件
3. `docs/RBAC_RULES_MANAGE_FIX_SUMMARY.md` - 本文档

### 无需修改的文件（已正确配置）

1. `apps/backend/src/types/permissions.ts` - 后端权限定义（已包含 `RULES_MANAGE`）
2. `apps/backend/src/routes/ruleRoutes.ts` - 路由权限中间件（已配置 `rules:manage`）

## 提交说明

建议使用以下提交消息：

```bash
git add .
git commit -m "feat(rbac): add rules.manage permission and dispatcher authorization

- Add RULES_MANAGE permission to frontend and backend
- Grant rules:manage permission to dispatcher role
- Update menu visibility based on RULES_MANAGE permission
- Add rules management node to permission tree
- Add database migration for rules:manage permission
- Add permission check in RuleManagement page
- Improve error messages in permission middleware
- Add E2E tests for rules management permissions

Fixes: 403 error when dispatcher accesses /api/rules
Related: RBAC rules management visibility fix"
```

## 注意事项

1. **数据库迁移**: 在生产环境部署前，务必先执行数据库迁移脚本
2. **权限同步**: 确保前端和后端的权限定义保持一致
3. **测试覆盖**: 运行 E2E 测试确保所有权限场景正常工作
4. **向后兼容**: 迁移脚本使用 `ON CONFLICT DO NOTHING` 和条件检查，确保可以安全地重复执行

## 问题排查

### 问题 1: dispatcher 用户仍然看到 403

**可能原因**:
- 数据库迁移未执行
- `tenant_users` 表中没有该用户的记录
- `granted_permissions` 字段未正确更新

**解决方法**:
1. 检查迁移脚本是否执行成功
2. 查询 `tenant_users` 表确认用户权限:
   ```sql
   SELECT user_id, role, granted_permissions 
   FROM tenant_users 
   WHERE role = 'dispatcher';
   ```
3. 手动更新权限:
   ```sql
   UPDATE tenant_users
   SET granted_permissions = array_append(
     COALESCE(granted_permissions, ARRAY[]::text[]),
     'rules:manage'
   )
   WHERE user_id = 'YOUR_USER_ID';
   ```

### 问题 2: 菜单项不显示

**可能原因**:
- 前端权限检查逻辑问题
- 用户权限未正确加载

**解决方法**:
1. 检查浏览器控制台是否有错误
2. 检查 `PermissionContext` 是否正确加载用户权限
3. 验证 `localStorage` 中的用户角色和权限信息

### 问题 3: API 仍然返回 403

**可能原因**:
- 后端权限中间件未正确读取权限
- JWT token 中未包含权限信息

**解决方法**:
1. 检查后端日志，查看权限检查的详细信息
2. 验证 `req.user.permissions` 是否包含 `rules:manage`
3. 检查 `authMiddleware` 是否正确从数据库读取权限

## 总结

本次修复完整实现了规则管理功能的 RBAC 权限控制：

✅ 权限定义（前端 + 后端）  
✅ 角色权限映射（dispatcher 拥有 rules:manage）  
✅ 菜单可见性控制  
✅ 权限树配置  
✅ 页面权限检查  
✅ API 权限校验  
✅ 数据库迁移  
✅ E2E 测试覆盖  

所有修改都遵循了项目的代码规范，添加了时间戳注释，并确保了向后兼容性。
