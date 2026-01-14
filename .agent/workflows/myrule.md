---
description: TMS 项目配置经验和调试规则
---

# TMS 项目配置和调试规则

## 1. 端口配置

### 问题
前端 API 请求报错 `net::ERR_CONNECTION_REFUSED`，请求发送到错误的端口。

### 根因
`apps/frontend/src/apiConfig.ts` 中的 `API_BASE_URL` 默认端口与后端实际运行端口不一致。

### 关键配置文件
- **后端端口**: `apps/backend/.env` 中的 `PORT` 变量（默认 8000）
- **前端 API 地址**: `apps/frontend/src/apiConfig.ts` 中的 `API_BASE_URL`

### 解决方案
确保 `apiConfig.ts` 中的默认端口与后端 `.env` 中的 `PORT` 一致：

```typescript
// apps/frontend/src/apiConfig.ts
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
```

---

## 2. 数据库配置

### ⚠️ 重要原则
**所有环境（本地开发、生产部署）必须使用同一个远程数据库**，确保数据一致性。

### 关键配置
- **位置**: `apps/backend/.env`
- **变量**: `DATABASE_URL`
- **统一数据库**: `postgresql://neondb_owner:npg_lZq2bWeJT8tO@ep-round-math-ahvyvkcx-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require`

### 标准配置内容
```env
# 生产环境数据库（所有环境统一使用）
DATABASE_URL="postgresql://neondb_owner:npg_lZq2bWeJT8tO@ep-round-math-ahvyvkcx-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"
PORT=3001
GOOGLE_MAPS_API_KEY=AIzaSyDWyRo10INN_p2op7PB9rUE-yTjB-LlxT0
JWT_SECRET=tms-production-secret-key-2026
CORS_ORIGIN=*
```

### 切换数据库后
修改 `.env` 后需重启后端服务器：
- 如果使用 nodemon，输入 `rs` 重启
- 或者重新运行 `npm run dev`

### 验证数据库连接
```bash
# 检查是否连接到正确的数据库
echo "SELECT current_database(), current_user, COUNT(*) as user_count FROM users;" | psql "$DATABASE_URL"

# 应该显示连接到生产数据库
# 主机: ep-round-math-ahvyvkcx-pooler
```

---

## 3. 启动项目检查清单

// turbo-all
1. 确认依赖已安装: `npm install` (在项目根目录)
2. 检查后端 `.env` 数据库配置
3. 检查前端 `apiConfig.ts` 端口配置
4. 启动后端: `cd apps/backend && npm run dev`
5. 启动前端: `cd apps/frontend && npm run dev`
6. 验证端口: 后端默认 8000，前端默认 5173

---

## 4. 常见问题排查

### API 连接失败
1. 检查后端是否启动 (`http://localhost:8000`)
2. 检查 `apiConfig.ts` 端口配置
3. 检查浏览器控制台错误中的端口号

### 数据库连接失败
1. 检查 `.env` 中 `DATABASE_URL` 是否正确
2. 确认 Neon 数据库是否在线
3. 重启后端服务器使配置生效

---

## 5. 国际化 (i18n) 配置

### 问题
翻译键不显示（显示为 `path.to.key`）或中英文显示不一致。

### 关键配置文件
- **配置与资源**: `apps/frontend/src/i18n.ts`

### 避坑指南
1. **嵌套结构**: 确保 `t('a.b.c')` 调用与 `i18n.ts` 中的资源层级完全匹配。
    - **错误**: 定义 `{"menu": {"view": "..."}}` 但调用 `t('waybill.menu.view')`。
    - **正确**: 确保父节点 `waybill` 存在。
2. **Missing Keys 检查**:
    - 如果新添加了页面或组件，务必在 `en` 和 `zh` 两个语言块中同时添加对应的 key。
    - 对话框、警告框（`alert`）中的字符串也应使用 `t()` 包装。
3. **i18n 文件语法**:
    - `i18n.ts` 是一个大型嵌套对象，修改时极易出现括号不匹配、属性冲突（如重复的 `modal` 键）或结尾多出分号/逗号。
    - 修改后应观察前端编译日志（`npm run dev` 终端）是否有语法错误输出。

---

