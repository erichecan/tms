# Google Maps API 物流集成项目

## 📋 项目概述

本项目为TMS物流管理系统集成了Google Maps API，实现了智能调度、路径优化和成本计算功能。项目基于产品需求文档 `docs/google-maps-logistics-prd.md` 开发。

## 🎯 核心功能

### ✅ 已实现功能
1. **Google Maps JavaScript API 集成**
   - 前端地图组件和配置
   - 地址搜索和地理编码
   - 物流路径规划和显示
   - 实时交通状况集成

2. **后端地图服务API**
   - 地址解析和反向地理编码
   - 物流路线计算
   - 调度距离矩阵计算
   - 成本估算模型

3. **业务场景支持**
   - 垃圾清运路径优化
   - 仓库转运调度优化
   - 客户直运成本计算
   - 多订单捆绑配送

### 🔜 待开发功能
- 智能调度算法优化
- 实时车辆跟踪集成
- 业务场景差异化定价
- 性能监控和告警系统

## 🏗 项目架构

### 前端架构
```
apps/frontend/src/
├── components/Maps/
│   ├── LogisticsMap.tsx      # 物流地图组件
│   └── LogisticsMap.css      # 地图样式
├── services/
│   └── mapsService.ts        # 地图服务封装
├── types/
│   └── maps.ts               # 类型定义
└── pages/MapsDemo/
    ├── MapsDemo.tsx          # 演示页面
    └── MapsDemo.css          # 演示页面样式
```

### 后端架构
```
apps/backend/src/
├── services/
│   └── mapsApiService.ts     # 地图API服务
├── routes/
│   └── maps.ts               # 地图API路由
└── types/
    └── maps.ts               # 类型定义
```

## 🚀 快速开始

### 1. 环境配置
```bash
# 复制环境配置文件
cp .env.example .env
cp apps/frontend/.env.example apps/frontend/.env.local

# 配置Google Maps API密钥
# 在 .env 文件中设置:
GOOGLE_MAPS_API_KEY=your-backend-api-key
GOOGLE_MAPS_BACKEND_API_KEY=your-backend-specific-key

# 在 apps/frontend/.env.local 文件中设置:
VITE_GOOGLE_MAPS_API_KEY=your-frontend-api-key
```

### 2. 申请Google Maps API密钥
详细申请步骤请参考: [API密钥申请指南](docs/google-maps-api-key-setup.md)

### 3. 安装依赖
```bash
npm install
```

### 4. 配置环境变量
```bash
# 复制环境配置文件
cp .env.example .env
cp apps/frontend/.env.example apps/frontend/.env.local

# 编辑配置文件，填入您的API密钥
```

### 5. 启动开发服务器
```bash
# 启动后端服务
npm run dev:backend

# 启动前端服务
npm run dev:frontend
```

### 6. 访问演示页面
打开浏览器访问: `http://localhost:3000/maps-demo`

## 🔑 API密钥申请

### 申请步骤
1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用以下API服务:
   - Maps JavaScript API
   - Geocoding API
   - Directions API
   - Distance Matrix API
   - Places API
4. 创建API密钥并配置限制

### 开发阶段配置（推荐）
- **简化方案**: 使用单个无限制API密钥进行开发测试
- **安全方案**: 前端密钥限制为 `http://localhost:3000`，后端密钥无限制
- **生产环境**: 上线前必须配置严格的域名和IP限制

### 快速开始（开发阶段）
1. 申请一个无限制的API密钥
2. 在环境变量中配置相同的密钥
3. 启动服务测试功能
4. 功能确认后再配置生产环境限制

## 📊 功能演示

### 地图演示页面
访问 `/maps-demo` 路径可以测试以下功能:

1. **地址搜索**: 输入地址或选择预设地址
2. **路径规划**: 计算取货点到送货点的最优路线
3. **成本估算**: 基于距离、时间、燃油等因素计算运输成本
4. **实时交通**: 集成实时交通状况计算预计时间

### API端点测试
后端提供了以下REST API端点:

```bash
# 地址解析
POST /api/maps/geocode
{
  "address": "123 Main St, Toronto, ON"
}

# 路线计算
POST /api/maps/calculate-route
{
  "pickupAddress": {"latitude": 43.6532, "longitude": -79.3832},
  "deliveryAddress": {"latitude": 43.6512, "longitude": -79.3862},
  "businessType": "CUSTOMER_DELIVERY"
}

# 调度矩阵
POST /api/maps/dispatch-matrix
{
  "drivers": [...],
  "shipments": [...]
}
```

## 💰 成本控制

### API调用成本估算
| API服务 | 成本 | 预计月用量 | 月成本 |
|---------|------|------------|---------|
| Geocoding | $5/1000次 | 10,000次 | $50 |
| Directions | $5/1000次 | 5,000次 | $25 |
| Distance Matrix | $5/1000次 | 2,000次 | $10 |
| **总计** | - | - | **$85** |

### 成本优化策略
1. **缓存机制**: 地址缓存24小时，路线缓存1小时
2. **批量处理**: 使用Distance Matrix API批量计算
3. **请求优化**: 避免不必要的API调用
4. **监控告警**: 设置预算告警阈值

## 🔒 安全考虑

### API密钥安全
- 环境变量存储，不提交到版本控制
- 前端密钥配置HTTP referrers限制
- 后端密钥配置IP地址限制
- 定期审计和轮换

### 数据安全
- 输入验证和清理
- 请求频率限制
- 错误信息脱敏
- 日志安全审计

## 📈 性能指标

### 技术指标
- 地图加载时间: < 2秒
- 路径计算响应: < 500ms
- API缓存命中率: > 90%
- 错误率: < 1%

### 业务指标
- 调度效率提升: > 90%
- 路径优化里程减少: 15%+
- 燃油成本降低: 10%+
- 平均配送时间减少: 20%+

## 🐛 故障排除

### 常见问题
1. **地图不显示**
   - 检查API密钥配置
   - 验证密钥限制设置
   - 检查网络连接

2. **API调用失败**
   - 检查配额限制
   - 验证请求参数格式
   - 查看服务器日志

3. **性能问题**
   - 启用缓存机制
   - 优化请求频率
   - 检查网络延迟

### 调试工具
```javascript
// 前端调试
console.log('Maps service status:', mapsService.isReady());

// 后端调试
// 检查 /api/maps/health 端点
```

## 🤝 贡献指南

### 开发流程
1. 创建功能分支: `git checkout -b feature/your-feature`
2. 遵循代码规范
3. 添加单元测试
4. 提交Pull Request

### 代码规范
- TypeScript严格模式
- ESLint + Prettier
- 组件化开发
- 错误边界处理

## 📞 支持

### 文档资源
- [Google Maps API文档](https://developers.google.com/maps/documentation)
- [项目PRD文档](docs/google-maps-logistics-prd.md)
- [集成设置指南](docs/google-maps-integration-setup.md)

### 技术支持
- 查看服务器日志排查问题
- 使用健康检查端点验证服务状态
- 参考错误代码和解决方案

---
**项目分支**: `feature/google-maps-integration`  
**最后更新**: 2025-10-03  
**版本**: v1.0.0