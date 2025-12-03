# Google Maps API 功能验证指南

**创建时间**: 2025-12-02  
**版本**: 1.0.0  
**用途**: 指导用户验证 Google Maps API 集成是否正常工作

## 一、验证前准备

### 1.1 确认环境变量已配置

**前端环境变量**：
- 检查 `.env.local` 文件是否存在
- 确认包含 `VITE_GOOGLE_MAPS_API_KEY=your-frontend-api-key`

**后端环境变量**：
- 检查 `.env` 文件是否存在
- 确认包含 `GOOGLE_MAPS_API_KEY=your-backend-api-key`

### 1.2 启动服务

**启动后端**：
```bash
cd apps/backend
npm run dev
```

**启动前端**：
```bash
cd apps/frontend
npm run dev
```

## 二、前端功能验证

### 2.1 地图初始化验证

**测试步骤**：
1. 打开浏览器，访问前端应用（通常是 `http://localhost:5173`）
2. 打开浏览器开发者工具（F12），切换到"控制台"标签
3. 查看控制台日志，应该看到：
   - ✅ `Google Maps API initialized successfully` - 表示初始化成功
   - ❌ `Google Maps API Key 未配置` - 表示 API Key 未设置

**预期结果**：
- 控制台显示初始化成功消息
- 没有错误信息

### 2.2 地图显示验证

**测试页面**：
- 运单详情页面（包含地图的页面）
- 车队管理页面（如果有地图显示）

**测试步骤**：
1. 访问包含地图的页面
2. 检查地图是否正常加载
3. 检查地图是否可以交互（缩放、拖拽）

**预期结果**：
- 地图正常显示
- 地图可以正常交互
- 没有控制台错误

### 2.3 地址自动完成验证

**测试页面**：
- 运单创建页面（`/shipments/create`）

**测试步骤**：
1. 访问运单创建页面
2. 找到地址输入框（提货地址或送达地址）
3. 在地址输入框中输入地址（例如："Toronto"）
4. 检查是否出现地址自动完成建议下拉列表

**预期结果**：
- 输入地址时出现自动完成建议
- 选择地址后，地址信息自动填充
- 城市、省份、邮编等信息自动填充

### 2.4 地图标记验证

**测试页面**：
- 运单详情页面

**测试步骤**：
1. 打开一个包含提货和送达地址的运单详情页
2. 检查地图上是否显示标记：
   - 提货地址标记（通常是蓝色）
   - 送达地址标记（通常是绿色）
3. 点击标记，检查是否显示信息窗口

**预期结果**：
- 提货和送达地址标记正确显示
- 标记点击后显示地址信息
- 标记位置准确

### 2.5 路线显示验证

**测试页面**：
- 运单详情页面（如果支持路线显示）

**测试步骤**：
1. 打开包含提货和送达地址的运单详情页
2. 检查地图上是否显示从提货地址到送达地址的路线
3. 检查路线是否正确绘制

**预期结果**：
- 路线正确显示在地图上
- 路线颜色和样式正确
- 路线路径合理

## 三、后端 API 验证

### 3.1 地址解析（Geocoding）验证

**测试命令**：
```bash
curl -X POST http://localhost:8000/api/maps/geocode \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"address": "Toronto, ON"}'
```

**预期响应**：
```json
{
  "success": true,
  "data": {
    "formattedAddress": "Toronto, ON, Canada",
    "latitude": 43.6532,
    "longitude": -79.3832,
    "city": "Toronto",
    "province": "Ontario",
    "country": "Canada",
    "postalCode": "...",
    "placeId": "..."
  }
}
```

**验证点**：
- ✅ 返回成功状态
- ✅ 包含经纬度坐标
- ✅ 包含格式化地址
- ✅ 包含地址组件（城市、省份等）

### 3.2 反向地理编码验证

**测试命令**：
```bash
curl -X POST http://localhost:8000/api/maps/reverse-geocode \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"lat": 43.6532, "lng": -79.3832}'
```

