<!-- 2025-11-11T15:30:28Z Added by Assistant: Observability quick start -->
# 监控与告警栈接入指南

## 1. 组件清单

- Prometheus (`tms-prometheus`)：抓取 `backend` 暴露的 `/metrics`
- Grafana (`tms-grafana`)：可视化仪表盘、告警配置
- Node.js `prom-client`：后端请求耗时、计数指标

## 2. 本地启动

```bash
docker compose up -d prometheus grafana
```

访问路径：

- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001 （默认账户 `admin` / `admin123`）

## 3. 验证步骤

1. <!-- 2025-11-11T15:30:28Z Added by Assistant: Metrics check -->访问 http://localhost:8000/metrics 确认返回 Prometheus 指标。
2. <!-- 2025-11-11T15:30:28Z Added by Assistant: Prometheus check -->在 Prometheus UI 中运行 `tms_http_requests_total` 查询，确认数据写入。
3. <!-- 2025-11-11T15:30:28Z Added by Assistant: Grafana check -->登录 Grafana，新建 Prometheus 数据源，地址 `http://prometheus:9090`。
4. <!-- 2025-11-11T15:30:28Z Added by Assistant: Dashboard setup -->导入官方 dashboard（ID: 12900）或创建自定义面板观测 `tms_http_request_duration_seconds`。

## 4. 云环境部署建议

- 在 Cloud Run 加入 `/metrics` 路由，通过 Cloud Monitoring Prometheus 收集器采集。
- 为 Grafana 配置 Google OAuth / IAM 登录并启用持久化。
- 配置告警规则（如 P95 > 500ms、非 2xx 比率 > 1%）并接入 On-call。

## 5. 后续计划

- 接入数据库、Redis Exporter
- 通过 Loki/OpenSearch 聚合日志
- 在 Grafana 建立发布前后性能对比看板

<!-- 2025-11-11T15:30:28Z Added by Assistant: End of observability guide -->

