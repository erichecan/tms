# Google Maps API Key 配置指南

**创建时间**: 2025-11-30  
**版本**: 1.0.0  
**状态**: 待配置

## 概述

本指南将帮助您配置 Google Maps API Key，使 TMS 系统能够使用 Google Maps 的各项功能。

## 一、获取 Google Maps API Key

### 1.1 访问 Google Cloud Console

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 使用您的 Google 账号登录
3. 创建新项目或选择现有项目

### 1.2 启用必要的 API

在 Google Cloud Console 中，启用以下 API：

**前端需要的 API**：
- ✅ **Maps JavaScript API** - 用于地图显示和交互
- ✅ **Places API** - 用于地址自动完成

**后端需要的 API**：
- ✅ **Geocoding API** - 用于地址解析（地址 → 经纬度）
- ✅ **Directions API** - 用于路线计算（起点 → 终点）
- ✅ **Distance Matrix API** - 用于距离矩阵计算（调度优化）

### 1.3 创建 API Key

1. 在 Google Cloud Console 中，导航到 **"API 和服务"** → **"凭据"**
2. 点击 **"创建凭据"** → **"API 密钥"**
3. 复制生成的 API Key

### 1.4 配置 API Key 限制（推荐）

为了安全，建议为 API Key 设置限制：

**前端 API Key 限制**：
- **应用程序限制**：选择 "HTTP 引用来源（网站）"
- **网站限制**：添加您的域名（例如：`http://localhost:3000`, `https://yourdomain.com`）
- **API 限制**：选择 "限制密钥"
  - 选择：Maps JavaScript API
  - 选择：Places API

**后端 API Key 限制**：
- **应用程序限制**：选择 "IP 地址（网络服务器）" 或 "无"
- **API 限制**：选择 "限制密钥"
  - 选择：Geocoding API
  - 选择：Directions API
  - 选择：Distance Matrix API

## 二、配置环境变量

### 2.1 前端环境变量

在项目根目录的 `.env` 或 `.env.local` 文件中添加：

```bash
# Google Maps API Key (前端)
VITE_GOOGLE_MAPS_API_KEY=your-frontend-api-key-here
```

**注意**：
- 前端 API Key 会暴露在客户端代码中，这是 Google Maps 的标准做法
- 必须设置 HTTP 引用来源限制，防止未授权使用
- 变量名必须以 `VITE_` 开头，Vite 才会在构建时注入

### 2.2 后端环境变量

在项目根目录的 `.env` 文件中添加：

```bash
# Google Maps API Key (后端)
GOOGLE_MAPS_API_KEY=your-backend-api-key-here
```

**注意**：
- 后端 API Key 不会暴露给客户端
- 建议设置 IP 地址限制（如果服务器 IP 固定）
- 或者使用 API 限制，只允许特定的 API

### 2.3 更新 .env.example 文件

`.env.example` 文件应包含以下内容：

```bash
# Google Maps API Key (前端)
VITE_GOOGLE_MAPS_API_KEY=

# Google Maps API Key (后端)
GOOGLE_MAPS_API_KEY=
```

## 三、验证配置

### 3.1 前端验证

1. 启动前端开发服务器：
   ```bash
   npm run dev:frontend
   ```

2. 打开浏览器控制台，检查是否有以下日志：
   - ✅ `Google Maps API initialized successfully` - 表示初始化成功
   - ❌ `Google Maps API Key 未配置` - 表示 API Key 未设置
   - ❌ `ApiNotActivatedMapError` - 表示 API 未启用
   - ❌ `RefererNotAllowedMapError` - 表示域名未在限制中

3. 访问运单创建页面，测试地址输入功能

### 3.2 后端验证

1. 启动后端服务器：
   ```bash
   npm run dev:backend
   ```

2. 检查后端日志，应该看到：
   ```
   Initializing MapsApiService with API Key: YES
   API Key length: 39
   ```

3. 测试 API 端点：
   ```bash
   curl -X POST http://localhost:3000/api/maps/geocode \
     -H "Content-Type: application/json" \
     -d '{"address": "Toronto, ON"}'
   ```

