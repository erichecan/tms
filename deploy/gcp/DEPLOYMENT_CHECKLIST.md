# TMS Google Cloud 部署检查清单

**创建时间：** 2025-10-16 17:13:00  
**用途：** 确保部署前所有准备工作完成

---

## 📋 部署前检查清单

### ✅ 阶段 1：本地验证

- [ ] **代码仓库已更新**
  ```bash
  git pull origin main
  git status  # 确保工作区干净
  ```

- [ ] **依赖安装成功**
  ```bash
  cd /Users/apony-it/Desktop/tms
  npm install
  ```

- [ ] **共享包构建成功**
  ```bash
  cd packages/shared-types
  npm run build
  ```

- [ ] **后端构建成功**
  ```bash
  cd apps/backend
  npm run build
  # 检查 dist/ 目录是否生成
  ls -la dist/
  ```

- [ ] **前端构建成功**
  ```bash
  cd apps/frontend
  npm run build
  # 检查 dist/ 目录是否生成
  ls -la dist/
  ```

- [ ] **Lint 检查通过**
  ```bash
  npm run lint
  ```

- [ ] **测试通过**（可选）
  ```bash
  npm run test:backend
  ```

---

### ✅ 阶段 2：Docker 验证

- [ ] **后端 Docker 构建成功**
  ```bash
  docker build -t tms-backend:test -f docker/backend/Dockerfile .
  ```

- [ ] **前端 Docker 构建成功**
  ```bash
  docker build \
    --build-arg VITE_API_BASE_URL=http://test \
    --build-arg VITE_GOOGLE_MAPS_API_KEY=test \
    -t tms-frontend:test \
    -f docker/frontend/Dockerfile .
  ```

- [ ] **Docker 镜像可以运行**（可选）
  ```bash
  # 测试后端
  docker run -p 8080:8080 -e PORT=8080 tms-backend:test
  
  # 测试前端
  docker run -p 8081:80 tms-frontend:test
  ```

---

### ✅ 阶段 3：GCP 项目设置

- [ ] **GCP 项目已创建**
  - 项目 ID: ________________
  - 项目名称: ________________
  - 计费账户已关联: ☐

- [ ] **必要的 API 已启用**
  ```bash
  gcloud services list --enabled | grep -E 'cloudbuild|run|sql|secret'
  ```
  - cloudbuild.googleapis.com
  - run.googleapis.com
  - sqladmin.googleapis.com
  - secretmanager.googleapis.com
  - artifactregistry.googleapis.com
  - compute.googleapis.com

- [ ] **gcloud CLI 已配置**
  ```bash
  gcloud config list
  # 验证 project 和 region
  ```

---

### ✅ 阶段 4：数据库设置

- [ ] **Cloud SQL 实例已创建**
  - 实例名: `tms-postgres`
  - 版本: PostgreSQL 15
  - 区域: ________________
  - 规格: db-g1-small 或更高

- [ ] **数据库已创建**
  - 数据库名: `tms_platform`

- [ ] **数据库用户已创建**
  - 用户名: `tms_user`
  - 密码已保存: ☐

- [ ] **实例连接名已记录**
  ```bash
  gcloud sql instances describe tms-postgres --format='value(connectionName)'
  ```
  - 连接名: ________________________________

---

### ✅ 阶段 5：Secret Manager 配置

- [ ] **database-url 密钥已创建**
  ```bash
  gcloud secrets describe database-url
  ```

- [ ] **jwt-secret 密钥已创建**
  ```bash
  gcloud secrets describe jwt-secret
  ```

- [ ] **google-maps-api-key 密钥已创建**
  ```bash
  gcloud secrets describe google-maps-api-key
  ```

- [ ] **gemini-api-key 密钥已创建**（如果使用）
  ```bash
  gcloud secrets describe gemini-api-key
  ```

- [ ] **IAM 权限已配置**
  ```bash
  # 验证服务账号可以访问密钥
  gcloud secrets get-iam-policy database-url
  ```

---

### ✅ 阶段 6：Cloud Build 设置

- [ ] **GitHub 仓库已连接**
  - 仓库: `erichecan/tms`
  - 连接状态: ☐ 已连接

- [ ] **cloudbuild.yaml 已配置**
  - Docker context 路径: `'.'`
  - 端口配置: `8080` (后端), `80` (前端)
  - 环境变量: 已配置

- [ ] **Cloud Build 触发器已创建**
  - 触发器名称: `deploy-production`
  - 分支: `^main$`
  - 配置文件: `deploy/gcp/cloudbuild.yaml`

- [ ] **替代变量已配置**
  - `_REGION`: ________________
  - `_CLOUDSQL_INSTANCE`: ________________________________
  - `_GOOGLE_MAPS_API_KEY`: ________________
  - `_CORS_ORIGIN`: ________________
  - `_BACKEND_URL`: ________________

---

### ✅ 阶段 7：部署配置文件

