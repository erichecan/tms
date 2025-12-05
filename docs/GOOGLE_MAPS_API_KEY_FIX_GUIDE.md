# Google Maps API Key 配置修复指南

**创建时间**: 2025-12-04T23:00:00  
**状态**: ✅ 修复完成

## 问题描述

生产环境前端提示错误：`Google Maps加载失败: Error: 缺少 VITE_GOOGLE_MAPS_API_KEY 配置`

## 根本原因

1. **前端和后端共用同一个 secret**：`cloudbuild.yaml` 中前端和后端都使用 `google-maps-api-key` secret
2. **Secret 中存储的可能不是前端 API Key**：该 secret 可能存储的是后端 API Key，而不是前端 API Key
3. **Vite 环境变量的特殊性**：`VITE_*` 环境变量必须在**构建时**注入，运行时无法修改

## 技术难点

- **Vite 环境变量机制**：`VITE_*` 变量只在构建时静态替换到代码中，不会在运行时动态读取
- **Docker 构建流程**：必须在 Docker 构建阶段通过 `--build-arg` 传入 API Key
- **前端/后端 Key 分离**：
  - 前端 Key 需要 HTTP referrer 限制（域名白名单）
  - 后端 Key 需要 IP 地址或 API 限制
  - 不能混用，必须分离管理

## 解决方案

### 已完成的修复

1. ✅ **创建专门的前端 API Key Secret**
   - Secret 名称: `google-maps-api-key-frontend`
   - 存储值: `AIzaSyD26kTVaKAlJu3Rc6_bqP9VjLh-HEDmBRs`

2. ✅ **更新 cloudbuild.yaml 配置**
   - 前端构建步骤使用 `GOOGLE_MAPS_API_KEY_FRONTEND` 环境变量
   - 后端构建步骤继续使用 `GOOGLE_MAPS_API_KEY` 环境变量
   - 两个 secrets 已分离

3. ✅ **配置 Cloud Build 服务账户权限**
   - 自动为 Cloud Build 服务账户添加访问权限

4. ✅ **更新文档**
   - `env.example` 文件添加了详细的注释说明

## API Key 分配

| 用途 | API Key | Secret 名称 | 环境变量 |
|------|---------|-------------|----------|
| 前端 | `AIzaSyD26kTVaKAlJu3Rc6_bqP9VjLh-HEDmBRs` | `google-maps-api-key-frontend` | `VITE_GOOGLE_MAPS_API_KEY` |
| 后端 | `AIzaSyDWyRo10INN_p2op7PB9rUE-yTjB-LlxT0` | `google-maps-api-key` | `GOOGLE_MAPS_API_KEY` |

## 部署步骤

### 步骤 1: 设置 GCP Secrets

运行自动设置脚本：

```bash
./scripts/setup-google-maps-secrets.sh
```

此脚本会：
- 创建或更新 `google-maps-api-key-frontend` secret
- 验证或更新 `google-maps-api-key` secret
- 配置 Cloud Build 服务账户权限

### 步骤 2: 验证 Secrets 配置

运行验证脚本：

```bash
./scripts/verify-google-maps-secrets.sh
```

此脚本会验证：
- 前端 Secret 是否存在且包含正确的值
- 后端 Secret 是否存在且包含正确的值
- Cloud Build 服务账户是否有访问权限

### 步骤 3: 重新部署应用

使用 Cloud Build 重新部署：

```bash
COMMIT_SHA=$(git rev-parse --short HEAD)
gcloud builds submit --config=cloudbuild.yaml \
  --substitutions=COMMIT_SHA=$COMMIT_SHA \
  --project=275911787144
```

### 步骤 4: 验证部署结果

部署完成后：

1. **访问前端应用**，检查浏览器控制台
2. **应该看到**：`✅ Google Maps API initialized successfully`
3. **不应该看到**：`缺少 VITE_GOOGLE_MAPS_API_KEY 配置`

或者运行本地构建验证：

```bash
./scripts/verify-frontend-build.sh
```

## 本地开发配置

对于本地开发环境，需要在项目根目录创建 `.env.local` 文件：

```bash
# 前端 Google Maps API Key
VITE_GOOGLE_MAPS_API_KEY=AIzaSyD26kTVaKAlJu3Rc6_bqP9VjLh-HEDmBRs

# 后端 API Base URL
VITE_API_BASE_URL=http://localhost:8000/api
```

**注意**：
- 文件名必须是 `.env.local`（不会被提交到 Git）
- 变量名必须以 `VITE_` 开头
- 修改后需要重启开发服务器才能生效

## 验证清单

- [ ] GCP Secret Manager 中存在 `google-maps-api-key-frontend` secret
- [ ] GCP Secret Manager 中存在 `google-maps-api-key` secret
- [ ] Cloud Build 服务账户有访问两个 secrets 的权限
- [ ] `cloudbuild.yaml` 已更新为使用 `GOOGLE_MAPS_API_KEY_FRONTEND`
- [ ] 前端构建时正确注入了 API Key
- [ ] 浏览器控制台显示地图初始化成功
- [ ] 地图功能正常工作（显示地图、地址自动完成等）

## 故障排查

### 问题 1: 仍然提示缺少 API Key

**可能原因**：
- Secret 不存在或名称错误
- Cloud Build 服务账户没有权限
- `cloudbuild.yaml` 配置错误

**解决方法**：
1. 运行 `./scripts/verify-google-maps-secrets.sh` 检查配置
2. 检查 Cloud Build 构建日志，确认 secret 是否被正确读取
3. 验证 `cloudbuild.yaml` 中的 secret 名称是否正确

### 问题 2: API Key 无效错误

**可能原因**：
- API Key 本身无效或已过期
- API Key 的限制设置不正确（域名限制）

**解决方法**：
1. 在 Google Cloud Console 检查 API Key 状态
2. 验证 API Key 的限制设置（前端 Key 需要 HTTP referrer 限制）
3. 确认已启用必要的 API（Maps JavaScript API、Places API）

### 问题 3: 构建成功但地图仍无法加载

**可能原因**：
- 构建时 API Key 未正确注入
- 前端代码中的环境变量读取方式有问题

**解决方法**：
1. 检查构建产物中是否包含 API Key
2. 运行 `./scripts/verify-frontend-build.sh` 验证
3. 检查浏览器控制台的完整错误信息

## 相关文件

- `cloudbuild.yaml` - Cloud Build 配置
- `docker/frontend/Dockerfile` - 前端 Docker 构建配置
- `apps/frontend/src/services/mapsService.ts` - 地图服务代码
- `apps/frontend/src/components/GoogleMap/GoogleMap.tsx` - 地图组件
- `env.example` - 环境变量示例文件
- `scripts/setup-google-maps-secrets.sh` - Secrets 设置脚本
- `scripts/verify-google-maps-secrets.sh` - Secrets 验证脚本
- `scripts/verify-frontend-build.sh` - 构建验证脚本

## 注意事项

1. **前端 API Key 会暴露在客户端代码中**：这是 Google Maps 的标准做法，必须通过 HTTP referrer 限制保护
2. **不要将 API Key 提交到 Git**：使用 `.env.local` 文件（已在 `.gitignore` 中）
3. **定期轮换 API Key**：建议定期更新 API Key 以提高安全性
4. **监控 API 使用情况**：在 Google Cloud Console 中监控 API 使用量和费用

