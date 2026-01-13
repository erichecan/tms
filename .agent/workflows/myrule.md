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