**预期响应**：
```json
{
  "success": true,
  "data": {
    "formattedAddress": "Toronto, ON, Canada",
    "latitude": 43.6532,
    "longitude": -79.3832,
    "placeId": "..."
  }
}
```

**验证点**：
- ✅ 返回成功状态
- ✅ 包含格式化地址
- ✅ 坐标正确

### 3.3 路线规划验证

**测试命令**：
```bash
curl -X POST http://localhost:8000/api/maps/calculate-route \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "pickupAddress": {
      "latitude": 43.6532,
      "longitude": -79.3832,
      "formattedAddress": "Toronto, ON"
    },
    "deliveryAddress": {
      "latitude": 45.5017,
      "longitude": -73.5673,
      "formattedAddress": "Montreal, QC"
    },
    "businessType": "CUSTOMER_DELIVERY",
    "cargoInfo": {
      "weight": 100,
      "volume": 1,
      "pallets": 1,
      "hazardous": false
    }
  }'
```

**预期响应**：
```json
{
  "success": true,
  "data": {
    "optimalRoute": {
      "distance": 542.5,
      "duration": 360,
      "fuelCost": 65.1,
      "segments": [...]
    },
    "pickupAddress": {...},
    "deliveryAddress": {...}
  }
}
```

**验证点**：
- ✅ 返回成功状态
- ✅ 包含距离（公里）
- ✅ 包含预计时间（分钟）
- ✅ 包含燃油成本估算
- ✅ 包含路线分段信息

### 3.4 API 使用统计验证

