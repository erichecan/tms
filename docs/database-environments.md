# 数据库环境说明

## ⚠️ 重要更新（2026-01-14）

**TMS 项目现在统一使用单一数据库配置**

所有环境（本地开发、生产部署）都使用同一个 Neon PostgreSQL 数据库。

### 统一数据库配置

**连接字符串**:
```
postgresql://neondb_owner:npg_lZq2bWeJT8tO@ep-round-math-ahvyvkcx-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
```

**主机标识**: `ep-round-math-ahvyvkcx-pooler`

**用途**:
- ✅ 本地开发环境（所有开发者）
- ✅ GCP Cloud Run 生产部署
- ✅ 所有测试和调试

### 为什么统一配置？

1. **数据一致性**: 所有开发者和生产环境看到相同的数据
2. **简化管理**: 只需维护一个数据库
3. **避免错误**: 消除"本地能用，生产不能用"的问题
4. **真实测试**: 本地开发直接使用生产数据进行测试

### 配置位置

- **本地环境**: `apps/backend/.env`
- **生产环境**: GCP Secret Manager (`database-url` secret)
- **配置模板**: `apps/backend/.env.example`

### 验证配置

```bash
# 检查本地配置
grep DATABASE_URL apps/backend/.env

# 检查 GCP 配置
gcloud secrets versions access latest --secret="database-url"

# 两者应该完全相同
```

## 历史说明（已废弃）

~~之前项目使用了两个不同的数据库：~~
- ~~本地开发: ep-spring-lake-ahagh2w6-pooler~~
- ~~生产环境: ep-round-math-ahvyvkcx-pooler~~

**现已统一为单一数据库**: `ep-round-math-ahvyvkcx-pooler`

## 相关文件

- `apps/backend/.env` - 本地配置文件（不提交到 Git）
- `apps/backend/.env.example` - 配置模板（提交到 Git）
- `.agent/workflows/myrule.md` - 配置经验文档
- `docs/multi-computer-setup.md` - 多电脑配置指南

