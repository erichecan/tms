#!/bin/bash
# 数据库启停控制脚本
# 2025-11-24T16:40:00Z Added by Assistant: 用于快速控制数据库启停以节省成本

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
PROJECT_ID="${PROJECT_ID:-aponytms}"
INSTANCE_NAME="${INSTANCE_NAME:-tms-postgres}"

# 显示使用说明
show_usage() {
    echo -e "${BLUE}数据库启停控制脚本${NC}"
    echo ""
    echo "用法: $0 [start|stop|status]"
    echo ""
    echo "命令:"
    echo "  start   - 启动数据库实例"
    echo "  stop    - 停止数据库实例（节省成本）"
    echo "  status  - 查看数据库状态"
    echo ""
    echo "环境变量:"
    echo "  PROJECT_ID      - GCP 项目 ID (默认: aponytms)"
    echo "  INSTANCE_NAME   - Cloud SQL 实例名称 (默认: tms-postgres)"
    echo ""
    echo "示例:"
    echo "  $0 start"
    echo "  PROJECT_ID=my-project $0 status"
}

# 启动数据库
start_database() {
    echo -e "${YELLOW}🚀 启动数据库实例: $INSTANCE_NAME${NC}"
    
    # 检查实例是否存在
    if ! gcloud sql instances describe $INSTANCE_NAME &> /dev/null; then
        echo -e "${RED}❌ 数据库实例 '$INSTANCE_NAME' 不存在${NC}"
        exit 1
    fi
    
    # 启动实例
    gcloud sql instances patch $INSTANCE_NAME \
        --activation-policy=ALWAYS \
        --quiet
    
    echo -e "${YELLOW}⏳ 等待数据库就绪（这可能需要 2-3 分钟）...${NC}"
    
    # 等待数据库就绪
    local max_wait=300  # 最多等待 5 分钟
    local elapsed=0
    while [ $elapsed -lt $max_wait ]; do
        local state=$(gcloud sql instances describe $INSTANCE_NAME \
            --format="value(state)" 2>/dev/null || echo "UNKNOWN")
        
        if [ "$state" = "RUNNABLE" ]; then
            echo -e "${GREEN}✅ 数据库已就绪！${NC}"
            
            # 显示连接信息
            local connection_name=$(gcloud sql instances describe $INSTANCE_NAME \
                --format="value(connectionName)")
            echo -e "${BLUE}📋 连接信息:${NC}"
            echo "   连接名: $connection_name"
            echo "   状态: $state"
            return 0
        fi
        
        echo -e "${YELLOW}   等待中... (当前状态: $state, 已等待: ${elapsed}秒)${NC}"
        sleep 5
        elapsed=$((elapsed + 5))
    done
    
    echo -e "${RED}❌ 数据库启动超时${NC}"
    exit 1
}

# 停止数据库
stop_database() {
    echo -e "${YELLOW}🛑 停止数据库实例: $INSTANCE_NAME${NC}"
    
    # 检查实例是否存在
    if ! gcloud sql instances describe $INSTANCE_NAME &> /dev/null; then
        echo -e "${RED}❌ 数据库实例 '$INSTANCE_NAME' 不存在${NC}"
        exit 1
    fi
    
    # 停止实例
    gcloud sql instances patch $INSTANCE_NAME \
        --activation-policy=NEVER \
        --quiet
    
    echo -e "${GREEN}✅ 数据库已停止（节省成本）${NC}"
    echo -e "${YELLOW}💡 提示: 数据库停止后仍会产生存储费用（约 $1.7/月/10GB）${NC}"
}

# 查看状态
show_status() {
    echo -e "${BLUE}📊 数据库状态信息${NC}"
    echo ""
    
    # 检查实例是否存在
    if ! gcloud sql instances describe $INSTANCE_NAME &> /dev/null; then
        echo -e "${RED}❌ 数据库实例 '$INSTANCE_NAME' 不存在${NC}"
        exit 1
    fi
    
    # 获取实例信息
    local state=$(gcloud sql instances describe $INSTANCE_NAME \
        --format="value(state)" 2>/dev/null || echo "UNKNOWN")
    local activation_policy=$(gcloud sql instances describe $INSTANCE_NAME \
        --format="value(settings.activationPolicy)" 2>/dev/null || echo "UNKNOWN")
    local tier=$(gcloud sql instances describe $INSTANCE_NAME \
        --format="value(settings.tier)" 2>/dev/null || echo "UNKNOWN")
    local region=$(gcloud sql instances describe $INSTANCE_NAME \
        --format="value(region)" 2>/dev/null || echo "UNKNOWN")
    local connection_name=$(gcloud sql instances describe $INSTANCE_NAME \
        --format="value(connectionName)" 2>/dev/null || echo "UNKNOWN")
    
    echo -e "实例名称: ${GREEN}$INSTANCE_NAME${NC}"
    echo -e "状态: ${GREEN}$state${NC}"
    echo -e "激活策略: ${GREEN}$activation_policy${NC}"
    echo -e "实例类型: ${GREEN}$tier${NC}"
    echo -e "区域: ${GREEN}$region${NC}"
    echo -e "连接名: ${GREEN}$connection_name${NC}"
    echo ""
    
    # 成本提示
    if [ "$activation_policy" = "NEVER" ]; then
        echo -e "${YELLOW}💡 数据库已停止，仅产生存储费用（约 $1.7/月/10GB）${NC}"
    else
        echo -e "${YELLOW}💡 数据库运行中，产生计算和存储费用（约 $7-9/月）${NC}"
    fi
}

# 主函数
main() {
    # 设置项目
    gcloud config set project $PROJECT_ID > /dev/null 2>&1
    
    case "${1:-}" in
        start)
            start_database
            ;;
        stop)
            stop_database
            ;;
        status)
            show_status
            ;;
        *)
            show_usage
            exit 1
            ;;
    esac
}

# 运行主函数
main "$@"