## 6. 系统重置与同步

### 操作步骤
1. **释放端口**: 彻底关闭现有进程（使用 `lsof -i :8000` 找到 PID 并 `kill`，或使用 `pkill node`）。
2. **环境变量确认**: 
    - 后端 `apps/backend/.env`: `DATABASE_URL` 必须指向 Neon 远端数据库。
    - 前端 `apps/frontend/.env`: `VITE_GOOGLE_MAPS_API_KEY` 和 `VITE_API_BASE_URL` 必须正确配置。
3. **数据库迁移**: 每次环境变更或重置前，运行 `cd apps/backend && npm run migrate` 确保表结构同步。
4. **重启服务**: 先启动后端，再启动前端。

---

## 7. 数据库交互与数据同步 (Empty String vs Null)

### 问题
后端 API 报错 `DateTimeParseError` 或 `invalid input syntax for type numeric`。

### 根因
前端表单中的空字符串 `""` 传给后端后，如果直接映射到数据库的 `DATE`、`NUMERIC` 或 `UUID` 字段，PostgreSQL 会报错。

### 避坑指南
1. **日期字段**: 在存入数据库前，务必将空字符串转换为 `null`。
    - 示例: `[delivery_date || null]`
2. **数值字段**: 确保使用 `parseFloat()` 或 `parseInt()` 处理，并提供默认值 `0`。
    - 示例: `[price ? parseFloat(price) : 0]`
3. **JSONB 字段**: 确保传给数据库的是对象或 `null`，而不是 `undefined`。
4. **字段一致性**: 确保 `POST` 和 `PUT` 接口处理的字段集完全一致，避免“创建成功但更新失败”的情况。

---

## 8. Role & Permissions 数据缺失问题

### 问题
Role Management 页面显示为空，即使 User Management 中的用户都有角色分配。

### 根因
数据库迁移脚本中缺少 `permissions` 和 `role_permissions` 表的创建语句。前端调用 `/api/permissions` 和 `/api/roles` 时返回空数组。

### 解决方案
1. **创建权限表**: 在 `migrate.ts` 中添加 `permissions` 表（包含 id, name, module, description 字段）。
2. **创建关联表**: 添加 `role_permissions` 表（roleid, permissionid 作为复合主键）。
3. **种子数据**: 插入默认权限（如 P-WAYBILL-VIEW, P-FLEET-MANAGE 等）和角色-权限映射。
4. **字段名统一**: 确保 `AuthService.ts` 和 `UserController.ts` 中的 JOIN 查询使用正确的列名（`roleid` 和 `permissionid`，而非 `role_id` 和 `permission_id`）。
5. **重新迁移**: 运行 `npm run migrate` 应用表结构和种子数据。

---

## 9. 环境配置文件管理 (.env)

### ⚠️ 核心原则
**所有环境（本地、生产）必须使用同一个远程数据库**，确保：
- ✅ 数据一致性：所有开发者看到相同的数据
- ✅ 简化管理：无需同步多个数据库
- ✅ 避免错误：消除"本地能用，生产不能用"的问题

### 问题
在不同电脑上启动本地服务器时，如果 `.env` 配置不一致，会导致数据不同步。

### 根因
`.env` 文件包含敏感信息（数据库密码、API密钥），已在 `.gitignore` 中排除，不会通过 Git 同步。每台电脑需要手动创建和配置 `.env` 文件。

### 关键配置文件
- **后端环境变量**: `apps/backend/.env` (不提交到 Git)
- **配置模板**: `apps/backend/.env.example` (提交到 Git)
- **配置文档**: `docs/multi-computer-setup.md`

### 标准配置内容（统一使用）
```env
# ⚠️ 生产环境数据库 - 所有环境统一使用此配置
DATABASE_URL="postgresql://neondb_owner:npg_lZq2bWeJT8tO@ep-round-math-ahvyvkcx-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"

# 后端端口
PORT=3001

# Google Maps API 密钥
GOOGLE_MAPS_API_KEY=AIzaSyDWyRo10INN_p2op7PB9rUE-yTjB-LlxT0

# JWT 密钥（生产环境密钥）
JWT_SECRET=tms-production-secret-key-2026

# CORS 配置
CORS_ORIGIN=*
```

