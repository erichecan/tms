# 环境变量配置指南

**创建时间**: 2025-12-02  
**版本**: 1.0.0  
**用途**: 指导用户配置 Google Maps API Key 环境变量

## 一、前端环境变量配置

### 1.1 开发环境配置

在项目根目录创建或更新 `.env.local` 文件（此文件不会被提交到 Git）：

```bash
# Google Maps API Key (前端)
# 从 Google Cloud Console 获取，用于客户端地图显示和地址自动完成
# 注意：此 Key 会暴露在客户端代码中，必须设置 HTTP 引用来源限制
VITE_GOOGLE_MAPS_API_KEY=your-frontend-api-key-here
```

**重要说明**：
- 文件名必须是 `.env.local`（开发环境）或 `.env`（如果项目根目录没有其他 .env）
- 变量名必须以 `VITE_` 开头，Vite 才会在构建时注入
- 修改后需要重启开发服务器才能生效

### 1.2 验证配置

1. 启动前端开发服务器：
   ```bash
   cd apps/frontend
   npm run dev
   ```

2. 打开浏览器控制台，应该看到：
   - ✅ `Google Maps API initialized successfully` - 表示配置成功
   - ❌ `Google Maps API Key 未配置` - 表示 API Key 未设置或未正确读取

3. 检查环境变量是否加载：
   ```javascript
   // 在浏览器控制台中运行
   console.log(import.meta.env.VITE_GOOGLE_MAPS_API_KEY);
   // 应该显示您的 API Key（注意：这会暴露在控制台，这是正常的）
   ```

### 1.3 移动端配置

移动端使用相同的环境变量 `VITE_GOOGLE_MAPS_API_KEY`，配置方式相同。

## 二、后端环境变量配置

### 2.1 开发环境配置

在项目根目录的 `.env` 文件中添加或更新：

```bash
# Google Maps API Key (后端)
# 从 Google Cloud Console 获取，用于服务器端地址解析、路线规划等
# 注意：此 Key 不会暴露给客户端，建议设置 IP 地址或 API 限制
GOOGLE_MAPS_API_KEY=your-backend-api-key-here
```

**重要说明**：
- 后端环境变量不需要 `VITE_` 前缀
- 修改后需要重启后端服务器才能生效

### 2.2 验证配置

1. 启动后端服务器：
   ```bash
   cd apps/backend
   npm run dev
   ```

2. 检查后端日志，应该看到：
   ```
   Initializing MapsApiService with API Key: YES
   API Key length: 39
   ```

3. 测试 API 端点：
   ```bash
   curl -X POST http://localhost:8000/api/maps/geocode \
     -H "Content-Type: application/json" \
     -d '{"address": "Toronto, ON"}'
   ```

   如果返回地址信息，说明配置成功。

## 三、生产环境配置

### 3.1 GCP Secret Manager 配置

在生产环境中，API Key 应该存储在 GCP Secret Manager 中：

1. **创建 Secret**：
   ```bash
   # 创建前端 API Key Secret
   gcloud secrets create google-maps-api-key-frontend \
     --data-file=- <<< "your-frontend-api-key"
   
   # 创建后端 API Key Secret
   gcloud secrets create google-maps-api-key \
     --data-file=- <<< "your-backend-api-key"
   ```

2. **更新 Secret**：
   ```bash
   echo -n "your-new-api-key" | gcloud secrets versions add google-maps-api-key --data-file=-
   ```

### 3.2 Docker 构建配置

前端 Dockerfile 已经配置支持通过构建参数传递 API Key：

```dockerfile
ARG VITE_GOOGLE_MAPS_API_KEY
ENV VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY
```

构建时传递参数：
```bash
docker build \
  --build-arg VITE_GOOGLE_MAPS_API_KEY="your-frontend-api-key" \
  -t tms-frontend \
  -f docker/frontend/Dockerfile \
  .
```

### 3.3 Cloud Build 配置

`cloudbuild.yaml` 已经配置从 Secret Manager 读取 API Key：

```yaml
availableSecrets:
  secretManager:
    - versionName: projects/$PROJECT_ID/secrets/google-maps-api-key/versions/latest
      env: 'GOOGLE_MAPS_API_KEY'
```

构建步骤中会自动注入：
```yaml
- '--build-arg'
- 'VITE_GOOGLE_MAPS_API_KEY=$$GOOGLE_MAPS_API_KEY'
```

### 3.4 Cloud Run 配置

后端服务在部署时会自动从 Secret Manager 读取：

```yaml
--set-secrets=GOOGLE_MAPS_API_KEY=google-maps-api-key:latest
```

## 四、环境变量优先级

### 4.1 前端环境变量优先级

1. `.env.local`（开发环境，最高优先级）
2. `.env.development`（开发环境）
3. `.env`（所有环境）
4. 系统环境变量

### 4.2 后端环境变量优先级

1. `.env` 文件（项目根目录）
2. 系统环境变量
3. 默认值（如果有）

## 五、安全注意事项

### 5.1 前端 API Key

- ⚠️ **会暴露在客户端代码中**：这是 Google Maps 的标准做法
- ✅ **必须设置 HTTP 引用来源限制**：防止未授权使用
- ✅ **只用于客户端功能**：地图显示、地址自动完成
- ❌ **不要用于敏感操作**：敏感操作应使用后端 API Key

### 5.2 后端 API Key

- ✅ **不会暴露给客户端**：只在服务器端使用
- ✅ **建议设置 IP 限制**：如果服务器 IP 固定
- ✅ **或使用 API 限制**：只允许特定的 API
- ✅ **存储在 Secret Manager**：生产环境必须使用 Secret Manager

## 六、故障排查

### 6.1 前端 API Key 未生效

**问题**：控制台显示 "Google Maps API Key 未配置"

**解决方案**：
1. 检查 `.env.local` 文件是否存在且包含 `VITE_GOOGLE_MAPS_API_KEY`
2. 确认变量名以 `VITE_` 开头
3. 重启开发服务器
4. 检查文件路径是否正确（应在项目根目录）

### 6.2 后端 API Key 未生效

**问题**：日志显示 "API Key: NO"

**解决方案**：
1. 检查 `.env` 文件是否存在且包含 `GOOGLE_MAPS_API_KEY`
2. 确认变量名正确（不需要 `VITE_` 前缀）
3. 重启后端服务器
4. 检查环境变量加载日志

### 6.3 API Key 无效错误

**问题**：`InvalidKeyMapError` 或 `ApiNotActivatedMapError`

**解决方案**：
1. 检查 API Key 是否正确复制（没有多余空格）
2. 确认相应的 API 已启用（Maps JavaScript API、Places API 等）
3. 检查 API Key 限制设置是否正确
4. 等待 5-10 分钟让更改生效

### 6.4 域名限制错误

**问题**：`RefererNotAllowedMapError`

**解决方案**：
1. 在 Google Cloud Console 中编辑 API Key
2. 添加当前使用的域名到 HTTP 引用来源限制
3. 包括 `http://localhost:3000` 和 `http://localhost:5173`（开发环境）
4. 等待几分钟让更改生效

## 七、下一步

配置完成后，请按照以下步骤验证：

1. ✅ 验证前端环境变量已正确加载
2. ✅ 验证后端环境变量已正确加载
3. ✅ 测试地图显示功能
4. ✅ 测试地址自动完成功能
5. ✅ 测试后端 API 端点

如果遇到问题，请参考 [GOOGLE_MAPS_API_KEY_SETUP.md](GOOGLE_MAPS_API_KEY_SETUP.md) 文档。

