# TMS 数据库数据管理指南

## 问题说明

在不同电脑间工作时，Docker 容器数据会丢失，因为：
- Docker 数据卷是本地存储的
- 每次 `docker-compose down` 后，容器数据会丢失
- 只有持久化的数据卷会保留

## 解决方案

### 1. 数据持久化配置

项目已配置数据持久化：
```yaml
volumes:
  postgres_data:  # PostgreSQL 数据持久化
  redis_data:     # Redis 数据持久化
```

### 2. 数据备份和恢复

#### 备份数据库
```bash
# 手动备份
./scripts/backup-database.sh

# 备份文件保存在 ./backups/ 目录
# 格式: tms_backup_YYYYMMDD_HHMMSS.sql.gz
```

#### 恢复数据库
```bash
# 恢复指定备份
./scripts/restore-database.sh ./backups/tms_backup_20250926_155721.sql.gz
```

### 3. 快速环境设置

#### 在新电脑上设置环境
```bash
# 1. 克隆项目
git clone <your-repo>
cd tms

# 2. 快速设置开发环境
./scripts/setup-dev-environment.sh

# 3. 如果有备份文件，选择恢复数据
```

### 4. 工作流程建议

#### 每天开始工作前
```bash
# 1. 启动服务
docker-compose up -d

# 2. 检查服务状态
docker-compose ps

# 3. 检查数据库连接
curl http://localhost:8000/health
```

#### 每天结束工作前
```bash
# 1. 备份重要数据
./scripts/backup-database.sh

# 2. 提交代码和备份文件
git add .
git commit -m "Daily backup and updates"
git push
```

#### 换电脑工作时
```bash
# 1. 拉取最新代码
git pull

# 2. 设置环境
./scripts/setup-dev-environment.sh

# 3. 恢复最新备份（如果需要）
./scripts/restore-database.sh ./backups/latest_backup.sql.gz
```

### 5. 数据卷管理

#### 查看数据卷
```bash
docker volume ls | grep tms
```

#### 数据卷位置
- PostgreSQL: `/var/lib/docker/volumes/tms_postgres_data/_data`
- Redis: `/var/lib/docker/volumes/tms_redis_data/_data`

#### 清理数据卷（谨慎使用）
```bash
# 停止所有服务
docker-compose down

# 删除数据卷（会丢失所有数据）
docker volume rm tms_postgres_data tms_redis_data
```

### 6. 故障排除

#### 数据库连接失败
```bash
# 检查容器状态
docker-compose ps

# 查看数据库日志
docker logs tms-postgres

# 重启数据库
docker-compose restart postgres
```

#### 数据丢失
```bash
# 1. 检查是否有备份
ls -la backups/

# 2. 恢复最新备份
./scripts/restore-database.sh ./backups/latest_backup.sql.gz

# 3. 如果没有备份，重新初始化
docker-compose down -v
docker-compose up -d postgres
```

### 7. 最佳实践

1. **定期备份**: 每天工作结束前备份数据
2. **版本控制**: 将备份文件纳入 Git 管理
3. **环境隔离**: 使用不同的 Docker Compose 文件管理不同环境
4. **监控日志**: 定期检查服务日志，及时发现问题

### 8. 自动化脚本

项目提供了以下自动化脚本：
- `scripts/backup-database.sh`: 数据库备份
- `scripts/restore-database.sh`: 数据库恢复  
- `scripts/setup-dev-environment.sh`: 开发环境快速设置

## 注意事项

⚠️ **重要提醒**:
- 数据卷是本地存储，换电脑会丢失
- 定期备份是必须的
- 备份文件建议纳入版本控制
- 生产环境请使用外部数据库服务
