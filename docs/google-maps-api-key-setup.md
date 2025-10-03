# Google Maps API密钥申请指南

## 📋 申请前准备

### 所需材料
- Google账号（Gmail账户）
- 信用卡（用于验证身份，前90天有免费额度）
- 项目域名信息（用于配置限制）

### 免费额度说明
Google Maps API提供每月$200的免费额度，足够初期开发使用：
- Geocoding API: 40,000次请求/月
- Directions API: 40,000次请求/月  
- Distance Matrix API: 40,000次请求/月
- Maps JavaScript API: 28,500次加载/月

## 🚀 申请步骤

### 步骤1: 访问Google Cloud Console
1. 打开 [Google Cloud Console](https://console.cloud.google.com/)
2. 使用您的Google账号登录
3. 创建新项目或选择现有项目

### 步骤2: 创建新项目
1. 点击页面顶部的项目选择器
2. 点击"新建项目"
3. 输入项目名称：`tms-logistics-maps`
4. 选择组织（可选）
5. 点击"创建"

### 步骤3: 启用所需API服务
在项目控制台中，启用以下API服务：

#### 必需API服务：
1. **Maps JavaScript API** - 前端地图显示
2. **Geocoding API** - 地址解析
3. **Directions API** - 路线规划
4. **Distance Matrix API** - 批量距离计算
5. **Places API** - 地点搜索（可选）

#### 启用方法：
1. 进入"API和服务" → "库"
2. 搜索上述API名称
3. 点击每个API，然后点击"启用"

### 步骤4: 创建API密钥
1. 进入"API和服务" → "凭据"
2. 点击"创建凭据" → "API密钥"
3. 复制生成的API密钥

### 步骤5: 配置API密钥限制（开发阶段简化方案）

#### 开发阶段推荐方案（无需复杂限制）：
对于开发测试阶段，建议使用**无限制的API密钥**，这样更方便调试：

1. **创建单个通用API密钥**（推荐开发使用）
   - 点击刚创建的API密钥
   - 在"应用程序限制"部分：选择"无"
   - 在"API限制"部分：选择"无"
   - 这样可以在本地开发环境中自由使用

2. **或者创建两个简化限制的密钥**（更安全）：
   - **前端密钥**：仅限制HTTP引荐来源网址为 `http://localhost:3000`
   - **后端密钥**：无需IP限制，选择"无"

#### 生产环境配置（上线前必须设置）：
当项目准备上线时，需要配置严格限制：

```javascript
// 前端密钥限制（生产环境）：
- HTTP引荐来源网址: https://yourdomain.com
- 允许的API: Maps JavaScript API, Geocoding API

// 后端密钥限制（生产环境）：
- IP地址: 您的服务器IP地址
- 允许的API: Directions API, Distance Matrix API
```

#### 开发阶段密钥配置示例：
```bash
# .env 文件（开发环境）
GOOGLE_MAPS_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GOOGLE_MAPS_BACKEND_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# apps/frontend/.env.local 文件
VITE_GOOGLE_MAPS_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**注意**：开发阶段使用无限制密钥时，务必设置预算告警，避免意外费用。

## ⚙️ 环境配置

### 配置.env文件
在项目根目录的`.env`文件中添加：

```bash
# Google Maps API配置
GOOGLE_MAPS_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GOOGLE_MAPS_BACKEND_API_KEY=AIzaSyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy

# 前端配置（apps/frontend/.env.local）
VITE_GOOGLE_MAPS_API_KEY=AIzaSyzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz
```

### 密钥说明
- `GOOGLE_MAPS_API_KEY`: 后端通用API密钥
- `GOOGLE_MAPS_BACKEND_API_KEY`: 后端专用密钥（IP限制）
- `VITE_GOOGLE_MAPS_API_KEY`: 前端专用密钥（域名限制）

## 💳 账单设置

### 设置预算告警
1. 进入"结算" → "预算和告警"
2. 点击"创建预算"
3. 设置预算金额：$50/月（初期）
4. 配置告警阈值：50%, 90%, 100%
5. 添加通知邮箱

### 理解计费模式
- **按使用量计费**：每1000次API调用收费
- **免费额度**：每月$200免费额度
- **阶梯定价**：使用量越大单价越低

## 🔒 安全最佳实践

### 密钥安全
1. **永不提交密钥到版本控制**
2. **使用环境变量存储**
3. **定期轮换密钥**（建议每6个月）
4. **监控异常使用**

### 限制配置
```javascript
// 正确的限制配置示例
前端密钥限制：
- HTTP引荐来源网址: http://localhost:3000, https://yourdomain.com
- 允许的API: Maps JavaScript API, Geocoding API

后端密钥限制：
- IP地址: 192.168.1.100, 203.0.113.50
- 允许的API: Directions API, Distance Matrix API
```

## 🐛 常见问题解决

### 问题1: "此API项目未授权使用此API"
**解决方案**：
1. 检查是否已启用相关API
2. 验证API密钥限制配置
3. 确认密钥与使用的API匹配

### 问题2: "请求被拒绝，因为已超出每日限制"
**解决方案**：
1. 检查配额使用情况
2. 启用缓存减少API调用
3. 申请配额提升（如需）

### 问题3: "引荐来源网址不被允许"
**解决方案**：
1. 检查HTTP引荐来源网址配置
2. 确保域名拼写正确
3. 包含所有开发和生产域名

## 📊 监控和优化

### 监控API使用
1. 进入"API和服务" → "仪表板"
2. 查看各API的调用量
3. 设置使用量告警

### 成本优化策略
1. **启用缓存**：减少重复API调用
2. **批量处理**：使用Distance Matrix API
3. **错误处理**：避免无效请求
4. **使用免费额度**：合理安排开发测试

## 🚨 重要提醒

### 紧急情况处理
如果发现异常高额费用：
1. **立即禁用API密钥**
2. **检查使用量报告**
3. **联系Google支持**
4. **审查代码安全**

### 开发阶段建议
1. **使用无限制密钥进行开发** - 简化调试过程
2. **设置预算告警** - 建议$10/月的低阈值
3. **定期监控使用量** - 每周检查API调用统计
4. **本地缓存策略** - 减少重复API调用
5. **生产环境切换** - 上线前配置严格限制

### 开发阶段快速开始
如果您只想快速测试功能，可以：

1. 创建一个无限制的API密钥
2. 在 `.env` 和 `apps/frontend/.env.local` 中都填入同一个密钥
3. 启动开发服务器测试功能
4. 确认功能正常后，再配置生产环境限制

这样可以在开发阶段避免复杂的配置问题。

## 📞 支持资源

### 官方文档
- [Google Maps Platform文档](https://developers.google.com/maps/documentation)
- [API配额和计费](https://developers.google.com/maps/billing-and-pricing)
- [密钥安全最佳实践](https://developers.google.com/maps/api-security-best-practices)

### 技术支持
- Google Cloud支持：https://cloud.google.com/support
- Stack Overflow社区：使用标签 `google-maps-api`

---
**最后更新**: 2025-10-03  
**适用版本**: Google Maps Platform v3.0+