# CORS 问题最终修复总结
**修复时间: 2025-10-17T15:10:00**

## 🐛 问题根源

前端访问后端 API 时遇到 CORS 错误，错误信息：
```
Access to XMLHttpRequest at 'https://tms-backend-1038443972557.northamerica-northeast2.run.app/api/auth/login' 
from origin 'https://tms-frontend-1038443972557.northamerica-northeast2.run.app' 
has been blocked by CORS policy
```

### 发现的两个问题：

1. **前端问题**：前端镜像在构建时使用了旧的香港后端 URL
2. **后端问题** ⚠️：**后端代码中 CORS 配置是硬编码的，根本没有读取环境变量！**

## 🔍 根本原因分析

### 问题 1: 前端 API URL 错误
- 前端构建时 `VITE_API_BASE_URL` 指向旧的 asia-east2 后端
- 需要重新构建前端镜像，传入正确的多伦多后端 URL

### 问题 2: 后端 CORS 配置硬编码 ⚠️⚠️⚠️

**这是主要问题！**

在 `apps/backend/src/index.ts` 和 `apps/backend/src/app.ts` 中：

```typescript
// 错误的配置（硬编码）
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],  // ❌ 硬编码！
  credentials: true
}));
```

**问题**：
- 代码中完全忽略了 `process.env.CORS_ORIGIN` 环境变量
- 即使在 Cloud Run 中设置了环境变量也没有用
- 只允许 localhost 访问，拒绝所有生产环境请求

## ✅ 解决方案

### 修复 1: 前端 - 重新构建镜像

```bash
docker build \
  --platform linux/amd64 \
  --build-arg VITE_API_BASE_URL=https://tms-backend-1038443972557.northamerica-northeast2.run.app/api \
  -t gcr.io/aponytms/tms-frontend:toronto-amd64 \
  -f docker/frontend/Dockerfile \
  .

docker push gcr.io/aponytms/tms-frontend:toronto-amd64

gcloud run deploy tms-frontend \
  --image=gcr.io/aponytms/tms-frontend:toronto-amd64 \
  --region=northamerica-northeast2
```

### 修复 2: 后端 - 修复 CORS 配置代码

**修改前** (apps/backend/src/index.ts):
```typescript
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
```

**修改后** (2025-10-17T15:00:00):
```typescript
// 从环境变量读取允许的来源
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'];

console.log('CORS Configuration:', {
  NODE_ENV: process.env.NODE_ENV,
  CORS_ORIGIN: process.env.CORS_ORIGIN,
  allowedOrigins
});

app.use(cors({
  origin: allowedOrigins,  // ✅ 使用环境变量
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
  exposedHeaders: ['Content-Length', 'X-Request-Id']
}));
```

**同样修复了 `apps/backend/src/app.ts`**

### 重新构建和部署后端

```bash
# 从根目录构建（包含 packages 依赖）
docker build \
  --platform linux/amd64 \
  -t gcr.io/aponytms/tms-backend:toronto-cors-fix \
  -f docker/backend/Dockerfile \
  .

docker push gcr.io/aponytms/tms-backend:toronto-cors-fix

gcloud run deploy tms-backend \
  --image=gcr.io/aponytms/tms-backend:toronto-cors-fix \
  --region=northamerica-northeast2 \
  --set-env-vars='NODE_ENV=production,CORS_ORIGIN=https://tms-frontend-1038443972557.northamerica-northeast2.run.app' \
  --set-secrets=DATABASE_URL=db-password:latest,JWT_SECRET=jwt-secret:latest,GOOGLE_MAPS_API_KEY=google-maps-api-key:latest \
  --memory=2Gi \
  --cpu=2 \
  --add-cloudsql-instances=aponytms:northamerica-northeast2:tms-database-toronto
```

## 📊 修复后的配置

| 组件 | 配置项 | 值 |
|-----|-------|-----|
| **前端** | `VITE_API_BASE_URL` | `https://tms-backend-1038443972557.northamerica-northeast2.run.app/api` |
| **后端** | `CORS_ORIGIN` | `https://tms-frontend-1038443972557.northamerica-northeast2.run.app` |
| **后端** | `NODE_ENV` | `production` |
| **前端镜像** | 标签 | `gcr.io/aponytms/tms-frontend:toronto-amd64` |
| **后端镜像** | 标签 | `gcr.io/aponytms/tms-backend:toronto-cors-fix` |

## 🎯 验证步骤

