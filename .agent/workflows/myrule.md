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

### 关键配置
- **位置**: `apps/backend/.env`
- **变量**: `DATABASE_URL`
- **格式**: `postgresql://user:password@host/dbname?sslmode=require&channel_binding=require`

### 切换数据库后
修改 `.env` 后需重启后端服务器：
- 如果使用 nodemon，输入 `rs` 重启
- 或者重新运行 `npm run dev`

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
