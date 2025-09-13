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

# 从builder阶段复制构建产物和生产依赖
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend/package.json ./

# 暴露端口
EXPOSE 8000

# 启动应用
CMD ["node", "dist/index.js"]