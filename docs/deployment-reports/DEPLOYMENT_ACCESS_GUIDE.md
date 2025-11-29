# 🚀 TMS 系统访问指南
**更新时间：** 2025-10-12 09:42:00  
**状态：** ✅ 代码已推送到 GitHub main 分支

---

## 📍 访问地址汇总

### 🌐 云端部署（Vercel + Supabase）

#### **前端应用**
- **URL：** https://frontend-xi-ten-63.vercel.app
- **状态：** ✅ 运行中（正在自动部署最新代码）
- **说明：** Vercel 已检测到 GitHub main 分支更新，正在自动重新部署

#### **后端 API**
- **URL：** https://backend-eta-lilac.vercel.app/api
- **健康检查：** https://backend-eta-lilac.vercel.app/health
- **状态：** ⚠️ 需要修复（Supabase 连接配置）
- **当前错误：** FUNCTION_INVOCATION_FAILED

#### **数据库**
- **平台：** Supabase
- **连接信息：** 见 VERCEL_ENV_CONFIG.md
- **状态：** 需要在 Vercel 后端配置环境变量

---

### 💻 本地部署（Docker）

#### **前端应用**
- **URL：** http://localhost:3000
- **Nginx 代理：** http://localhost:80
- **状态：** ✅ 运行中

#### **后端 API**
- **URL：** http://localhost:8000
- **健康检查：** http://localhost:8000/health
- **状态：** ✅ 运行中，development 模式

#### **数据库**
- **平台：** Docker PostgreSQL
- **端口：** localhost:5432
- **状态：** ✅ 运行中

---

## 🔄 Vercel 自动部署流程

### 触发条件
推送代码到 GitHub `main` 分支 → Vercel 自动检测 → 开始构建和部署

### 当前部署状态

✅ **代码已推送到 main 分支**
- 最新提交：c43f20e
- 包含所有修复：认证、地图配置、财务报表等

⏳ **Vercel 正在自动部署**
- 前端部署：约 2-5 分钟
- 后端部署：约 2-5 分钟

### 查看部署进度

1. **访问 Vercel Dashboard：**
   https://vercel.com/dashboard

2. **找到项目：**
   - Frontend 项目名（通常是 tms-frontend 或类似）
   - Backend 项目名（通常是 tms-backend 或类似）

3. **查看 Deployments 标签：**
   - 最新的部署应该显示为 "Building..." 或 "Ready"
   - 点击查看部署日志和详情

---

## ⏰ 等待部署完成

### 预计时间
- **前端：** 2-5 分钟
- **后端：** 2-5 分钟  
- **总计：** 5-10 分钟

### 部署完成的标志
1. Vercel Dashboard 显示绿色的 "Ready" 状态
2. 访问 https://frontend-xi-ten-63.vercel.app 能看到最新 UI
3. 控制台不再显示旧的 401 错误

---

## 🔧 配置 Google Maps API Key

### 步骤 1：获取 API Key

1. **访问 Google Cloud Console：**
   https://console.cloud.google.com/google/maps-apis/

2. **创建项目**（如果还没有）

3. **启用 APIs：**
   - Maps JavaScript API
   - Geocoding API
   - Places API
   - Directions API
   - Distance Matrix API

4. **创建凭据：**
   - 凭据 → 创建凭据 → API 密钥
   - 复制生成的 API key

### 步骤 2：配置到 Vercel

#### 前端配置：
1. 打开 Vercel Dashboard → Frontend 项目
2. Settings → Environment Variables
3. 添加新变量：
   - **Name:** `VITE_GOOGLE_MAPS_API_KEY`
   - **Value:** `您的真实 API key`
   - **Environments:** Production, Preview, Development

#### 后端配置：
1. 打开 Vercel Dashboard → Backend 项目
2. Settings → Environment Variables
3. 添加新变量：
   - **Name:** `GOOGLE_MAPS_API_KEY`
   - **Value:** `您的真实 API key`
   - **Environments:** Production, Preview, Development

### 步骤 3：重新部署

配置环境变量后：
1. Vercel Dashboard → Deployments
2. 点击最新部署右侧的 "..." 按钮
3. 选择 "Redeploy"
4. 等待 2-5 分钟

---

## 🔍 如何访问最新文件

### 方法 1：访问 Vercel 部署（云端）

**等待 5-10 分钟后访问：**
```
https://frontend-xi-ten-63.vercel.app
```

**验证是否是最新版本：**
1. 打开浏览器开发者工具（F12）
2. Console 标签应该显示：`[DEV MODE] Auto-login with mock user`
3. 不应该有 401 Unauthorized 错误

