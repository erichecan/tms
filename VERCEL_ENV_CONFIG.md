# Vercel环境变量配置指南

## 🔧 必需的环境变量

### Frontend项目环境变量:
```
VITE_API_BASE_URL=https://backend-eta-lilac.vercel.app/api
NODE_ENV=production
```

### Backend项目环境变量:
```
DATABASE_URL=postgresql://postgres.npnwxfwxzdsxkklhawbd:[YOUR_PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres
JWT_SECRET=[YOUR_JWT_SECRET_32_CHARS]
CORS_ORIGIN=https://frontend-xi-ten-63.vercel.app,https://tms-lyart.vercel.app
NODE_ENV=production
PORT=3000
```

## 📋 Supabase连接字符串格式:
```
postgresql://postgres.npnwxfwxzdsxkklhawbd:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres
```

## 🔍 配置检查清单:

### ✅ Frontend项目检查:
1. Settings → Environment Variables
2. 添加 `VITE_API_BASE_URL`
3. 值: `https://backend-eta-lilac.vercel.app/api`
4. 环境: Production, Preview

### ✅ Backend项目检查:
1. Settings → Environment Variables  
2. 添加 `DATABASE_URL`
3. 添加 `JWT_SECRET` (随机32位字符串)
4. 添加 `CORS_ORIGIN`
5. 环境: Production, Preview

## 🚀 部署后测试:
```
1. Frontend: https://frontend-xi-ten-63.vercel.app
2. Backend API: https://backend-eta-lilac.vercel.app/api/db/ping
3. 数据库测试: https://backend-eta-lilac.vercel.app/api/db/ping
```
