# STATE MACHINE - Shipment (MVP)

> 更新时间：2025-09-29 09:12:36 10:00:00

## 状态与合法转换

- created → assigned / canceled
- assigned → picked_up / canceled
- picked_up → in_transit
- in_transit → delivered
- delivered → completed

非法转换返回：409 { code: "INVALID_TRANSITION" }

## 约束
- delivered 前必须存在 ≥1 POD 才能完成 completed（严格模式）
- 分配司机时 driver.status 必须为 available


