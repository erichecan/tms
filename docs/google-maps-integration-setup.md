# Google Maps API 集成设置指南

## 📋 概述
本文档指导如何为TMS物流管理系统设置Google Maps API集成。

## 🔑 API密钥申请步骤

### 1. 创建Google Cloud项目
1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用计费账户（Google Maps API需要计费账户）

### 2. 启用所需API服务
在Google Cloud Console中启用以下API：
- **Maps JavaScript API** - 前端地图显示
- **Geocoding API** - 地址解析
- **Directions API** - 路径规划
- **Distance Matrix API** - 批量距离计算
- **Places API** - 地点搜索和自动补全

### 3. 创建API密钥
1. 转到"凭据"页面
2. 点击"创建凭据" → "API密钥"
3. 复制生成的API密钥

### 4. 配置API密钥限制
为安全起见，配置API密钥限制：

**前端密钥限制：**
- 应用限制：HTTP referrers
- 允许的网站：`http://localhost:3000`, `http://localhost:3001`, `https://yourdomain.com`
- API限制：Maps JavaScript API, Places API

**后端密钥限制：**
- 应用限制：IP地址
- 允许的IP：你的服务器IP地址
- API限制：Geocoding API, Directions API, Distance Matrix API

## ⚙️ 环境配置

### 后端配置 (.env文件)
```bash
# Google Maps API配置
GOOGLE_MAPS_API_KEY=your-backend-api-key
GOOGLE_MAPS_BACKEND_API_KEY=your-backend-specific-key

# API限制配置
GOOGLE_MAPS_RATE_LIMIT_PER_MINUTE=50
GOOGLE_MAPS_RATE_LIMIT_PER_DAY=2500
```

### 前端配置 (.env.local文件)
```bash
VITE_GOOGLE_MAPS_API_KEY=your-frontend-api-key
VITE_API_BASE_URL=http://localhost:8000/api
```

## 🧪 测试配置

### 1. 验证API密钥
```bash
# 测试Geocoding API
curl "https://maps.googleapis.com/maps/api/geocode/json?address=Toronto&key=YOUR_API_KEY"

# 测试Directions API  
curl "https://maps.googleapis.com/maps/api/directions/json?origin=Toronto&destination=Montreal&key=YOUR_API_KEY"
```

### 2. 前端地图测试
启动前端应用，检查：
- 地图是否能正常加载
- 地址搜索功能是否工作
- 路径规划是否正常显示

### 3. 后端API测试
测试后端地图API端点：
```bash
# 地址解析测试
curl -X POST http://localhost:8000/api/maps/geocode \
  -H "Content-Type: application/json" \
  -d '{"address": "123 Main St, Toronto, ON"}'

# 路线计算测试
curl -X POST http://localhost:8000/api/maps/calculate-route \
  -H "Content-Type: application/json" \
  -d '{
    "pickupAddress": {"latitude": 43.6532, "longitude": -79.3832},
    "deliveryAddress": {"latitude": 43.6512, "longitude": -79.3862},
    "businessType": "CUSTOMER_DELIVERY"
  }'
```

## 💰 成本控制策略

### API调用成本估算
- **Geocoding API**: $5/1000次调用
- **Directions API**: $5/1000次调用  
- **Distance Matrix API**: $5/1000次调用
- **Places API**: $17/1000次调用

### 成本控制措施
1. **实施缓存策略**
   - 地址解析缓存24小时
   - 路线计算缓存1小时
   - 距离矩阵缓存30分钟

2. **请求频率限制**
   - 前端：用户操作触发
   - 后端：批量处理，避免重复计算

3. **监控和告警**
   - 设置每日预算告警
   - 监控API使用量
   - 自动限制非关键功能

## 🔒 安全最佳实践

### API密钥安全
- 永远不要将API密钥提交到版本控制
- 使用环境变量存储密钥
- 定期轮换API密钥
- 配置最小权限原则

### 请求验证
- 验证所有输入参数
- 限制请求频率
- 实施输入清理和验证

## 🚀 部署检查清单

- [ ] API密钥已正确配置
- [ ] API服务已启用
- [ ] 密钥限制已设置
- [ ] 环境变量已配置
- [ ] 缓存策略已实施
- [ ] 错误处理已测试
- [ ] 成本监控已设置

## 📞 故障排除

### 常见问题
1. **地图不显示**
   - 检查API密钥是否正确
   - 验证密钥限制设置
   - 检查网络连接

2. **API调用失败**
   - 检查配额限制
   - 验证请求参数
   - 查看错误日志

3. **性能问题**
   - 启用缓存
   - 优化请求频率
   - 检查网络延迟

### 支持资源
- [Google Maps API文档](https://developers.google.com/maps/documentation)
- [API状态仪表板](https://status.cloud.google.com/)
- [计费和使用量报告](https://console.cloud.google.com/billing)

---
**最后更新**: 2025-10-03  
**版本**: v1.0