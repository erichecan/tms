# TEST PLAN - Minimal Shipment Flow (MVP)

> 更新时间：2025-09-23 10:00:00

## 单元测试（Jest）
- StatusService 状态转换（合法/非法）
- 司机分配逻辑

## 集成测试（Jest + Supertest）
1. create_shipment_success
2. assign_driver_success
3. assign_driver_twice_fail
4. full_flow_success（含 POD 上传）
5. complete_without_pod_fail

## 端到端（Playwright）
- ui_full_flow.spec.ts：创建 → 分配 → 状态推进 → 上传POD → 完成
- 截图保存：frontend/e2e-artifacts/screenshots/