## 四、功能测试清单

### 4.1 运单创建页面

- [ ] 地址输入框显示正常
- [ ] 输入地址时出现自动完成建议（需要 Places API）
- [ ] 选择地址后，自动填充城市、省份、邮编
- [ ] 输入发货和收货地址后，自动计算距离
- [ ] 实时费用计算显示正确的费用明细

### 4.2 车队管理页面

- [ ] 地图正常加载
- [ ] 司机位置标记正确显示
- [ ] 点击标记可以查看详细信息

### 4.3 智能调度

- [ ] 调度算法使用 Google Maps 计算距离
- [ ] 调度结果中显示 "🗺️ Google Maps API" 标识
- [ ] 距离计算准确

### 4.4 计费引擎

- [ ] 基于实际距离计算费用
- [ ] 距离费用计算正确

## 五、常见问题

### 5.1 API Key 无效

**错误信息**：`InvalidKeyMapError`

**解决方案**：
- 检查 API Key 是否正确复制
- 确认 API Key 没有多余的空格或换行符
- 检查 API Key 是否已启用必要的 API

### 5.2 API 未启用

**错误信息**：`ApiNotActivatedMapError`

**解决方案**：
- 在 Google Cloud Console 中启用相应的 API
- 等待几分钟让更改生效

### 5.3 域名未在限制中

**错误信息**：`RefererNotAllowedMapError`

**解决方案**：
- 在 Google Cloud Console 中，编辑 API Key 限制
- 添加当前使用的域名（包括 `http://localhost:3000` 用于开发）

### 5.4 API 配额超限

**错误信息**：`OVER_QUERY_LIMIT`

**解决方案**：
- 检查 Google Cloud Console 中的 API 使用情况
- 考虑升级到付费计划
- 优化代码，减少不必要的 API 调用
- 使用缓存机制（代码中已实现）

### 5.5 前端 API Key 暴露

**问题**：前端 API Key 会在客户端代码中可见

**说明**：
- 这是 Google Maps 的标准做法，无法避免
- 必须设置 HTTP 引用来源限制来防止未授权使用
- 不要将 API Key 用于敏感操作（敏感操作应使用后端 API Key）

## 六、成本估算

### 6.1 免费配额（每月）

- **Maps JavaScript API**：28,000 次地图加载
- **Places API**：17,000 次请求
- **Geocoding API**：40,000 次请求
- **Directions API**：40,000 次请求
- **Distance Matrix API**：40,000 次元素

### 6.2 超出免费配额后的费用

- **Maps JavaScript API**：$7.00 / 1,000 次加载
- **Places API**：$17.00 / 1,000 次请求
- **Geocoding API**：$5.00 / 1,000 次请求
- **Directions API**：$5.00 / 1,000 次请求
- **Distance Matrix API**：$5.00 / 1,000 次元素

### 6.3 成本优化建议

1. **使用缓存**：代码中已实现缓存机制，相同地址的请求会被缓存
2. **批量请求**：使用 Distance Matrix API 批量计算距离
3. **监控使用量**：定期检查 Google Cloud Console 中的使用统计
4. **设置配额限制**：在 Google Cloud Console 中设置每日配额限制

## 七、安全建议

1. **分离前端和后端 API Key**：使用不同的 API Key，分别设置不同的限制
2. **设置 HTTP 引用来源限制**：前端 API Key 必须设置域名限制
3. **设置 IP 地址限制**：后端 API Key 可以设置服务器 IP 限制
4. **定期轮换 API Key**：建议每 3-6 个月更换一次 API Key
5. **监控异常使用**：定期检查 API 使用情况，发现异常及时处理

## 八、下一步

配置完成后，请按照以下步骤测试：

1. ✅ 验证环境变量已正确加载
2. ✅ 测试地址自动完成功能
3. ✅ 测试实时费用计算
4. ✅ 测试地图显示功能
5. ✅ 测试调度算法距离计算

如果遇到问题，请参考本文档的"常见问题"部分，或查看项目文档中的其他相关文档。

