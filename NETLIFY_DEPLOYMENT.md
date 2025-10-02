# Netlify 部署指南

创建时间: 2025-10-01

## 快速部署步骤

### 1. 准备工作

确保代码已推送到 Git 仓库（GitHub/GitLab/Bitbucket）

### 2. 连接 Netlify

1. 登录 [Netlify](https://app.netlify.com/)
2. 点击 "Add new site" → "Import an existing project"
3. 选择你的 Git 提供商并授权
4. 选择 `TMS` 仓库
5. 选择分支：`v3.1-product-requirements`

### 3. 配置构建设置

Netlify 会自动读取 `netlify.toml` 配置文件，包含以下设置：

- **Build command**: `cd apps/frontend && npm install && npm run build`
- **Publish directory**: `apps/frontend/dist`
- **Node version**: 18

### 4. 配置环境变量

在 Netlify 后台设置以下环境变量：

#### 必需的环境变量

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `VITE_API_BASE_URL` | 后端 API 地址 | `https://your-backend-api.com/api/v1` |

#### 设置步骤：
1. 进入 Netlify 项目 Dashboard
2. 点击 "Site settings" → "Environment variables"
3. 点击 "Add a variable"
4. 添加上述环境变量

### 5. 部署

1. 点击 "Deploy site" 开始部署
2. 等待构建完成（通常 2-5 分钟）
3. 部署成功后会得到一个 `.netlify.app` 域名

### 6. 自定义域名（可选）

1. 在 Netlify Dashboard 中点击 "Domain settings"
2. 点击 "Add custom domain"
3. 按照提示配置 DNS 记录
4. Netlify 会自动提供免费的 HTTPS 证书

## 配置文件说明

### netlify.toml

项目根目录的 `netlify.toml` 文件包含：
- 构建配置
- 重定向规则（支持 SPA 路由）
- 环境变量设置

### 重要注意事项

1. **API 连接**: 确保 `VITE_API_BASE_URL` 指向可访问的后端服务
2. **CORS 配置**: 后端需要配置 CORS 允许 Netlify 域名访问
3. **环境变量**: Vite 环境变量必须以 `VITE_` 开头

## 持续部署

配置完成后，每次推送到 `v3.1-product-requirements` 分支，Netlify 都会自动重新部署。

### 部署状态查看

- 在 Netlify Dashboard 中查看 "Deploys" 标签
- 可以看到所有部署历史和日志
- 支持回滚到之前的版本

## 故障排查

### 构建失败

1. 检查 Netlify 构建日志
2. 确认 Node 版本兼容
3. 检查依赖包是否正确安装

### 页面 404 错误

- 确认 `netlify.toml` 中的重定向规则已配置
- 检查路由配置是否正确

### API 请求失败

1. 检查环境变量 `VITE_API_BASE_URL` 是否正确设置
2. 确认后端 CORS 配置
3. 检查后端服务是否正常运行

## 其他部署选项

如果需要部署到其他平台：

- **Vercel**: 类似配置，支持自动检测 Vite 项目
- **GitHub Pages**: 需要额外配置，不支持服务端路由
- **AWS S3 + CloudFront**: 企业级方案，需要手动配置

## 联系支持

如有问题，请参考：
- [Netlify 文档](https://docs.netlify.com/)
- [Vite 部署指南](https://vitejs.dev/guide/static-deploy.html)

