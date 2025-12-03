# GCP 部署准备完成 ✅

## 当前配置状态

### ✅ 已完成配置

1. **项目访问权限** ✅
   - 项目名称: Apony-TMS
   - 项目 ID: 275911787144
   - 当前账户: aponygroupcom@gmail.com
   - 项目状态: ACTIVE

2. **GCP API 已启用** ✅
   - Cloud Run API
   - Cloud Build API
   - Container Registry API
   - Secret Manager API

3. **Docker 认证配置** ✅
   - gcloud credential helper 已配置

4. **区域设置** ✅
   - 默认区域: asia-east2

## 下一步：创建 Secret Manager 密钥

在部署之前，需要创建以下密钥：

### 1. 创建数据库 URL 密钥

```bash
# 从 .env 文件读取 DATABASE_URL 并创建密钥
echo "$(grep DATABASE_URL .env | cut -d '=' -f2-)" | \
  gcloud secrets create database-url \
    --data-file=- \
    --project=275911787144 \
    --replication-policy="automatic"

# 或者更新现有密钥
echo "$(grep DATABASE_URL .env | cut -d '=' -f2-)" | \
  gcloud secrets versions add database-url \
    --data-file=- \
    --project=275911787144
```

### 2. 创建 JWT Secret 密钥

```bash
# 从 .env 文件读取 JWT_SECRET 并创建密钥
echo "$(grep JWT_SECRET .env | cut -d '=' -f2-)" | \
  gcloud secrets create jwt-secret \
    --data-file=- \
    --project=275911787144 \
    --replication-policy="automatic"
```

### 3. 创建 Google Maps API Key 密钥

```bash
# 从 .env 文件读取 GOOGLE_MAPS_API_KEY 并创建密钥
echo "$(grep GOOGLE_MAPS_API_KEY .env | cut -d '=' -f2-)" | \
  gcloud secrets create google-maps-api-key \
    --data-file=- \
    --project=275911787144 \
    --replication-policy="automatic"
```

## 快速部署

### 选项 1: 使用自动部署脚本

```bash
# 运行部署脚本
./scripts/gcp-deploy.sh
```

### 选项 2: 手动部署

参考 `docs/CLOUD_RUN_DEPLOYMENT.md` 文档进行手动部署。

## 部署后验证

部署完成后，验证服务：

```bash
# 获取后端 URL
BACKEND_URL=$(gcloud run services describe tms-backend \
  --region=asia-east2 \
  --format='value(status.url)' \
  --project=275911787144)

# 获取前端 URL
FRONTEND_URL=$(gcloud run services describe tms-frontend \
  --region=asia-east2 \
  --format='value(status.url)' \
  --project=275911787144)

echo "后端: $BACKEND_URL"
echo "前端: $FRONTEND_URL"

# 测试后端健康检查
curl $BACKEND_URL/health
```

## 注意事项

1. **环境变量**: 确保所有必要的环境变量都已在 Secret Manager 中配置
2. **数据库连接**: 确保 DATABASE_URL 可以从未来的 Cloud Run 实例访问
3. **CORS 配置**: 部署后需要更新后端的 CORS_ORIGIN 为前端 URL
4. **成本控制**: Cloud Run 默认按使用量计费，注意设置合理的实例限制

## 支持

如有问题，请查看：
- `docs/GCP_DEPLOYMENT_SETUP.md` - 部署配置指南
- `docs/CLOUD_RUN_DEPLOYMENT.md` - Cloud Run 部署文档