**测试命令**：
```bash
curl -X GET http://localhost:8000/api/maps/usage-stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**预期响应**：
```json
{
  "success": true,
  "data": {
    "geocoding": 10,
    "directions": 5,
    "distanceMatrix": 2,
    "places": 0,
    "total": 17
  }
}
```

**验证点**：
- ✅ 返回成功状态
- ✅ 包含各项 API 的使用统计
- ✅ 统计数据准确

### 3.5 健康检查验证

**测试命令**：
```bash
curl -X GET http://localhost:8000/api/maps/health
```

**预期响应**：
```json
{
  "success": true,
  "message": "Maps API service is healthy",
  "timestamp": "2025-12-02T10:00:00.000Z",
  "environment": "development"
}
```

**验证点**：
- ✅ 返回成功状态
- ✅ 服务健康状态正常

## 四、移动端功能验证

### 4.1 地图加载验证

**测试步骤**：
1. 启动移动端应用
2. 访问包含地图的页面（如运单详情页）
3. 检查地图是否正常显示

**预期结果**：
- 地图正常加载
- 地图可以正常交互（缩放、拖拽）

### 4.2 标记显示验证

**测试步骤**：
1. 打开包含提货和送达地址的运单详情页
2. 检查地图上是否显示标记：
   - 提货地址标记（蓝色，标记为 "P"）
   - 送达地址标记（绿色，标记为 "D"）
   - 当前位置标记（红色，如果有）

**预期结果**：
- 所有标记正确显示
- 标记位置准确
- 标记样式正确

### 4.3 路线显示验证

**测试步骤**：
1. 打开包含提货和送达地址的运单详情页
2. 检查地图上是否显示路线
3. 检查路线是否正确绘制

**预期结果**：
- 路线正确显示
- 路线路径合理

## 五、集成功能验证

### 5.1 运单创建流程验证

**测试步骤**：
1. 访问运单创建页面
2. 在提货地址输入框中输入地址
3. 检查是否出现地址自动完成建议
4. 选择地址，检查地址信息是否自动填充
5. 重复步骤 2-4 填写送达地址
6. 提交运单

**预期结果**：
- 地址自动完成正常工作
- 地址信息自动填充
- 运单创建成功
- 地图上正确显示提货和送达地址

### 5.2 运单详情页验证

**测试步骤**：
1. 打开一个已创建的运单详情页
2. 检查地图是否正确显示
3. 检查提货和送达地址标记是否正确
4. 检查路线是否正确显示（如果有）

**预期结果**：
- 地图正常显示
- 标记位置准确
- 路线正确绘制

### 5.3 车队管理验证

**测试步骤**：
1. 访问车队管理页面
2. 检查地图是否正确显示
3. 检查车辆位置标记是否正确显示
4. 点击标记，检查是否显示车辆信息

**预期结果**：
- 地图正常显示
- 车辆位置标记正确
- 标记点击后显示车辆信息

### 5.4 调度优化验证

**测试步骤**：
1. 访问调度优化页面
2. 执行调度优化
3. 检查是否使用 Google Maps 计算距离
4. 检查调度结果中是否显示 "🗺️ Google Maps API" 标识

**预期结果**：
- 调度优化使用 Google Maps 计算距离
- 距离计算准确
- 调度结果正确

### 5.5 费用计算验证

**测试步骤**：
1. 创建或编辑运单
2. 填写提货和送达地址
3. 检查费用计算是否基于实际距离
4. 检查距离费用是否正确计算

**预期结果**：
- 费用计算基于实际距离
- 距离费用计算正确
- 费用明细显示准确

## 六、常见问题排查

### 6.1 地图不显示

**可能原因**：
- API Key 未配置或配置错误
- API Key 限制设置不正确
- 网络连接问题

**解决方案**：
1. 检查环境变量是否正确配置
2. 检查浏览器控制台错误信息
3. 检查 API Key 限制设置
4. 检查网络连接

### 6.2 地址自动完成不工作

**可能原因**：
- Places API 未启用
- API Key 限制中未包含 Places API
- 前端 API Key 配置错误

**解决方案**：
1. 检查 Places API 是否已启用
2. 检查 API Key 限制设置
3. 检查前端环境变量配置
4. 重启前端开发服务器

### 6.3 后端 API 返回错误

**可能原因**：
- 后端 API Key 未配置
- 相应的 API 未启用
- API Key 限制设置不正确

**解决方案**：
1. 检查后端环境变量配置
2. 检查相应的 API 是否已启用
3. 检查 API Key 限制设置
4. 查看后端日志错误信息

### 6.4 API 配额超限

**可能原因**：
- 免费配额已用完
- 请求频率过高

**解决方案**：
1. 检查 Google Cloud Console 中的 API 使用情况
2. 优化代码，减少不必要的 API 调用
3. 使用缓存机制（代码中已实现）
4. 考虑升级到付费计划

## 七、验证清单

使用以下清单确保所有功能都已验证：

### 前端功能
- [ ] 地图初始化成功
- [ ] 地图正常显示
- [ ] 地址自动完成正常工作
- [ ] 地图标记正确显示
- [ ] 路线正确显示

### 后端功能
- [ ] 地址解析 API 正常工作
- [ ] 反向地理编码 API 正常工作
- [ ] 路线规划 API 正常工作
- [ ] API 使用统计正常
- [ ] 健康检查正常

### 移动端功能
- [ ] 地图正常加载
- [ ] 标记正确显示
- [ ] 路线正确显示

### 集成功能
- [ ] 运单创建流程正常
- [ ] 运单详情页地图正常
- [ ] 车队管理地图正常
- [ ] 调度优化使用 Google Maps
- [ ] 费用计算基于实际距离

## 八、下一步

验证完成后，如果所有功能都正常工作，可以：

1. ✅ 进行生产环境配置（见步骤 8）
2. ✅ 设置 API 使用量监控
3. ✅ 配置配额限制和告警
4. ✅ 优化性能和缓存策略

如果遇到问题，请参考：
- [GOOGLE_MAPS_API_KEY_SETUP.md](GOOGLE_MAPS_API_KEY_SETUP.md) - API Key 配置指南
- [ENV_VARIABLES_SETUP.md](ENV_VARIABLES_SETUP.md) - 环境变量配置指南
- [GOOGLE_MAPS_API_KEY_APPLICATION_GUIDE.md](GOOGLE_MAPS_API_KEY_APPLICATION_GUIDE.md) - API Key 申请指南

