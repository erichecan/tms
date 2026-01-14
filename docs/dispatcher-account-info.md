# 调度员账户创建记录

## 账户信息

**创建时间:** 2026-01-14 14:39:10 UTC

### 登录凭证

- **邮箱:** info@aponyinc.com
- **密码:** apony27669
- **用户名:** Apony Dispatcher
- **用户ID:** U-1768401550377

### 角色与权限

**角色:** R-DISPATCHER (调度员)

**权限列表:**

| 权限ID | 权限名称 | 模块 | 描述 |
|--------|---------|------|------|
| P-CUSTOMER-VIEW | View Customers | Customers | 查看客户列表 |
| P-FLEET-VIEW | View Fleet | Fleet | 查看车队和费用 |
| P-WAYBILL-CREATE | Create Waybills | Waybills | 创建新运单 |
| P-WAYBILL-EDIT | Edit Waybills | Waybills | 编辑现有运单 |
| P-WAYBILL-VIEW | View Waybills | Waybills | 查看运单列表和详情 |

## 账户状态

- ✅ 状态: ACTIVE (活跃)
- ✅ 密码: 已使用 bcrypt 加密 (SALT_ROUNDS=10)
- ✅ 数据库: Neon PostgreSQL (远程)
- ✅ 最后登录: 2026-01-14 14:39:10

## 访问方式

### 生产环境
- URL: https://tms-frontend-275911787144.us-central1.run.app
- 邮箱: info@aponyinc.com
- 密码: apony27669

### 本地开发环境
- URL: http://localhost:5173 (前端)
- 后端: http://localhost:3001
- 邮箱: info@aponyinc.com
- 密码: apony27669

## 调度员功能

作为调度员，该账户可以：

1. **运单管理**
   - ✅ 查看所有运单
   - ✅ 创建新运单
   - ✅ 编辑运单信息
   - ✅ 分配司机和车辆

2. **客户管理**
   - ✅ 查看客户列表
   - ✅ 查看客户详情

3. **车队管理**
   - ✅ 查看车辆列表
   - ✅ 查看司机信息
   - ✅ 查看费用记录

4. **限制**
   - ❌ 无法管理用户和角色
   - ❌ 无法访问财务管理
   - ❌ 无法修改系统规则

## 技术细节

### 数据库记录

```sql
-- 用户记录
INSERT INTO users (id, name, email, password, roleid, status, lastlogin) 
VALUES (
    'U-1768401550377',
    'Apony Dispatcher',
    'info@aponyinc.com',
    '$2b$10$...',  -- bcrypt hash
    'R-DISPATCHER',
    'ACTIVE',
    '2026-01-14 14:39:10.400421'
);
```

### 密码加密

- 算法: bcrypt
- Salt Rounds: 10
- 原始密码: apony27669
- 哈希值: 已安全存储在数据库中

## 安全建议

⚠️ **重要提醒:**

1. **首次登录后修改密码**
   - 建议用户首次登录后立即修改密码
   - 使用强密码（至少8位，包含大小写字母、数字和特殊字符）

2. **密码管理**
   - 不要在多个系统使用相同密码
   - 定期更换密码（建议每3个月）
   - 不要与他人分享密码

3. **账户安全**
   - 如发现异常登录，立即联系管理员
   - 不要在公共电脑上保存登录信息
   - 使用完毕后记得退出登录

## 相关文件

- 创建脚本: `/Users/apony-it/Downloads/TMS2.0/create-dispatcher-user.ts`
- 环境配置: `/Users/apony-it/Downloads/TMS2.0/apps/backend/.env`
- 认证服务: `/Users/apony-it/Downloads/TMS2.0/apps/backend/src/services/AuthService.ts`

## 验证步骤

如需验证账户是否正常工作：

```bash
# 1. 查询用户信息
echo "SELECT id, name, email, roleid, status FROM users WHERE email = 'info@aponyinc.com';" | \
psql "postgresql://neondb_owner:npg_a0t9YKjwEkWP@ep-spring-lake-ahagh2w6-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"

# 2. 查询权限
echo "SELECT p.name FROM permissions p JOIN role_permissions rp ON p.id = rp.permissionid WHERE rp.roleid = 'R-DISPATCHER';" | \
psql "postgresql://neondb_owner:npg_a0t9YKjwEkWP@ep-spring-lake-ahagh2w6-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

## 创建者信息

- 创建人: AI Assistant
- 创建日期: 2026-01-14
- 请求人: apony-it
