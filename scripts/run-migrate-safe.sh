#!/bin/bash
# 2026-03-13: 安全跑库迁移 — 先显示将连接的数据库（脱敏），确认后再执行
# 迁移只会「加表/加列/补种子」，不会删已有业务数据（除脚本内约定的 U-02 清理）

set -e
cd "$(dirname "$0")/.."

# 加载 backend 的 .env（若有）
if [ -f apps/backend/.env ]; then
  set -a
  source apps/backend/.env
  set +a
  echo "[env] Loaded apps/backend/.env"
else
  echo "[env] No apps/backend/.env found, using current shell DATABASE_URL (if any)"
fi

# 脱敏显示 DATABASE_URL（只显示协议 + 主机部分，便于辨认是否生产）
if [ -z "$DATABASE_URL" ]; then
  echo ""
  echo "⚠️  DATABASE_URL 未设置。迁移会失败。"
  echo "   请先设置：export DATABASE_URL='postgresql://...' 或配置 apps/backend/.env"
  exit 1
fi

# 解析并脱敏：postgresql://user:pass@host:port/db -> postgresql://***@host/db
_mask_url() {
  echo "$1" | sed -E 's|(postgresql://)[^@]+@|\\1***@|; s|:[0-9]+/|/|'
}
MASKED=$(_mask_url "$DATABASE_URL")
echo ""
echo "即将对以下数据库执行迁移（只做建表/加列/补种子，不删已有数据）："
echo "  $MASKED"
echo ""

# 若传入 --yes 则跳过确认
if [ "$1" = "--yes" ]; then
  echo "已传入 --yes，直接执行迁移"
else
  read -p "确认执行迁移？(y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[yY]$ ]]; then
    echo "已取消"
    exit 0
  fi
fi

echo "执行中: npm run migrate (workspace backend) ..."
cd apps/backend && npm run migrate
echo "迁移完成。"
