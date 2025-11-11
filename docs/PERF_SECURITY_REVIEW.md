<!-- 2025-11-11T15:44:32Z Added by Assistant: Performance & Security review checklist -->
# 性能与安全复核报告

## 1. 指标基线

- **性能预算**
  - API P95 < 500ms
  - 页面首屏 < 2.5s
  - Web Vitals (LCP < 2.5s, CLS < 0.1)
- **安全要求**
  - 所有受保护端点使用 JWT + RBAC
  - 开放接口限流、无敏感信息泄露
  - 依赖零高危漏洞（`npm audit --production`）

## 2. 预检命令

```bash
npm run review:preflight
```

包含步骤：
1. `npm run lint` – 前后端静态检查
2. `npm run test` – 单元与端到端基础测试
3. `npm run validate:data` – 数据一致性校验

## 3. 性能验证建议

- 使用 **Playwright Trace Viewer** 和 **Lighthouse** 对核心页面生成报告并归档 (`/docs/perf/`).
- 使用 **k6** 或 **Artillery** 对 `/api/shipments`、`/api/location/realtime` 进行 500 RPS 压测，检查错误率 < 0.5%。
- 监控面板 (`http://localhost:3001`) 关注以下曲线：
  - `tms_http_request_duration_seconds` P95
  - 数据库连接数与长事务
  - 错误率、Queue 深度

## 4. 安全验证建议

- 运行 `npm audit --production`，确认无高危依赖。
- 使用 **OWASP ZAP baseline scan** 对 `https://tms-frontend...` 进行扫描。
- 验证：
  - `/metrics`、`/health` 不泄露敏感信息。
  - 规则引擎更新操作需 `ADMIN`/`TENANT_ADMIN` 角色。
  - 客户 portal 提交接口具备输入验证与速率限制（依赖 API gateway 配置）。

## 5. 状态追踪

| 项目 | 负责人 | 状态 | 备注 |
| --- | --- | --- | --- |
| Lint/Test/Data 预检 | Backend Lead | ✅ 完成 | `npm run review:preflight` |
| API 压测 | DevOps | ⏳ 计划中 | 使用 k6 脚本 |
| OWASP ZAP 扫描 | Security Lead | ⏳ 计划中 | 设置认证上下文 |
| 依赖漏洞扫描 | DevOps | ✅ `npm audit --production` | 无高危 |

## 6. 后续行动

- 将压测与安全扫描纳入 CI（Cloud Build 或 GitHub Actions）。
- 针对高优先级漏洞建立工单与修复 SLA。
- 在发布前更新本报告并由安全负责人签字备案。

<!-- 2025-11-11T15:44:32Z Added by Assistant: End of performance & security review -->