### 新电脑配置步骤
1. **克隆代码**: `git clone <repository-url> && cd TMS2.0`
2. **安装依赖**: `npm install`
3. **复制配置**: `cp apps/backend/.env.example apps/backend/.env`
4. **验证配置**: 确认 `DATABASE_URL` 指向生产数据库（ep-round-math-ahvyvkcx-pooler）
5. **启动服务**: `cd apps/backend && npm run dev`

### 验证数据库连接
```bash
# 检查连接的数据库（应该显示 ep-round-math-ahvyvkcx-pooler）
echo "SELECT current_database(), current_user, inet_server_addr();" | psql "$DATABASE_URL"

# 检查数据量（所有电脑应该显示相同的数字）
echo "SELECT COUNT(*) FROM users;" | psql "$DATABASE_URL"
```

### 避坑指南
1. **修改 `.env` 后必须重启**: 环境变量只在服务启动时加载，修改后需重启后端服务。
2. **不要提交 `.env` 到 Git**: 确保 `.gitignore` 包含 `.env`。
3. **使用 `.env.example` 作为模板**: 团队成员可以参考此文件配置本地环境。
4. **统一数据库配置**: ⚠️ **所有电脑必须连接同一远程数据库（生产数据库）**，不要使用本地数据库。
5. **谨慎操作**: 因为所有环境共享同一数据库，删除或修改数据时要特别小心。

---

## 10. 用户账户创建

### 问题
需要在远程数据库中创建新用户账户，密码需要使用 bcrypt 加密。

### 关键技术
- **密码加密**: 使用 `bcrypt` 库，SALT_ROUNDS=10
- **数据库操作**: 直接操作 PostgreSQL 数据库
- **角色分配**: 根据用户职责分配对应角色（R-ADMIN, R-DISPATCHER, R-DRIVER 等）

### 创建用户脚本模板
```typescript
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config({ path: './apps/backend/.env' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function createUser() {
    const client = await pool.connect();
    try {
        const email = 'user@example.com';
        const password = 'password123';
        const name = 'User Name';
        const roleId = 'R-DISPATCHER'; // 或 R-ADMIN, R-DRIVER
        
        // 检查用户是否已存在
        const existing = await client.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        
        if (existing.rows.length > 0) {
            console.log('User already exists, updating password...');
            const hashedPassword = await bcrypt.hash(password, 10);
            await client.query(
                'UPDATE users SET password = $1, roleid = $2, status = $3 WHERE email = $4',
                [hashedPassword, roleId, 'ACTIVE', email]
            );
        } else {
            // 创建新用户
            const hashedPassword = await bcrypt.hash(password, 10);
            const userId = `U-${Date.now()}`;
            
            await client.query(
                `INSERT INTO users (id, name, email, password, roleid, status, lastlogin) 
                 VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
                [userId, name, email, hashedPassword, roleId, 'ACTIVE']
            );
            
            console.log('✅ User created:', userId);
        }
    } finally {
        client.release();
        await pool.end();
    }
}

createUser();
```

### 运行脚本
```bash
# 创建用户
npx ts-node create-user.ts

# 验证用户
echo "SELECT id, name, email, roleid, status FROM users WHERE email = 'user@example.com';" | psql "$DATABASE_URL"
```

### 角色说明
| 角色ID | 角色名称 | 权限范围 |
|--------|---------|---------|
| R-ADMIN | 管理员 | 全部权限，包括用户管理、系统配置 |
| R-DISPATCHER | 调度员 | 运单管理、客户管理、车队查看 |
| R-DRIVER | 司机 | 查看分配的行程、更新状态 |
| R-FINANCE | 财务 | 财务管理、报表查看 |

### 避坑指南
1. **密码必须加密**: 永远不要在数据库中存储明文密码，使用 bcrypt 加密。
2. **检查用户是否存在**: 避免重复创建，可以选择更新现有用户。
3. **验证角色ID**: 确保 `roleId` 在 `roles` 表中存在。
4. **记录账户信息**: 创建后将账户信息记录到文档中（如 `docs/dispatcher-account-info.md`）。
5. **安全提醒**: 建议用户首次登录后修改密码。
