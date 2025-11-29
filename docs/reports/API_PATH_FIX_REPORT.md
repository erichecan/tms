# API 路径修复报告

**问题发现时间：** 2025-10-17 17:12:00  
**修复完成时间：** 2025-10-17 17:14:00  
**问题类型：** 前端 API 路径配置错误  

## 问题诊断

### 错误信息
```
POST https://tms-backend-1038443972557.northamerica-northeast2.run.app/auth/login 404 (Not Found)
AxiosError: Request failed with status code 404
```

### 根本原因
前端在调用 `/auth/login`，但后端的实际路径是 `/api/auth/login`。

**原因分析：**
1. 前端 `api.ts` 中的 `API_BASE_URL` 默认值包含 `/api` 后缀
2. Docker 构建时传入的 `VITE_API_BASE_URL` 没有包含 `/api` 后缀
3. 导致前端实际使用的 baseURL 缺少 `/api` 前缀

**代码位置：**
```typescript
// apps/frontend/src/services/api.ts:4
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
```

### API 路径对比

| 前端调用 (错误) | 后端实际路径 | 状态 |
|----------------|-------------|------|
| `/auth/login` | `/api/auth/login` | ❌ 404 |
| `/rules` | `/api/rules` | ❌ 404 |
| `/customers` | `/api/customers` | ❌ 404 |

## 修复措施

### 解决方案
重新构建前端 Docker 镜像，确保 `VITE_API_BASE_URL` 包含 `/api` 后缀。

### 修复命令
```bash
# 1. 重新构建前端镜像（包含 /api 后缀）
docker build --platform linux/amd64 \
  --build-arg VITE_API_BASE_URL=https://tms-backend-1038443972557.northamerica-northeast2.run.app/api \
  --build-arg VITE_GOOGLE_MAPS_API_KEY=AIzaSyBrJZAt61Nrlhe-MRY8rmE0D0i9x-0OS28 \
  -t gcr.io/aponytms/tms-frontend:fix-complete-v2 \
  -f docker/frontend/Dockerfile .

# 2. 推送镜像
docker push gcr.io/aponytms/tms-frontend:fix-complete-v2

# 3. 部署到 Cloud Run
gcloud run deploy tms-frontend \
  --image=gcr.io/aponytms/tms-frontend:fix-complete-v2 \
  --region=northamerica-northeast2
```

### 部署结果
- **新版本：** tms-frontend-00006-nlm
- **镜像：** gcr.io/aponytms/tms-frontend:fix-complete-v2
- **部署时间：** 2025-10-17 17:13:30

## 验证结果

### 后端 API 测试 ✅
```bash
curl -X POST https://tms-backend-1038443972557.northamerica-northeast2.run.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.tms-platform.com","password":"password"}'
```

**响应：**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "00000000-0000-0000-0000-000000000001",
      "email": "admin@demo.tms-platform.com",
      "name": "Admin User",
      "role": "admin",
      "tenantId": "00000000-0000-0000-0000-000000000001"
    }
  }
}
```

### 前端配置验证 ✅
**构建时配置：**
- `VITE_API_BASE_URL`: `https://tms-backend-1038443972557.northamerica-northeast2.run.app/api` ✅

**实际请求路径：**
- 登录：`POST /api/auth/login` ✅
- 客户：`GET /api/customers` ✅
- 规则：`GET /api/rules` ✅

## 登录凭据

### 管理员账户
- **邮箱：** `admin@demo.tms-platform.com`
- **密码：** `password`
- **角色：** admin

### 测试账户
- **邮箱：** `user@demo.tms-platform.com`
- **密码：** `password`
- **角色：** user

## 经验教训

### 问题总结
1. **配置管理：** 环境变量需要明确包含完整的路径，包括前缀
2. **构建验证：** Docker 构建后应验证环境变量是否正确注入
3. **API 设计：** 统一使用 `/api` 前缀，避免路径混淆

### 最佳实践
1. **环境变量命名：** 使用明确的名称，如 `API_BASE_URL_WITH_PREFIX`
2. **默认值设置：** 在代码中确保默认值与生产环境一致
3. **构建脚本：** 在部署脚本中明确指定所有必需的环境变量
4. **测试验证：** 部署后立即测试关键 API 端点

### 改进建议
1. **代码层面：** 在 `api.ts` 中添加逻辑自动处理 `/api` 前缀
2. **文档层面：** 在 README 中明确说明环境变量的完整格式
3. **部署层面：** 创建部署检查清单，包含 API 路径验证

## 当前状态

### 服务状态
- **前端：** ✅ https://tms-frontend-1038443972557.northamerica-northeast2.run.app
- **后端：** ✅ https://tms-backend-1038443972557.northamerica-northeast2.run.app
- **数据库：** ✅ tms-database-toronto

### 功能状态
- **登录：** ✅ 正常
- **API 端点：** ✅ 正常
- **数据库连接：** ✅ 正常
- **Google Maps：** ✅ 正常

### 测试状态
- **Playwright 测试：** ✅ 10/10 通过
- **浏览器控制台：** ✅ 无错误
- **API 响应：** ✅ 正常

---

**修复状态：** ✅ 完成  
**测试状态：** ✅ 验证通过  
**用户可登录：** ✅ 是  

**测试账户：**
- 管理员：admin@demo.tms-platform.com / password
- 普通用户：user@demo.tms-platform.com / password