- [ ] **env.production.example 已审查**
  - 所有必要的环境变量已列出

- [ ] **cloudbuild.yaml 已更新**
  - Docker context 正确
  - 端口配置正确
  - 环境变量注入正确

- [ ] **Dockerfile 已优化**
  - 后端 PORT=8080
  - 前端构建参数正确

---

### ✅ 阶段 8：部署准备

- [ ] **本地代码已提交**
  ```bash
  git status
  git add .
  git commit -m "chore: prepare for GCP deployment"
  ```

- [ ] **远程仓库已更新**（如果需要）
  ```bash
  git push origin main
  ```

- [ ] **部署文档已准备**
  - DEPLOYMENT_STEPS.md
  - DEPLOYMENT_CHECKLIST.md (本文件)
  - setup-gcp.sh 脚本

---

## 🚀 部署执行

### 方式 1：手动触发（推荐首次部署）

```bash
gcloud builds triggers run deploy-production --branch=main
```

### 方式 2：Git 推送触发

```bash
git push origin main
```

### 监控构建

```bash
# 查看构建列表
gcloud builds list --limit=5

# 查看构建日志
gcloud builds log [BUILD_ID] --stream

# 或在 Cloud Console 查看
# https://console.cloud.google.com/cloud-build/builds
```

---

## ✅ 部署后验证

- [ ] **后端服务已部署**
  ```bash
  gcloud run services describe tms-backend --region=[REGION]
  ```

- [ ] **前端服务已部署**
  ```bash
  gcloud run services describe tms-frontend --region=[REGION]
  ```

- [ ] **服务 URL 已获取**
  ```bash
  # 后端 URL
  gcloud run services describe tms-backend --region=[REGION] --format='value(status.url)'
  
  # 前端 URL
  gcloud run services describe tms-frontend --region=[REGION] --format='value(status.url)'
  ```

- [ ] **数据库迁移已完成**
  ```bash
  # 使用 Cloud SQL Proxy
  ./cloud-sql-proxy [INSTANCE_CONNECTION_NAME] &
  
  # 运行迁移
  cd apps/backend
  npm run db:migrate
  ```

- [ ] **健康检查通过**
  ```bash
  curl https://[BACKEND-URL]/health
  ```

- [ ] **前端可访问**
  ```bash
  curl -I https://[FRONTEND-URL]
  ```

- [ ] **CORS 配置已更新**
  ```bash
  gcloud run services update tms-backend \
    --region=[REGION] \
    --update-env-vars=CORS_ORIGIN=[FRONTEND-URL]
  ```

- [ ] **日志正常**
  ```bash
  gcloud logs tail --service=tms-backend --limit=50
  gcloud logs tail --service=tms-frontend --limit=50
  ```

---

## 📝 部署后配置

- [ ] **监控和告警已配置**
  - Uptime checks
  - Error rate alerts
  - Resource usage alerts

- [ ] **自定义域名已配置**（可选）
  ```bash
  gcloud run domain-mappings create \
    --service=tms-frontend \
    --domain=[YOUR-DOMAIN] \
    --region=[REGION]
  ```

- [ ] **SSL 证书已配置**
  - Cloud Run 会自动配置 Let's Encrypt

- [ ] **备份策略已确认**
  - Cloud SQL 自动备份已启用
  - 备份保留期: _____ 天

---

## 🔧 常用命令速查

### 查看服务

```bash
# 列出所有服务
gcloud run services list

# 查看服务详情
gcloud run services describe tms-backend --region=[REGION]
```

### 更新服务

```bash
# 更新环境变量
gcloud run services update tms-backend \
  --region=[REGION] \
  --update-env-vars=KEY=VALUE

# 更新资源配置
gcloud run services update tms-backend \
  --region=[REGION] \
  --memory=4Gi \
  --cpu=2
```

### 查看日志

```bash
# 实时日志
gcloud logs tail --service=tms-backend --follow

# 历史日志
gcloud logs read "resource.type=cloud_run_revision" --limit=100
```

### 数据库操作

```bash
# 连接数据库
./cloud-sql-proxy [INSTANCE_CONNECTION_NAME] &
psql "postgresql://tms_user:[PASSWORD]@localhost:5432/tms_platform"

# 创建备份
gcloud sql backups create --instance=tms-postgres

# 列出备份
gcloud sql backups list --instance=tms-postgres
```

---

## 📞 获取帮助

如果遇到问题：

1. 查看详细文档：`deploy/gcp/DEPLOYMENT_STEPS.md`
2. 查看构建日志：`gcloud builds log [BUILD_ID]`
3. 查看服务日志：`gcloud logs tail --service=[SERVICE_NAME]`
4. 参考官方文档：
   - [Cloud Run](https://cloud.google.com/run/docs)
   - [Cloud SQL](https://cloud.google.com/sql/docs)
   - [Cloud Build](https://cloud.google.com/build/docs)

---

**检查清单版本：** 1.0  
**最后更新：** 2025-10-16 17:13:00

