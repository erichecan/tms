# 文件整理说明

**整理时间：** 2025-11-29  
**整理目的：** 清理根目录，归类文档，删除临时文件

---

## 📁 新的目录结构

### `/docs/reports/` - 系统报告（18个文件）
包含各种系统验证、修复和状态报告：
- 系统验证报告
- TODO 完成总结
- 关键问题总结
- 修复报告
- 状态报告
- 等等...

### `/docs/deployment-reports/` - 部署报告（7个文件）
包含部署相关的报告和指南：
- 部署总结
- 部署访问指南
- 部署完成报告
- GCP 部署相关文档
- 等等...

### `/docs/guides/` - 使用指南（10个文件）
包含各种使用指南和参考文档：
- 数据库初始化指南
- 迁移快速参考
- 数据管理指南
- Google Maps 集成指南
- 测试指南
- 等等...

### `/scripts/sql/` - SQL 脚本（13个文件）
包含各种数据库相关的 SQL 脚本：
- 检查脚本
- 初始化脚本
- 授权脚本
- 验证脚本
- 等等...

---

## 🗑️ 已删除的文件

### 过时的 SQL 文件
- `additional_tables.sql`
- `complete_database_init.sql`
- `database_data.sql`
- `database_schema.sql`
- `generate_test_data_with_locations.sql`
- `minimal_schema.sql`

### 临时部署脚本
- `deploy_with_data.sh`
- `deploy-frontend-docker.sh`
- `deploy-frontend-fixed.sh`
- `deploy-personal.sh`
- `deploy-simple.sh`
- `redeploy.sh`
- `run_migrations.sh`
- `migrate-job.sh`
- `init_database_job.sh`
- `grant-permissions-job.sh`
- `test-pricing-api.sh`

### 临时图片和样式文件
- `bol-print-fixed.png`
- `bol-print.png`
- `bol-reference-styles.css`
- `bol-screen.png`
- `our-bol-template.png`
- `billoflading-reference.png`

---

## 📝 根目录保留的文件

根目录现在只保留最重要的文件：
- `README.md` - 项目主 README
- `LICENSE` - 许可证文件
- `package.json` - 项目配置
- `.env.example` - 环境变量示例
- `docker-compose.yml` - Docker 配置
- `Dockerfile` - Docker 镜像配置
- `cloudbuild.yaml` - GCP 构建配置
- `firebase.json` - Firebase 配置

---

## 🔍 如何查找文档

1. **系统报告** → `/docs/reports/`
2. **部署相关** → `/docs/deployment-reports/`
3. **使用指南** → `/docs/guides/`
4. **SQL 脚本** → `/scripts/sql/`
5. **主要技术文档** → `/docs/`（API、架构、设计文档等）

---

## 📌 注意事项

- 所有文档的链接和引用路径可能需要更新
- 如果代码中有硬编码的文档路径，需要相应更新
- 建议在查找文档时先查看 `/docs/README.md` 了解完整的文档结构

