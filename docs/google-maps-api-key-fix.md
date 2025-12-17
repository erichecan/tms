# Google Maps API Key 生产环境修复

**修复时间**: 2025-01-27 18:00:00  
**问题**: 生产环境前端应用无法读取 Google Maps API Key  
**状态**: ✅ 已修复

## 一、问题描述

生产环境前端应用出现以下错误：
```
❌ [Google Maps] 配置错误: 缺少 VITE_GOOGLE_MAPS_API_KEY 配置
```

## 二、根本原因

### Vite 环境变量工作原理

1. **构建时注入**: Vite 只在构建时读取以 `VITE_` 开头的环境变量
2. **静态替换**: 环境变量会被静态替换到构建后的 JavaScript 代码中
3. **运行时不可变**: 构建后无法在运行时修改这些变量

### 问题原因

虽然我们在部署脚本中设置了从 Secret Manager 获取 API Key，但在构建 Docker 镜像时可能没有正确传递 `--build-arg VITE_GOOGLE_MAPS_API_KEY`，导致构建时环境变量为空，最终生成的代码中不包含 API Key。

## 三、修复方案

### 1. 确保构建时传递环境变量

在构建 Docker 镜像时，必须传递 `--build-arg`:

```bash
docker build \
  --build-arg VITE_GOOGLE_MAPS_API_KEY="$GOOGLE_MAPS_API_KEY_FRONTEND" \
  --build-arg VITE_API_BASE_URL=$BACKEND_URL/api \
  -f docker/frontend/Dockerfile .
```

### 2. Dockerfile 配置

`docker/frontend/Dockerfile` 已正确配置：

```dockerfile
ARG VITE_GOOGLE_MAPS_API_KEY
ENV VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY
RUN npm run build:frontend
```

### 3. 重新构建和部署

执行以下步骤：

1. 从 Secret Manager 获取 API Key
2. 构建镜像时传递 `--build-arg VITE_GOOGLE_MAPS_API_KEY`
3. 推送镜像到 Artifact Registry
4. 部署到 Cloud Run

## 四、验证方法

### 1. 检查构建日志

构建时应该看到环境变量被正确设置：
```
ARG VITE_GOOGLE_MAPS_API_KEY
ENV VITE_GOOGLE_MAPS_API_KEY=AIzaSyD2...
```

### 2. 检查构建后的代码

在浏览器中检查构建后的 JavaScript 文件，应该包含 API Key（虽然会被混淆，但应该存在）。

### 3. 浏览器控制台

访问前端应用，打开浏览器控制台，运行：
```javascript
console.log(import.meta.env.VITE_GOOGLE_MAPS_API_KEY)
```

应该显示 API Key（前几位字符）。

## 五、部署脚本更新

确保部署脚本 `scripts/gcp-deploy-auto-artifact.sh` 中包含：

```bash
# 从 Secret Manager 获取前端 API Key
GOOGLE_MAPS_API_KEY_FRONTEND=$(gcloud secrets versions access latest \
  --secret="google-maps-api-key-frontend" \
  --project=$PROJECT_ID)

# 构建时传递 API Key
docker build \
  --build-arg VITE_GOOGLE_MAPS_API_KEY="$GOOGLE_MAPS_API_KEY_FRONTEND" \
  ...
```

## 六、注意事项

1. **安全性**: API Key 会被包含在构建后的 JavaScript 代码中，这是 Google Maps 的标准做法
2. **域名限制**: 必须在 Google Cloud Console 中配置 API Key 的 HTTP 引用来源限制
3. **缓存**: 部署后可能需要清除浏览器缓存才能看到更新
4. **构建验证**: 每次部署前应验证构建参数是否正确传递

## 七、相关文档

- [Vite 环境变量文档](https://vitejs.dev/guide/env-and-mode.html)
- [Google Maps API Key 配置文档](./google-maps-api-keys-config.md)
- [GCP 部署状态文档](./gcp-deployment-status.md)
