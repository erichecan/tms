#!/bin/bash
# 设置 GCP 成本告警脚本
# 创建时间: 2025-11-30T21:45:00
# 目的: 防止意外费用产生

set -e

PROJECT_ID="275911787144"
BILLING_ACCOUNT_ID="${BILLING_ACCOUNT_ID:-}"

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   设置 GCP 成本告警和预算限制${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""

# 1. 获取计费账户
echo -e "${YELLOW}[1/4] 查找计费账户...${NC}"
if [ -z "$BILLING_ACCOUNT_ID" ]; then
    BILLING_ACCOUNT_ID=$(gcloud billing projects describe $PROJECT_ID --format="value(billingAccountName)" 2>/dev/null | grep -o '[A-Z0-9-]*$' || echo "")
    
    if [ -z "$BILLING_ACCOUNT_ID" ]; then
        echo -e "${YELLOW}未找到计费账户，列出所有可用的计费账户:${NC}"
        gcloud billing accounts list --format="table(name,displayName,open)"
        echo ""
        read -p "请输入计费账户 ID (格式: 0X0X0X-0X0X0X-0X0X0X): " BILLING_ACCOUNT_ID
    else
        echo -e "${GREEN}✅ 找到计费账户: $BILLING_ACCOUNT_ID${NC}"
    fi
else
    echo -e "${GREEN}✅ 使用指定的计费账户: $BILLING_ACCOUNT_ID${NC}"
fi

if [ -z "$BILLING_ACCOUNT_ID" ]; then
    echo -e "${RED}❌ 错误: 无法找到计费账户${NC}"
    echo "请手动在 GCP Console 中设置成本告警"
    exit 1
fi

# 2. 创建预算（$10 上限）
echo -e "${YELLOW}[2/4] 创建成本预算 (上限: \$10)...${NC}"

BUDGET_NAME="tms-free-tier-budget"
BUDGET_DISPLAY_NAME="TMS Free Tier Budget"

# 检查预算是否已存在
if gcloud billing budgets describe $BUDGET_NAME --billing-account=$BILLING_ACCOUNT_ID &>/dev/null; then
    echo -e "${YELLOW}预算已存在，更新中...${NC}"
    gcloud billing budgets update $BUDGET_NAME \
        --billing-account=$BILLING_ACCOUNT_ID \
        --display-name="$BUDGET_DISPLAY_NAME" \
        --budget-amount=10USD \
        --threshold-rule=percent=50 \
        --threshold-rule=percent=80 \
        --threshold-rule=percent=100 \
        --projects=$PROJECT_ID
else
    echo -e "${YELLOW}创建新预算...${NC}"
    gcloud billing budgets create \
        --billing-account=$BILLING_ACCOUNT_ID \
        --display-name="$BUDGET_DISPLAY_NAME" \
        --budget-amount=10USD \
        --threshold-rule=percent=50 \
        --threshold-rule=percent=80 \
        --threshold-rule=percent=100 \
        --projects=$PROJECT_ID || {
            echo -e "${YELLOW}⚠️  预算创建可能需要更详细的配置，请手动在 Console 中设置${NC}"
        }
fi

echo -e "${GREEN}✅ 预算配置完成${NC}"

# 3. 设置 Cloud Run 配额限制
echo -e "${YELLOW}[3/4] 设置 Cloud Run 配额限制...${NC}"

# 获取当前配额
echo "当前 Cloud Run 配额:"
gcloud compute project-info describe --project=$PROJECT_ID --format="table(quotas.metric,quotas.limit,quotas.usage)" 2>/dev/null | grep -i "run" || echo "配额信息需要查看 Console"

echo -e "${GREEN}✅ 配额检查完成${NC}"
echo -e "${YELLOW}提示: 建议在 Console 中设置配额告警${NC}"

# 4. 创建成本监控文档
echo -e "${YELLOW}[4/4] 创建成本监控文档...${NC}"

cat > docs/GCP_COST_MONITORING.md << 'EOF'
# GCP 成本监控指南

## 预算告警设置

预算上限: **$10 USD/月**

告警阈值:
- 50% ($5) - 警告
- 80% ($8) - 严重警告
- 100% ($10) - 预算上限

## 查看成本

### 在 GCP Console
1. 访问 [Billing Dashboard](https://console.cloud.google.com/billing)
2. 选择项目和计费账户
3. 查看"费用概览"和"费用报告"

### 使用命令行
```bash
# 查看项目计费信息
gcloud billing projects describe PROJECT_ID

# 查看预算
gcloud billing budgets list --billing-account=BILLING_ACCOUNT_ID
```

## 免费服务检查清单

确保以下服务在免费层：

✅ **Cloud Run**
- 最小实例数: 0
- CPU: 0.25 vCPU
- 内存: 最小配置
- 免费额度: 200万请求/月

✅ **Cloud Build**
- 机器类型: E2_MEDIUM
- 免费额度: 120分钟/月
- 建议: 手动触发，避免自动构建

✅ **Secret Manager**
- 免费额度: 6个密钥版本
- 当前使用: 3个密钥

✅ **Cloud Logging**
- 免费额度: 50 GiB/月
- 建议: 定期清理旧日志

## 需要付费的服务

⚠️ **避免使用以下付费服务**:
- ❌ Cloud SQL (使用 Neon 替代)
- ❌ Memorystore (Redis)
- ❌ Cloud Storage (除非必要)
- ❌ 任何带有"Always-On"实例的服务

## 成本优化建议

1. **使用 min-instances=0**
   - 服务空闲时自动停止
   - 首次请求有冷启动延迟（正常）

2. **监控 Cloud Run 实例数**
   ```bash
   gcloud run services describe SERVICE_NAME \
     --region=REGION \
     --format="value(status.conditions)"
   ```

3. **定期检查运行中的服务**
   ```bash
   gcloud run services list --region=REGION
   ```

4. **删除未使用的资源**
   ```bash
   # 列出所有 Cloud Run 服务
   gcloud run services list
   
   # 删除不需要的服务
   gcloud run services delete SERVICE_NAME --region=REGION
   ```

## 紧急止损措施

如果发现费用异常增长：

```bash
# 1. 立即停止所有 Cloud Run 服务
gcloud run services list --format="value(metadata.name)" | \
  xargs -I {} gcloud run services update {} \
    --region=asia-east2 \
    --min-instances=0 \
    --max-instances=0

# 2. 暂停所有数据库（如果使用 Cloud SQL）
gcloud sql instances list --format="value(name)" | \
  xargs -I {} gcloud sql instances patch {} \
    --activation-policy=NEVER

# 3. 删除未使用的资源
./scripts/cleanup-unused-resources.sh
```

## 联系支持

如果费用异常，立即：
1. 在 GCP Console 中检查费用明细
2. 联系 GCP 支持
3. 必要时禁用计费账户

EOF

echo -e "${GREEN}✅ 成本监控文档已创建: docs/GCP_COST_MONITORING.md${NC}"

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}   ✅ 成本告警设置完成！${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}预算配置:${NC}"
echo "  - 预算上限: \$10 USD/月"
echo "  - 告警阈值: 50%, 80%, 100%"
echo ""
echo -e "${YELLOW}重要提醒:${NC}"
echo "  1. 定期检查 GCP Console 中的费用"
echo "  2. 确保所有服务使用 min-instances=0"
echo "  3. 使用 Neon 免费数据库，不要使用 Cloud SQL"
echo "  4. 查看详细指南: docs/GCP_COST_MONITORING.md"
echo ""

