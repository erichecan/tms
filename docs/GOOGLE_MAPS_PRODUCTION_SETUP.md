# Google Maps API 生产环境配置指南

**创建时间**: 2025-12-02  
**版本**: 1.0.0  
**用途**: 指导用户配置生产环境的 Google Maps API Key

## 一、概述

生产环境配置包括：
1. 在 GCP Secret Manager 中存储 API Key
2. 配置 Cloud Build 从 Secret Manager 读取 API Key
3. 配置 Cloud Run 服务使用 Secret Manager 中的 API Key

## 二、GCP Secret Manager 配置

### 2.1 创建 Secret

#### 创建后端 API Key Secret

```bash
# 方式 1：从文件创建
echo -n "your-backend-api-key" | gcloud secrets create google-maps-api-key \
  --data-file=- \
  --replication-policy="automatic"

# 方式 2：交互式创建
gcloud secrets create google-maps-api-key \
  --replication-policy="automatic"
# 然后输入 API Key
```

#### 创建前端 API Key Secret（可选，如果前端和后端使用不同的 Key）

```bash
# 如果前端和后端使用不同的 API Key
echo -n "your-frontend-api-key" | gcloud secrets create google-maps-api-key-frontend \
  --data-file=- \
  --replication-policy="automatic"
```

### 2.2 更新 Secret

如果需要更新 API Key：

```bash
# 更新后端 API Key
echo -n "your-new-backend-api-key" | gcloud secrets versions add google-maps-api-key \
  --data-file=-

# 更新前端 API Key（如果使用不同的 Secret）
echo -n "your-new-frontend-api-key" | gcloud secrets versions add google-maps-api-key-frontend \
  --data-file=-
```

### 2.3 验证 Secret

```bash
# 查看 Secret 列表
gcloud secrets list

# 查看 Secret 详情
gcloud secrets describe google-maps-api-key

# 查看 Secret 版本
gcloud secrets versions list google-maps-api-key

# 访问 Secret 值（需要权限）
gcloud secrets versions access latest --secret="google-maps-api-key"
```

### 2.4 设置权限

确保 Cloud Build 和 Cloud Run 服务账号有权限访问 Secret：

```bash
# 获取项目编号
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")

# 授予 Cloud Build 服务账号权限
gcloud secrets add-iam-policy-binding google-maps-api-key \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# 授予 Cloud Run 服务账号权限
gcloud secrets add-iam-policy-binding google-maps-api-key \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

## 三、Cloud Build 配置

### 3.1 当前配置

`cloudbuild.yaml` 已经配置好从 Secret Manager 读取 API Key：

```yaml
# 密钥配置
availableSecrets:
  secretManager:
    - versionName: projects/$PROJECT_ID/secrets/google-maps-api-key/versions/latest
      env: 'GOOGLE_MAPS_API_KEY'

# 构建步骤中使用
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: 
      - '--build-arg'
      - 'VITE_GOOGLE_MAPS_API_KEY=$$GOOGLE_MAPS_API_KEY'
    secretEnv: ['GOOGLE_MAPS_API_KEY']
```

### 3.2 如果前端和后端使用不同的 API Key

如果需要为前端和后端使用不同的 API Key，需要更新配置：

```yaml
availableSecrets:
  secretManager:
    - versionName: projects/$PROJECT_ID/secrets/google-maps-api-key/versions/latest
      env: 'GOOGLE_MAPS_API_KEY'
    - versionName: projects/$PROJECT_ID/secrets/google-maps-api-key-frontend/versions/latest
      env: 'GOOGLE_MAPS_API_KEY_FRONTEND'

steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: 
      - '--build-arg'
      - 'VITE_GOOGLE_MAPS_API_KEY=$$GOOGLE_MAPS_API_KEY_FRONTEND'
    secretEnv: ['GOOGLE_MAPS_API_KEY_FRONTEND']
```

## 四、Cloud Run 配置

### 4.1 后端服务配置

后端服务在部署时会自动从 Secret Manager 读取 API Key：

```yaml
# cloudbuild.yaml 中的后端部署配置
- name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
  entrypoint: 'gcloud'
  args:
    - 'run'
    - 'deploy'
    - 'tms-backend'
    - '--set-secrets=GOOGLE_MAPS_API_KEY=google-maps-api-key:latest'
```

### 4.2 前端服务配置

前端服务在构建时已经将 API Key 打包到静态文件中，不需要运行时配置。

### 4.3 手动部署配置

如果需要手动部署，可以使用以下命令：

```bash
# 部署后端服务
gcloud run deploy tms-backend \
  --image=gcr.io/$PROJECT_ID/tms-backend:$COMMIT_SHA \
  --set-secrets=GOOGLE_MAPS_API_KEY=google-maps-api-key:latest \
  --region=us-central1