### 方法 2：访问本地部署（推荐立即查看）

**立即可用：**
```
http://localhost:3000
```

**清除浏览器缓存后刷新：**
1. 硬刷新：`Cmd + Shift + R` (Mac) 或 `Ctrl + Shift + R` (Windows)
2. 或在控制台运行：
   ```javascript
   localStorage.clear();
   location.reload();
   ```

### 方法 3：查看 Playwright 截图（本地）

**截图位置：**
```
/Users/apony-it/Desktop/tms/test-results/screenshots/
```

**打开测试报告：**
```bash
cd /Users/apony-it/Desktop/tms
npx playwright show-report
```

---

## ✅ 已完成的部署准备

### GitHub
- ✅ main 分支已更新（commit c43f20e）
- ✅ feature 分支已同步
- ✅ 所有更改已推送

### Vercel（自动部署中）
- ⏳ 前端正在部署最新代码
- ⏳ 后端正在部署最新代码
- ⚠️ 需要配置 Google Maps API key

### 本地 Docker
- ✅ 所有服务运行正常
- ✅ 开发模式，无需登录
- ✅ 所有功能可用（除了需要真实 API key 的地图）

---

## 🚨 重要提示

### Google Maps API Key 是必需的

**地图功能需要真实的 API key：**
- ❌ 示例 key 不能工作：`AIzaSyBpVxVxVxVx...`
- ✅ 必须使用您自己申请的真实 key

**影响的功能：**
- 车队管理页面的地图显示
- Maps Demo 页面
- 地址自动完成
- 路径规划

### Vercel 后端配置需要更新

**必需的环境变量：**
```
DATABASE_URL=postgresql://[YOUR_SUPABASE_CONNECTION_STRING]
JWT_SECRET=[32位随机字符串]
CORS_ORIGIN=https://frontend-xi-ten-63.vercel.app
NODE_ENV=production
GOOGLE_MAPS_API_KEY=[您的 API key]
```

---

## 📊 部署验证清单

### Vercel 前端部署完成后：
- [ ] 访问 https://frontend-xi-ten-63.vercel.app
- [ ] 检查是否自动登录（开发模式）
- [ ] 验证无 401 错误
- [ ] 测试运单、客户、司机页面

### Vercel 后端部署完成后：
- [ ] 访问 https://backend-eta-lilac.vercel.app/health
- [ ] 返回 healthy 状态
- [ ] 测试 API 端点

### Google Maps 配置后：
- [ ] 地图正常显示
- [ ] 地址搜索功能工作
- [ ] 路径规划可用

---

## 💡 下一步操作

### 立即可做（推荐）：

1. **查看本地部署：**
   ```
   http://localhost:3000
   ```
   清除浏览器缓存后，您会看到最新版本

2. **等待 Vercel 部署：**
   - 5-10 分钟后访问云端 URL
   - 查看 Vercel Dashboard 确认部署状态

3. **配置 Google Maps API Key：**
   - 获取真实的 API key
   - 在 Vercel 环境变量中配置
   - 在本地 .env 文件中配置

### 可选：

4. **配置 Supabase 后端：**
   - 参考 VERCEL_ENV_CONFIG.md
   - 配置数据库连接字符串
   - 修复后端 500 错误

---

## 📞 访问方式总结

| 环境 | 前端 URL | 后端 URL | 状态 | 说明 |
|------|----------|----------|------|------|
| **本地** | http://localhost:3000 | http://localhost:8000 | ✅ 立即可用 | 最新代码 |
| **云端** | https://frontend-xi-ten-63.vercel.app | https://backend-eta-lilac.vercel.app | ⏳ 部署中 | 5-10分钟后可用 |

---

## 🎯 推荐操作顺序

1. ✅ **立即访问本地版本**（最快）
   - http://localhost:3000
   - 清除浏览器缓存
   - 查看所有最新功能

2. ⏳ **等待 Vercel 部署**（5-10 分钟）
   - 查看 https://vercel.com/dashboard
   - 等待部署完成

3. 🔑 **配置 Google Maps API**
   - 获取真实 API key
   - 配置到 Vercel 和本地 .env
   - 重新部署查看地图

4. 🗄️ **修复 Vercel 后端**（如需要）
   - 配置 Supabase 连接
   - 更新环境变量
   - 测试 API 端点

---

**报告生成时间：** 2025-10-12 09:42:00  
**最新提交：** c43f20e  
**部署状态：** 正在进行中 ⏳

