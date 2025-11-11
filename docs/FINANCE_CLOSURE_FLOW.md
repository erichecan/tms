<!-- 2025-11-11T15:38:55Z Added by Assistant: Finance close loop documentation -->
# 运单财务闭环操作指引

## 1. 业务步骤概览

| 阶段 | 操作人 | 系统动作 | 结果 |
| --- | --- | --- | --- |
| 司机执行 | 司机 | `POST /shipments/:id/pickup` → `transit` → `delivery` | 时间线记录、状态推进 |
| 上传凭证 | 司机 | `POST /shipments/:id/pod` | 状态切换为 `pod_pending_review` |
| 运营审核 | 运营 | `POST /shipments/:id/complete`（可附最终费用） | 运单状态 `completed`，生成财务记录 |
| 财务核算 | 财务 | 查看 `financial_records`、生成对账/结算单 | 进入应收/应付流程 |

## 2. 自动生成的财务记录

- `financial_records` 中新增：
  - `type = receivable`，`reference_id = customer_id`
  - `type = payable`，`reference_id = driver_id`
- 记录幂等：重复请求不会插入重复数据。
- 组件拆分（当启用定价模板时）存储在 `*_component` 类型中。

## 3. 验证方法

1. 按顺序调用司机端接口直至 `delivered`。
2. 上传 POD：`curl -F file=@pod.jpg http://localhost:8000/api/shipments/<id>/pod`.
3. 运营完成运单：
   ```bash
   curl -X POST http://localhost:8000/api/shipments/<id>/complete \
     -H "Authorization: Bearer <token>" \
     -H "X-Tenant-ID: 00000000-0000-0000-0000-000000000001" \
     -H "Content-Type: application/json" \
     -d '{"finalCost": 450.0}'
   ```
4. 查询财务记录：
   ```bash
   curl http://localhost:8000/api/finance/records?type=receivable
   curl http://localhost:8000/api/finance/records?type=payable
   ```

## 4. 注意事项

- 若 `finalCost` 未传，系统使用 `actual_cost` 或 `estimated_cost`。
- 若财务记录生成失败，会记录错误但不影响运单完成；可重新调用完成接口重试。
- 司机薪酬使用计费引擎输出，若模板缺失则退回默认佣金比例。

<!-- 2025-11-11T15:38:55Z Added by Assistant: End of finance closure guide -->