# 部署前端服务（API Key 已在构建时注入）
gcloud run deploy tms-frontend \
  --image=gcr.io/$PROJECT_ID/tms-frontend:$COMMIT_SHA \
  --region=us-central1
```

## 五、验证生产环境配置

### 5.1 验证 Secret 配置

```bash
# 检查 Secret 是否存在
gcloud secrets describe google-maps-api-key

# 检查 Secret 权限
gcloud secrets get-iam-policy google-maps-api-key
```

### 5.2 验证 Cloud Build 配置

```bash
# 触发构建
gcloud builds submit --config=cloudbuild.yaml

# 查看构建日志，确认 API Key 已正确注入
# 在构建日志中应该看到：
# - 前端构建成功
# - 后端构建成功
# - 没有 API Key 相关的错误
```

### 5.3 验证 Cloud Run 服务

```bash
# 检查后端服务配置
gcloud run services describe tms-backend --region=us-central1

# 检查环境变量
gcloud run services describe tms-backend --region=us-central1 \
  --format="value(spec.template.spec.containers[0].env)"

# 测试后端 API
curl https://tms-backend-${PROJECT_ID}.us-central1.run.app/api/maps/health
```

### 5.4 验证前端服务

```bash
# 检查前端服务
gcloud run services describe tms-frontend --region=us-central1

# 访问前端应用，检查地图是否正常显示
# 打开浏览器控制台，检查是否有初始化成功消息
```

## 六、故障排查

### 6.1 Secret 访问权限错误

**错误信息**：`Permission denied on secret`

**解决方案**：
1. 检查服务账号权限
2. 确保已授予 `roles/secretmanager.secretAccessor` 角色
3. 检查 Secret 是否存在

### 6.2 构建时 API Key 未注入

**错误信息**：前端地图不显示，控制台显示 "API Key 未配置"

**解决方案**：
1. 检查 `cloudbuild.yaml` 中的 `secretEnv` 配置
2. 检查 `availableSecrets` 配置
3. 检查 Secret 名称是否正确
4. 检查构建日志，确认 API Key 已传递

### 6.3 运行时 API Key 未加载

**错误信息**：后端 API 返回错误，日志显示 "API Key: NO"

**解决方案**：
1. 检查 Cloud Run 服务的 `--set-secrets` 配置
2. 检查 Secret 是否存在
3. 检查服务账号权限
4. 查看 Cloud Run 服务日志

### 6.4 API Key 无效

**错误信息**：`InvalidKeyMapError` 或 `ApiNotActivatedMapError`

**解决方案**：
1. 检查 Secret 中的 API Key 是否正确
2. 检查 API Key 是否已启用相应的 API
3. 检查 API Key 限制设置
4. 更新 Secret 中的 API Key

## 七、最佳实践

### 7.1 安全建议

1. **使用不同的 API Key**：
   - 前端和后端使用不同的 API Key
   - 分别设置不同的限制

2. **定期轮换 API Key**：
   - 建议每 3-6 个月更换一次
   - 更新 Secret Manager 中的值
   - 重新部署服务

3. **监控 API 使用**：
   - 定期检查 Google Cloud Console 中的使用情况
   - 设置配额限制和告警
   - 监控异常使用

### 7.2 成本优化

1. **使用缓存**：
   - 代码中已实现缓存机制
   - 相同地址的请求会被缓存

2. **批量请求**：
   - 使用 Distance Matrix API 批量计算距离
   - 减少 API 调用次数

3. **设置配额限制**：
   - 在 Google Cloud Console 中设置每日配额限制
   - 防止意外超支

### 7.3 高可用性

1. **多区域部署**：
   - 考虑在不同区域部署服务
   - 使用负载均衡

2. **错误处理**：
   - 实现优雅降级
   - 提供友好的错误提示

3. **监控和告警**：
   - 设置 API 使用量监控
   - 设置错误率告警

## 八、总结

生产环境配置包括：

1. ✅ **Secret Manager 配置**：存储 API Key
2. ✅ **Cloud Build 配置**：构建时注入 API Key
3. ✅ **Cloud Run 配置**：运行时读取 API Key
4. ✅ **权限配置**：确保服务账号有权限访问 Secret
5. ✅ **验证配置**：确保所有配置正确

配置完成后，系统就可以在生产环境中使用 Google Maps API 了。

## 九、参考文档

- [GOOGLE_MAPS_API_KEY_APPLICATION_GUIDE.md](GOOGLE_MAPS_API_KEY_APPLICATION_GUIDE.md) - API Key 申请指南
- [ENV_VARIABLES_SETUP.md](ENV_VARIABLES_SETUP.md) - 环境变量配置指南
- [GOOGLE_MAPS_VERIFICATION_GUIDE.md](GOOGLE_MAPS_VERIFICATION_GUIDE.md) - 功能验证指南
- [GOOGLE_MAPS_INTEGRATION_SUMMARY.md](GOOGLE_MAPS_INTEGRATION_SUMMARY.md) - 集成总结

