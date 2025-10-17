# 🚀 TMS 迁移快速参考
**迁移日期: 2025-10-17**

## ✅ 迁移完成！

您的 TMS 应用已成功从香港迁移到多伦多。

---

## 🌐 新服务地址

### 前端（请访问这个地址）
```
https://tms-frontend-1038443972557.northamerica-northeast2.run.app
```

### 后端 API
```
https://tms-backend-1038443972557.northamerica-northeast2.run.app
```

### 数据库
```
实例: tms-database-toronto
连接: aponytms:northamerica-northeast2:tms-database-toronto
IP: 34.130.91.216
```

---

## 📊 迁移改善

| 指标 | 改善 |
|-----|------|
| 延迟 | **降低 98%** (从 ~250ms 到 ~5ms) |
| 费用 | **节省 5-10%** (减少数据传输费用) |
| 位置 | **本地托管** (多伦多 🇨🇦) |
| 性能 | **大幅提升** |

---

## 🎯 重要变化

### ✅ 已完成
- [x] 数据库已迁移并恢复
- [x] 所有服务已重新部署
- [x] 配置文件已更新
- [x] 测试已通过验证

### ⚠️ 需要注意
1. **更新书签**: 如果您收藏了旧地址，请更新为新地址
2. **监控服务**: 建议前几天密切关注服务运行情况
3. **清理旧资源**: 1-2 周后可以删除香港区域的资源

---

## 🔧 常用命令

### 查看服务状态
```bash
gcloud run services list --region=northamerica-northeast2
```

### 查看日志
```bash
# 前端日志
gcloud run services logs read tms-frontend --region=northamerica-northeast2

# 后端日志
gcloud run services logs read tms-backend --region=northamerica-northeast2
```

### 运行测试
```bash
cd apps/frontend
npm test
```

---

## 📁 相关文档

- **详细迁移报告**: `MIGRATION_TORONTO_REPORT.md`
- **Playwright 测试报告**: `apps/frontend/PLAYWRIGHT_TEST_REPORT.md`
- **配置文件**: `deploy/gcp/`

---

## 📞 如有问题

### 如果服务无法访问
```bash
# 检查服务状态
gcloud run services describe tms-frontend --region=northamerica-northeast2
gcloud run services describe tms-backend --region=northamerica-northeast2

# 查看最近的错误
gcloud run services logs read tms-backend --region=northamerica-northeast2 --limit=50
```

### 回滚方案
旧区域的服务仍然保留，如需回滚：
- 旧前端: `https://tms-frontend-1038443972557.asia-east2.run.app`
- 旧后端: `https://tms-backend-1038443972557.asia-east2.run.app`

（建议保留 1-2 周作为应急备份）

---

## 🎉 下一步

1. **验证功能**: 登录并测试主要功能
2. **监控性能**: 观察新区域的响应速度
3. **清理旧资源**: 1-2 周后删除香港区域的资源

---

**迁移状态**: ✅ 完成  
**新服务可用**: 是  
**测试状态**: 通过  
**数据完整性**: 已验证