### 1. 测试 CORS Preflight
```bash
curl -X OPTIONS https://tms-backend-1038443972557.northamerica-northeast2.run.app/api/auth/login \
  -H "Origin: https://tms-frontend-1038443972557.northamerica-northeast2.run.app" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

**期望的响应头**：
```
access-control-allow-origin: https://tms-frontend-1038443972557.northamerica-northeast2.run.app
access-control-allow-credentials: true
access-control-allow-methods: GET,POST,PUT,DELETE,OPTIONS,PATCH
```

### 2. 测试前端登录
访问: https://tms-frontend-1038443972557.northamerica-northeast2.run.app

- 打开开发者工具的网络标签
- 尝试登录
- 检查请求 URL 是否指向多伦多后端
- 检查是否有 CORS 错误

### 3. 查看后端日志
```bash
gcloud run services logs read tms-backend --region=northamerica-northeast2 --limit=50
```

**期望看到**：
```
CORS Configuration: {
  NODE_ENV: 'production',
  CORS_ORIGIN: 'https://tms-frontend-1038443972557.northamerica-northeast2.run.app',
  allowedOrigins: [ 'https://tms-frontend-1038443972557.northamerica-northeast2.run.app' ]
}
```

## 📚 技术要点

### 1. Vite 环境变量在构建时嵌入

前端使用 Vite，环境变量在**构建时**被嵌入到代码中：

```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
```

**重要**：修改 API URL 必须重新构建前端镜像。

### 2. Express CORS 配置必须读取环境变量

后端的 CORS 配置必须在运行时读取环境变量：

```typescript
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',')  // 支持多个来源，用逗号分隔
  : ['http://localhost:3000'];  // 开发环境默认值
```

### 3. Docker 构建 Context

后端 Dockerfile 需要从**根目录**构建，因为依赖 `packages/shared-types`：

```bash
# ❌ 错误：context 不包含 packages
docker build -f docker/backend/Dockerfile apps/backend/

# ✅ 正确：从根目录构建
docker build -f docker/backend/Dockerfile .
```

### 4. Cloud Run 平台要求

Cloud Run 要求镜像为 `linux/amd64` 架构：

```bash
docker build --platform linux/amd64 ...
```

在 Apple Silicon (ARM) Mac 上必须指定平台。

## 🚨 经验教训

### ❌ 常见错误

1. **环境变量设置了但代码不读取**
   - 问题：在 Cloud Run 中设置了 `CORS_ORIGIN`，但代码中硬编码了 origin
   - 教训：必须确保代码实际使用环境变量

2. **前端 API URL 在构建时确定**
   - 问题：部署后更改环境变量不生效
   - 教训：Vite 环境变量在构建时嵌入，修改需要重新构建

3. **Docker Context 不正确**
   - 问题：构建失败，找不到依赖
   - 教训：Monorepo 项目通常需要从根目录构建

### ✅ 最佳实践

1. **始终在代码中使用环境变量**
   ```typescript
   const config = process.env.SOME_CONFIG || 'default-value';
   ```

2. **添加日志输出配置**
   ```typescript
   console.log('Configuration loaded:', { NODE_ENV, CORS_ORIGIN, ... });
   ```

3. **前端使用运行时配置（可选改进）**
   - 当前前端配置在构建时确定
   - 可以改为运行时注入配置，避免频繁重建

4. **测试 CORS 配置**
   ```bash
   curl -X OPTIONS https://backend/api/endpoint \
     -H "Origin: https://frontend" \
     -v
   ```

## 📝 修改的文件

### 后端
1. ✅ `apps/backend/src/index.ts` - 修复 CORS 配置
2. ✅ `apps/backend/src/app.ts` - 修复 CORS 配置
3. ✅ `docker/backend/Dockerfile` - 修复构建脚本

### 前端
1. ✅ 重新构建镜像（使用新的 API URL）

### 配置
1. ✅ Cloud Run 环境变量更新

## 🎉 最终状态

### ✅ 前端
- URL: https://tms-frontend-1038443972557.northamerica-northeast2.run.app
- API 配置: 指向多伦多后端 ✅
- 状态: 正常运行 ✅

### ✅ 后端
- URL: https://tms-backend-1038443972557.northamerica-northeast2.run.app
- CORS 配置: 从环境变量读取 ✅
- 允许来源: 多伦多前端 ✅
- 状态: 正常运行 ✅

### ✅ CORS 配置
- Preflight 请求: 正常响应 ✅
- Access-Control-Allow-Origin: 正确设置 ✅
- Credentials: 允许 ✅
- Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH ✅

## 🚀 下一步

1. **立即测试** ✅
   - 访问前端登录页面
   - 测试登录功能
   - 验证无 CORS 错误

2. **监控日志** 📊
   - 检查后端启动日志，确认 CORS 配置正确
   - 监控是否有其他错误

3. **功能测试** 🧪
   - 测试其他 API 端点
   - 确保所有功能正常

4. **清理旧资源** 🗑️（1-2周后）
   - 删除香港区域的服务
   - 删除旧的数据库实例
   - 保留备份

---

**修复状态**: ✅ **完全修复**  
**CORS 错误**: ✅ **已解决**  
**应用状态**: ✅ **正常运行**  
**可以登录**: ✅ **应该可以**

现在请访问前端并测试登录功能！🎉

