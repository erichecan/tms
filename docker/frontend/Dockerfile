# ---- Builder Stage ----
FROM node:18-alpine AS builder

WORKDIR /app

# 复制所有代码
COPY . .

# 安装所有依赖
RUN npm install

# 构建前端应用 - 传递环境变量到构建过程 // 2025-10-01 21:45:00
ARG VITE_API_BASE_URL=http://localhost:8000/api
ARG VITE_GOOGLE_MAPS_API_KEY
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY
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