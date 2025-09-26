# API - Minimal Shipment Flow (MVP)

> 更新时间：2025-09-23 10:00:00

## 概述

最小闭环涉及以下 REST API（JSON）：

- POST /api/shipments
- GET /api/shipments
- GET /api/shipments/:id
- POST /api/shipments/:id/assign-driver
- POST /api/shipments/:id/status
- POST /api/shipments/:id/pod (multipart: file + note)
- GET /api/drivers
- GET /api/vehicles
- GET /api/notifications

详细字段与示例将在各阶段实现时逐步完善。


