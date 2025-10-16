# ---- Builder Stage ----
FROM node:18-alpine AS builder

WORKDIR /app

# 复制所有代码
COPY . .

# 安装所有依赖 (包括dev-dependencies用于构建)
RUN npm install

# 构建后端应用
RUN npm run build:backend

# 移除开发依赖, 准备生产环境的node_modules
RUN npm prune --production

# ---- Final Stage ----
FROM node:18-alpine

WORKDIR /app

# 从builder阶段复制构建产物和生产依赖到与源码一致的路径结构 // 2025-09-26 09:38:40
RUN mkdir -p /app
# 拷贝编译产物到 /app/dist，沿用工作目录启动方式
COPY --from=builder /app/apps/backend/dist /app/dist
# 拷贝packages目录到正确位置 // 2025-10-01 17:18:30
COPY --from=builder /app/packages /app/packages
# 使用根 workspace 的生产依赖
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/apps/backend/package.json /app/package.json

# 设置默认端口（Cloud Run 使用 8080，但可通过环境变量覆盖）// 2025-10-16 17:04:00
ENV PORT=8080

# 暴露端口
EXPOSE 8080

# 启动应用 // 2025-10-16 17:04:00
CMD ["node", "dist/index.js"]