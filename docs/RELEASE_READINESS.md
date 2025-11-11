<!-- 2025-11-11T15:45:40Z Added by Assistant: Release readiness checklist -->
# 发布准备清单（Release Readiness）

## 1. 版本信息

- **版本号**：v1.0.0-rc
- **后端镜像**：`gcr.io/<project>/tms-backend:<commit>`
- **前端镜像**：`gcr.io/<project>/tms-frontend:<commit>`
- **数据库**：`aponytms:northamerica-northeast2:tms-database-toronto`

## 2. 预检

| 项目 | 命令 | 状态 |
| --- | --- | --- |
| Lint & Test | `npm run review:preflight` | ⏳ |
| 数据校验 | `npm run validate:data` | ⏳ |
| Playwright 报告 | `cd apps/frontend && npm run test:e2e` | ⏳ |
| Prometheus 仪表盘 | 检查关键图表、无告警 | ⏳ |
| OWASP ZAP | 参见 `docs/PERF_SECURITY_REVIEW.md` | ⏳ |

> 将 `⏳` 更新为 `✅` 后方可进入部署窗口。

## 3. 部署步骤（GCP Cloud Run）

```bash
# 1. 构建镜像
docker build -t gcr.io/$PROJECT_ID/tms-backend:$COMMIT_SHA -f docker/backend/Dockerfile .
docker build -t gcr.io/$PROJECT_ID/tms-frontend:$COMMIT_SHA -f docker/frontend/Dockerfile .

# 2. 推送镜像
docker push gcr.io/$PROJECT_ID/tms-backend:$COMMIT_SHA
docker push gcr.io/$PROJECT_ID/tms-frontend:$COMMIT_SHA

# 3. 运行迁移
npm run validate:data
gcloud builds submit --config cloudbuild.yaml

# 4. 活性检查
curl https://tms-backend.../health
curl https://tms-frontend...
```

## 4. 回滚方案

1. `gcloud run services update tms-backend --image gcr.io/$PROJECT_ID/tms-backend:<上一版本>`
2. `gcloud run services update tms-frontend --image gcr.io/$PROJECT_ID/tms-frontend:<上一版本>`
3. 如需数据库回滚，使用 `scripts/restore-database.sh <latest-backup>`

## 5. 已知风险

| 风险 ID | 描述 | 状态 | 缓解措施 |
| --- | --- | --- | --- |
| R-001 | 数据迁移需人工执行 | ⚠️ | 使用 `npm run validate:data` 核对表结构 |
| R-002 | 司机移动端需真实账号 | ⚠️ | 预部署前创建司机测试账号 |
| R-003 | Google Maps 需有效 API Key | ⚠️ | 配置 `VITE_GOOGLE_MAPS_API_KEY` |

## 6. 签署

- 产品负责人：_____________
- 技术负责人：_____________
- 运维负责人：_____________
- 安全负责人：_____________

发布日期：_____________

<!-- 2025-11-11T15:45:40Z Added by Assistant: End of release readiness checklist -->

