<!-- 2025-11-11T15:06:04Z Added by Assistant: Initial risk register -->
# 上线风险登记表 v1.0

| 风险 ID | 分类 | 描述 | 影响等级 | 当前状态 | 负责人 | 缓解措施 | 截止时间 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| R-001 | 数据迁移 | 手工执行迁移导致环境漂移 | 高 | 打开 | Backend-Lead | <!-- 2025-11-11T15:06:04Z Added by Assistant: Mitigation for R-001 -->建设自动化迁移流水线并在 CI 校验 | 2025-11-18 |
| R-002 | 安全合规 | 开发模式绕过认证风险 | 高 | 打开 | Security-Lead | <!-- 2025-11-11T15:06:04Z Added by Assistant: Mitigation for R-002 -->移除绕过逻辑、补 RBAC 与审计日志 | 2025-11-19 |
| R-003 | 实时调度 | 位置数据仍基于模拟，无法支撑调度 | 高 | 打开 | Frontend-Lead | <!-- 2025-11-11T15:06:04Z Added by Assistant: Mitigation for R-003 -->接通真实位置、Distance Matrix；演练真实案例 | 2025-11-20 |
| R-004 | 监控告警 | 缺少统一监控与告警，故障难发现 | 中 | 打开 | DevOps | <!-- 2025-11-11T15:06:04Z Added by Assistant: Mitigation for R-004 -->部署 Prometheus/Grafana/Alertmanager 并演练告警 | 2025-11-21 |
| R-005 | 移动端可用性 | 司机移动端流程不完整 | 中 | 打开 | Mobile | <!-- 2025-11-11T15:06:04Z Added by Assistant: Mitigation for R-005 -->补完司机任务流与离线机制并测试 | 2025-11-25 |
| R-006 | 财务闭环 | POD 到财务结算缺少幂等与对账 | 中 | 打开 | Backend-Lead | <!-- 2025-11-11T15:06:04Z Added by Assistant: Mitigation for R-006 -->实现幂等、补对账报表，完成财务验收 | 2025-11-24 |
| R-007 | 发布文档 | 发布手册、回滚方案缺失 | 低 | 打开 | PMO | <!-- 2025-11-11T15:06:04Z Added by Assistant: Mitigation for R-007 -->整理发布手册与回滚流程并归档 | 2025-11-26 |

## 更新记录

- <!-- 2025-11-11T15:06:04Z Added by Assistant: Update log entry -->2025-11-11：创建风险登记表，初始化 7 项风险及负责人。

<!-- 2025-11-11T15:06:04Z Added by Assistant: End of risk register -->

