# Secret Manager 配置指南
> 创建时间: 2025-11-24T19:30:00Z

## 🔐 需要配置的密钥

### 1. DATABASE_URL
```bash
gcloud secrets create database-url \
  --data-file=- <<< "postgresql://neondb_owner:npg_lZq2bWeJT8tO@ep-round-math-ahvyvkcx-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
```

### 2. JWT_SECRET
```bash
# 使用生成的 JWT_SECRET
JWT_SECRET=$(cat /tmp/jwt_secret.txt)
echo -n "$JWT_SECRET" | gcloud secrets create jwt-secret --data-file=-
```

### 3. GOOGLE_MAPS_API_KEY
```bash
echo -n "AIzaSyBrJZAt61Nrlhe-MRY8rmE0D0i9x-0OS28" | gcloud secrets create google-maps-api-key --data-file=-
```

## 📋 更新现有密钥

如果密钥已存在，使用以下命令更新：

```bash
# 更新 DATABASE_URL
echo -n "postgresql://neondb_owner:npg_lZq2bWeJT8tO@ep-round-math-ahvyvkcx-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require" | \
  gcloud secrets versions add database-url --data-file=-

# 更新 JWT_SECRET
JWT_SECRET=$(cat /tmp/jwt_secret.txt)
echo -n "$JWT_SECRET" | gcloud secrets versions add jwt-secret --data-file=-

# 更新 GOOGLE_MAPS_API_KEY
echo -n "AIzaSyBrJZAt61Nrlhe-MRY8rmE0D0i9x-0OS28" | \
  gcloud secrets versions add google-maps-api-key --data-file=-
```

## 🔍 验证密钥

```bash
# 列出所有密钥
gcloud secrets list

# 查看密钥详情
gcloud secrets describe database-url
gcloud secrets describe jwt-secret
gcloud secrets describe google-maps-api-key
```

## 🚀 Cloud Run 配置

在部署 Cloud Run 服务时，使用以下命令设置密钥：

```bash
gcloud run deploy tms-backend \
  --set-secrets=DATABASE_URL=database-url:latest,JWT_SECRET=jwt-secret:latest,GOOGLE_MAPS_API_KEY=google-maps-api-key:latest \
  --set-env-vars=NODE_ENV=production,CORS_ORIGIN=*
```

---

**最后更新**: 2025-11-24T19:30:00Z

