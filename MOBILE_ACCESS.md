# 司机移动端快速访问指南

## 🚀 快速启动

### 1. 启动移动端应用

在项目根目录执行：

```bash
npm run dev:frontend-mobile
```

### 2. 访问地址

#### 本地浏览器访问
- **地址**: http://localhost:3001

#### 移动设备访问（同一 Wi-Fi 网络）
- **地址**: http://192.168.1.93:3001
- **说明**: 请在手机浏览器中输入此地址

---

## 📱 移动端路由

- `/login` - 司机登录页面
- `/dashboard` - 任务列表（登录后默认页面）
- `/shipment/:id` - 运单详情页面

---

## 🔧 启动命令

### 单独启动移动端
```bash
npm run dev:frontend-mobile
```

### 同时启动所有服务
```bash
npm run dev
```
这将启动：
- 后端 API (端口 8000)
- PC 前端 (端口 3000)
- 移动端 (端口 3001)

---

## ⚙️ 环境变量配置

移动端需要配置以下环境变量（可选）：

在 `apps/frontend-mobile/.env.local` 文件中：

```bash
# API 基础地址（默认已配置代理到 localhost:8000）
VITE_API_BASE_URL=http://localhost:8000/api

# Google Maps API Key（可选，用于地图功能）
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

---

## 📋 前置要求

1. **后端服务运行中**
   - 确保后端 API 运行在 `http://localhost:8000`
   - 可以单独启动：`npm run dev:backend`

2. **司机账号已创建**
   - 需要在系统中创建司机账号
   - 使用邮箱和密码登录

---

## 🎯 测试步骤

1. 启动移动端：`npm run dev:frontend-mobile`
2. 在电脑浏览器访问：`http://localhost:3001`
3. 或在手机浏览器访问：`http://192.168.1.93:3001`
4. 使用司机账号登录
5. 查看任务列表和运单详情

---

## 💡 提示

- 移动端已在 `vite.config.ts` 中配置 `host: true`，允许局域网访问
- 如果无法访问，检查防火墙设置
- 确保手机和电脑在同一 Wi-Fi 网络

---

**最后更新**: 2025-11-30T12:45:00Z

