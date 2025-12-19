# ---- Builder Stage ----
FROM node:18-alpine AS builder

WORKDIR /app

# 复制所有代码
COPY . .

# 安装所有依赖
RUN npm install

# 构建移动端应用 - 传递环境变量到构建过程 // 2025-12-19 11:55:00
ARG VITE_API_BASE_URL=http://localhost:8000/api
ARG VITE_GOOGLE_MAPS_API_KEY
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY
RUN npm run build:frontend-mobile

# ---- Final Stage ----
FROM nginx:alpine

# 从builder阶段复制构建好的静态文件
COPY --from=builder /app/apps/frontend-mobile/dist /usr/share/nginx/html

# 创建启动脚本，动态生成 Nginx 配置（Cloud Run 端口由 PORT 提供） // 2025-12-19 11:55:00
RUN echo '#!/bin/sh' > /docker-entrypoint.sh && \
    echo 'PORT=${PORT:-8080}' >> /docker-entrypoint.sh && \
    echo 'echo "server {" > /etc/nginx/conf.d/default.conf' >> /docker-entrypoint.sh && \
    echo 'echo "    listen $PORT;" >> /etc/nginx/conf.d/default.conf' >> /docker-entrypoint.sh && \
    echo 'echo "    server_name _;" >> /etc/nginx/conf.d/default.conf' >> /docker-entrypoint.sh && \
    echo 'echo "    root /usr/share/nginx/html;" >> /etc/nginx/conf.d/default.conf' >> /docker-entrypoint.sh && \
    echo 'echo "    index index.html;" >> /etc/nginx/conf.d/default.conf' >> /docker-entrypoint.sh && \
    echo 'echo "    location / {" >> /etc/nginx/conf.d/default.conf' >> /docker-entrypoint.sh && \
    echo 'echo "        try_files \$uri /index.html;" >> /etc/nginx/conf.d/default.conf' >> /docker-entrypoint.sh && \
    echo 'echo "    }" >> /etc/nginx/conf.d/default.conf' >> /docker-entrypoint.sh && \
    echo 'echo "}" >> /etc/nginx/conf.d/default.conf' >> /docker-entrypoint.sh && \
    echo 'exec nginx -g "daemon off;"' >> /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

EXPOSE 8080

CMD ["/docker-entrypoint.sh"]


