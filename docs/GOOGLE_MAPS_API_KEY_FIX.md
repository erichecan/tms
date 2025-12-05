# Google Maps API Key 修复指南

## 问题描述

线上版本提示：`Google Maps加载失败: Error: 缺少 VITE_GOOGLE_MAPS_API_KEY 配置`

## 原因分析

前端构建时需要 `VITE_GOOGLE_MAPS_API_KEY` 环境变量，但 Secret Manager 中的 `google-maps-api-key` 可能存储的是后端 API key，而不是前端 API key。

## 解决方案

### 方案 1：创建专门的前端 API Key Secret（推荐）

1. **在 GCP Console 中创建新的 Secret**：
   - 访问：https://console.cloud.google.com/security/secret-manager?project=gen-lang-client-0364422903
   - 点击 "创建密钥"
   - 名称：`google-maps-api-key-frontend`
   - 密钥值：`AIzaSyBAdoCwFgCy6zvuVnHgu0lWptF1eAnyApY`（前端 API key）
   - 点击 "创建密钥"

2. **为 Cloud Build 服务账户添加权限**：
   ```bash
   PROJECT_NUMBER=882380127696
   gcloud secrets add-iam-policy-binding google-maps-api-key-frontend \
     --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
     --role="roles/secretmanager.secretAccessor" \
     --project=gen-lang-client-0364422903
   ```

3. **重新部署**：
   ```bash
   COMMIT_SHA=$(git rev-parse --short HEAD)
   gcloud builds submit --config=cloudbuild.yaml \
     --substitutions=COMMIT_SHA=$COMMIT_SHA \
     --project=gen-lang-client-0364422903
   ```

### 方案 2：更新现有 Secret 为前端 Key（简单但不推荐）

如果后端不使用 Google Maps API，可以直接更新现有的 secret：

1. **更新 Secret**：
   ```bash
   echo -n "AIzaSyBAdoCwFgCy6zvuVnHgu0lWptF1eAnyApY" | \
     gcloud secrets versions add google-maps-api-key \
     --data-file=- \
     --project=gen-lang-client-0364422903
   ```

2. **恢复 cloudbuild.yaml 使用原来的配置**（如果已修改）

3. **重新部署**

## 验证

部署完成后，访问前端 URL 并检查浏览器控制台：
- 应该看到：`✅ Google Maps API initialized successfully`
- 不应该看到：`缺少 VITE_GOOGLE_MAPS_API_KEY 配置`

## API Keys 说明

- **前端 API Key**: `AIzaSyBAdoCwFgCy6zvuVnHgu0lWptF1eAnyApY`
  - 用于：Maps JavaScript API, Places API
  - 限制：HTTP 引用来源（域名白名单）

- **后端 API Key**: `AIzaSyDWyRo10INN_p2op7PB9rUE-yTjB-LlxT0`
  - 用于：Geocoding API, Directions API, Distance Matrix API
  - 限制：IP 地址或 API 限制

## 当前配置状态

✅ `cloudbuild.yaml` 已更新为使用 `GOOGLE_MAPS_API_KEY_FRONTEND`  
⏳ 需要在 GCP Console 中创建 `google-maps-api-key-frontend` secret  
⏳ 需要为 Cloud Build 服务账户添加权限

## 下一步

1. 在 GCP Console 中创建 `google-maps-api-key-frontend` secret
2. 运行权限添加命令
3. 重新部署应用

