# 司机移动端访问指南
> 创建时间: 2025-11-30T12:40:00Z
> 最后更新: 2025-11-30T12:40:00Z

## 📱 移动端访问入口

### 本地开发环境

#### 1. 启动移动端应用

**方式一：从根目录启动（推荐）**
```bash
# 在项目根目录执行
cd /Users/apony-it/Desktop/tms

# 启动移动端（单独启动）
npm run dev:frontend-mobile

# 或同时启动所有服务（后端 + PC前端 + 移动端）
npm run dev
```

**方式二：直接进入移动端目录启动**
```bash
cd /Users/apony-it/Desktop/tms/apps/frontend-mobile
npm run dev
```

#### 2. 访问地址

- **本地访问地址**: `http://localhost:3001`
- **端口**: `3001`（配置在 `apps/frontend-mobile/vite.config.ts` 中）

#### 3. 移动设备访问

在同一个局域网内，可以通过以下方式访问：

1. **获取本机 IP 地址**：
   ```bash
   # macOS/Linux
   ifconfig | grep "inet "
   
   # 或使用
   ipconfig getifaddr en0
   ```

2. **访问地址**：
   ```
   http://[您的IP地址]:3001
   ```
   例如：`http://192.168.1.100:3001`

3. **注意事项**：
   - 确保手机和电脑在同一个 Wi-Fi 网络
   - 确保防火墙允许 3001 端口访问
   - Vite 开发服务器默认只绑定 localhost，需要配置 `host: true`

---

### 配置外部访问

为了允许移动设备访问，需要修改 Vite 配置：

#### 修改 `apps/frontend-mobile/vite.config.ts`

```typescript
server: {
  port: 3001,
  host: true, // 允许外部访问
  // 或者指定具体 IP
  // host: '0.0.0.0',
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true,
      secure: false,
    },
  },
},
```

---

### 生产环境访问

#### 构建移动端应用

```bash
# 从根目录构建
npm run build:frontend-mobile

# 或进入移动端目录构建
cd apps/frontend-mobile
npm run build
```

构建产物位于：`apps/frontend-mobile/dist/`

#### 预览构建结果

```bash
cd apps/frontend-mobile
npm run preview
```

默认预览地址：`http://localhost:4173`

---

### 部署配置

移动端是一个纯前端应用，可以通过以下方式部署：

1. **静态文件服务器**（Nginx、Apache 等）
2. **CDN**（Cloudflare、AWS CloudFront 等）
3. **静态托管服务**（Vercel、Netlify、GitHub Pages 等）

#### Nginx 配置示例

```nginx
server {
    listen 80;
    server_name mobile.yourdomain.com;
    
    root /path/to/apps/frontend-mobile/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

### 环境变量配置

移动端需要配置以下环境变量：

#### 开发环境（`.env.local` 文件）

在 `apps/frontend-mobile/` 目录下创建 `.env.local` 文件：

```bash
# API 基础地址
VITE_API_BASE_URL=http://localhost:8000/api

# Google Maps API Key（可选，用于地图功能）
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

#### 生产环境

在构建时设置环境变量：

```bash
VITE_API_BASE_URL=https://api.yourdomain.com/api \
VITE_GOOGLE_MAPS_API_KEY=your-api-key \
npm run build
```

或在 CI/CD 流程中配置。

---

### 快速启动步骤

#### 1. 确保后端服务运行

```bash
# 启动后端（如果未启动）
cd /Users/apony-it/Desktop/tms
npm run dev:backend
```

后端应该在 `http://localhost:8000` 运行。

#### 2. 启动移动端

```bash
# 在项目根目录
npm run dev:frontend-mobile
```

#### 3. 访问应用

- **浏览器访问**: 打开 `http://localhost:3001`
- **移动设备访问**: 
  1. 查看终端输出中的 "Local" 和 "Network" 地址
  2. 使用 Network 地址在手机浏览器中访问

#### 4. 登录

使用司机账号登录（需要先在系统中创建司机账号）。

---

### 端口说明

| 服务 | 端口 | 地址 |
|------|------|------|
| 后端 API | 8000 | http://localhost:8000 |
| PC 前端 | 3000 | http://localhost:3000 |
| **移动端** | **3001** | **http://localhost:3001** |

---

### 开发工具提示

#### Vite 开发服务器特性

启动后，终端会显示：
```
  VITE v5.0.8  ready in xxx ms

  ➜  Local:   http://localhost:3001/
  ➜  Network: http://192.168.x.x:3001/
  ➜  press h + enter to show help
```

- **Local**: 本地访问地址
- **Network**: 局域网访问地址（用于移动设备测试）

---

### 常见问题

#### Q: 移动设备无法访问？
A: 
1. 确保 `vite.config.ts` 中配置了 `host: true`
2. 检查防火墙设置
3. 确保手机和电脑在同一 Wi-Fi 网络

#### Q: API 请求失败？
A:
1. 确保后端服务运行在 `http://localhost:8000`
2. 检查 `VITE_API_BASE_URL` 环境变量
3. 查看浏览器控制台错误信息

#### Q: 地图功能无法使用？
A:
1. 检查是否配置了 `VITE_GOOGLE_MAPS_API_KEY`
2. 确保 API Key 有效且有权限
3. 地图功能需要网络连接

---

### 路由结构

移动端路由：
- `/login` - 登录页面
- `/dashboard` - 任务列表（首页）
- `/shipment/:id` - 运单详情

默认路由会自动重定向到 `/login`。

---

### 技术栈

- **框架**: React 18 + TypeScript
- **UI 库**: Ant Design Mobile 5.41.1
- **构建工具**: Vite 5.0.8
- **路由**: React Router 6.8.1

---

**最后更新**: 2025-11-30T12:40:00Z

