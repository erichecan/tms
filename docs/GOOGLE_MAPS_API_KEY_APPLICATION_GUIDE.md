# Google Maps API Key 申请指南

**创建时间**: 2025-12-02  
**版本**: 1.0.0  
**用途**: 指导用户申请和配置 Google Maps API Key

## 一、准备工作

### 1.1 所需资源
- Google 账号
- 信用卡（用于启用计费账户，但有免费配额）
- 访问 Google Cloud Console 的权限

### 1.2 预计时间
- 申请和配置：15-30 分钟
- API 启用生效：5-10 分钟

## 二、详细申请步骤

### 步骤 1：访问 Google Cloud Console

1. 打开浏览器，访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 使用您的 Google 账号登录
3. 如果还没有项目，点击页面顶部的项目选择器，然后点击"新建项目"

### 步骤 2：创建或选择项目

1. **创建新项目**（推荐）：
   - 项目名称：`TMS Logistics Platform`（或您喜欢的名称）
   - 项目 ID：系统自动生成或自定义
   - 点击"创建"

2. **或选择现有项目**：
   - 在项目选择器中选择现有项目

### 步骤 3：启用计费账户

⚠️ **重要**：Google Maps API 需要启用计费账户，但提供免费配额。

1. 在左侧菜单中，点击"结算"
2. 如果还没有结算账户，点击"关联结算账户"
3. 按照提示添加付款方式（信用卡）
4. 完成结算账户设置

**免费配额说明**：
- Maps JavaScript API：每月 28,000 次地图加载（免费）
- Places API：每月 17,000 次请求（免费）
- Geocoding API：每月 40,000 次请求（免费）
- Directions API：每月 40,000 次请求（免费）
- Distance Matrix API：每月 40,000 次元素（免费）

### 步骤 4：启用必要的 API

#### 4.1 启用前端 API

1. 在左侧菜单中，点击"API 和服务" → "库"
2. 搜索并启用以下 API：

   **Maps JavaScript API**：
   - 搜索 "Maps JavaScript API"
   - 点击进入详情页
   - 点击"启用"按钮
   - 等待启用完成（通常几秒钟）

   **Places API**：
   - 搜索 "Places API"
   - 点击进入详情页
   - 点击"启用"按钮
   - 等待启用完成

#### 4.2 启用后端 API

继续在"API 和服务" → "库"中启用：

   **Geocoding API**：
   - 搜索 "Geocoding API"
   - 点击"启用"

   **Directions API**：
   - 搜索 "Directions API"
   - 点击"启用"

   **Distance Matrix API**：
   - 搜索 "Distance Matrix API"
   - 点击"启用"

### 步骤 5：创建 API Key

#### 5.1 创建前端 API Key

1. 在左侧菜单中，点击"API 和服务" → "凭据"
2. 点击页面顶部的"+ 创建凭据" → "API 密钥"
3. 复制生成的 API Key（例如：`AIzaSy...`）
4. **重要**：将此 Key 标记为"前端 API Key"，保存到安全位置

#### 5.2 创建后端 API Key

1. 再次点击"+ 创建凭据" → "API 密钥"
2. 复制新生成的 API Key
3. **重要**：将此 Key 标记为"后端 API Key"，保存到安全位置

### 步骤 6：配置 API Key 限制（安全设置）

#### 6.1 配置前端 API Key 限制

1. 在"凭据"页面，找到刚才创建的"前端 API Key"
2. 点击 API Key 名称进入编辑页面
3. **应用程序限制**：
   - 选择"HTTP 引用来源（网站）"
   - 在"网站限制"中添加以下域名：
     ```
     http://localhost:3000/*
     http://localhost:5173/*
     https://yourdomain.com/*
     https://*.yourdomain.com/*
     ```
   - 注意：将 `yourdomain.com` 替换为您的实际域名
   - 如果是开发环境，添加 `http://localhost:*`

4. **API 限制**：
   - 选择"限制密钥"
   - 勾选以下 API：
     - ✅ Maps JavaScript API
     - ✅ Places API
   - 点击"保存"

#### 6.2 配置后端 API Key 限制

1. 在"凭据"页面，找到"后端 API Key"
2. 点击进入编辑页面
3. **应用程序限制**：
   - 选择"IP 地址（网络服务器）"（如果服务器 IP 固定）
   - 或选择"无"（如果使用 API 限制）
   - 如果选择 IP 限制，添加服务器 IP 地址

4. **API 限制**：
   - 选择"限制密钥"
   - 勾选以下 API：
     - ✅ Geocoding API
     - ✅ Directions API
     - ✅ Distance Matrix API
   - 点击"保存"

### 步骤 7：设置配额限制（可选但推荐）

为了防止意外超支，建议设置每日配额限制：

1. 在左侧菜单中，点击"API 和服务" → "配额"
2. 为每个 API 设置每日配额限制：
   - Maps JavaScript API：建议设置为 1000 次/天（开发环境）
   - Places API：建议设置为 500 次/天
   - Geocoding API：建议设置为 2000 次/天
   - Directions API：建议设置为 2000 次/天
   - Distance Matrix API：建议设置为 2000 次/天

## 三、验证 API Key

### 3.1 测试前端 API Key

在浏览器控制台中运行：

```javascript
// 测试 Maps JavaScript API
fetch(`https://maps.googleapis.com/maps/api/js?key=YOUR_FRONTEND_API_KEY&callback=initMap`)
  .then(response => console.log('API Key 有效'))
  .catch(error => console.error('API Key 无效', error));
```

### 3.2 测试后端 API Key

在终端中运行：

```bash
# 测试 Geocoding API
curl "https://maps.googleapis.com/maps/api/geocode/json?address=Toronto&key=YOUR_BACKEND_API_KEY"

# 如果返回 JSON 数据，说明 API Key 有效
```

## 四、常见问题

### Q1: API Key 创建后多久生效？
A: 通常立即生效，但有时需要等待 5-10 分钟。

### Q2: 免费配额用完后会收费吗？
A: 是的，超出免费配额后会按使用量收费。建议设置配额限制。

### Q3: 前端 API Key 会暴露在客户端代码中，安全吗？
A: 这是 Google Maps 的标准做法。通过设置 HTTP 引用来源限制可以防止未授权使用。

### Q4: 可以共用一个 API Key 吗？
A: 不推荐。建议前端和后端使用不同的 API Key，分别设置不同的限制。

### Q5: 如何查看 API 使用量？
A: 在 Google Cloud Console 中，点击"API 和服务" → "仪表板"，可以查看各 API 的使用统计。

## 五、下一步

申请完成后，请按照以下步骤配置到系统中：

1. ✅ 将前端 API Key 配置到 `.env.local` 文件（见步骤 2）
2. ✅ 将后端 API Key 配置到 `.env` 文件（见步骤 3）
3. ✅ 验证配置是否正确（见步骤 4-6）
4. ✅ 测试功能是否正常（见步骤 7）

## 六、成本估算

### 免费配额（每月）
- Maps JavaScript API：28,000 次加载
- Places API：17,000 次请求
- Geocoding API：40,000 次请求
- Directions API：40,000 次请求
- Distance Matrix API：40,000 次元素

### 超出免费配额后的费用
- Maps JavaScript API：$7.00 / 1,000 次加载
- Places API：$17.00 / 1,000 次请求
- Geocoding API：$5.00 / 1,000 次请求
- Directions API：$5.00 / 1,000 次请求
- Distance Matrix API：$5.00 / 1,000 次元素

**建议**：对于中小型应用，免费配额通常足够使用。建议设置配额限制和监控使用量。

