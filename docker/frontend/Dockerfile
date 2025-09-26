# ---- Builder Stage ----
FROM node:18-alpine AS builder

WORKDIR /app

# 复制所有代码
COPY . .

# 安装所有依赖
RUN npm install

# 构建前端应用
RUN npm run build:frontend

# ---- Final Stage ----
FROM nginx:alpine

# 复制前端Nginx站点配置（仅server块） // 2025-09-26 09:14:00
COPY docker/frontend/site.conf /etc/nginx/conf.d/default.conf

# 从builder阶段复制构建好的静态文件
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html

# 暴露端口
EXPOSE 80

# 启动Nginx
CMD ["nginx", "-g", "daemon off;"]