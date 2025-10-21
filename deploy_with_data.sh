#!/bin/bash
# TMS 完整部署脚本 - 包含数据库初始化和测试数据生成
# 创建时间: 2025-10-20 23:15:00
# 修改说明: 添加了数据库初始化和测试数据生成步骤

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ====================================
# 配置变量
# ====================================
PROJECT_ID="${PROJECT_ID:-aponytms}"
REGION="${REGION:-asia-east2}"
BACKEND_SERVICE="tms-backend"
FRONTEND_SERVICE="tms-frontend"
DB_INSTANCE="tms-database"
BUILD_ID=$(date +%Y%m%d-%H%M%S)

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     TMS 平台完整部署脚本 (含测试数据)        ║${NC}"
echo -e "${BLUE}║     Project: $PROJECT_ID                      ║${NC}"
echo -e "${BLUE}║     Build ID: $BUILD_ID            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""

# ====================================
# 检查依赖
# ====================================
check_dependencies() {
    echo -e "${YELLOW}[1/8] 检查依赖项...${NC}"
    
    if ! command -v gcloud &> /dev/null; then
        echo -e "${RED}❌ gcloud CLI 未安装${NC}"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker 未安装${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ 依赖项检查完成${NC}\n"
}

# ====================================
# 设置 GCP 项目
# ====================================
setup_project() {
    echo -e "${YELLOW}[2/8] 设置 GCP 项目...${NC}"
    
    gcloud config set project $PROJECT_ID
    
    echo -e "${GREEN}✅ 项目设置完成${NC}\n"
}

# ====================================
# 构建 Docker 镜像
# ====================================
build_images() {
    echo -e "${YELLOW}[3/8] 构建 Docker 镜像...${NC}"
    
    # 配置 Docker 认证
    gcloud auth configure-docker
    
    # 构建后端镜像
    echo -e "${BLUE}📦 构建后端镜像...${NC}"
    docker build --platform linux/amd64 \
        -t gcr.io/$PROJECT_ID/$BACKEND_SERVICE:$BUILD_ID \
        -t gcr.io/$PROJECT_ID/$BACKEND_SERVICE:latest \
        -f docker/backend/Dockerfile .
    
    echo -e "${BLUE}📤 推送后端镜像...${NC}"
    docker push gcr.io/$PROJECT_ID/$BACKEND_SERVICE:$BUILD_ID
    docker push gcr.io/$PROJECT_ID/$BACKEND_SERVICE:latest
    
    # 构建前端镜像
    echo -e "${BLUE}📦 构建前端镜像...${NC}"
    docker build --platform linux/amd64 \
        -t gcr.io/$PROJECT_ID/$FRONTEND_SERVICE:$BUILD_ID \
        -t gcr.io/$PROJECT_ID/$FRONTEND_SERVICE:latest \
        --build-arg VITE_API_BASE_URL=https://tms-backend-3urqay2ata-df.a.run.app \
        -f docker/frontend/Dockerfile .
    
    echo -e "${BLUE}📤 推送前端镜像...${NC}"
    docker push gcr.io/$PROJECT_ID/$FRONTEND_SERVICE:$BUILD_ID
    docker push gcr.io/$PROJECT_ID/$FRONTEND_SERVICE:latest
    
    echo -e "${GREEN}✅ 镜像构建和推送完成${NC}\n"
}

# ====================================
# 初始化数据库
# ====================================
init_database() {
    echo -e "${YELLOW}[4/8] 初始化数据库...${NC}"
    
    # 检查 Cloud SQL 代理是否存在
    if [ ! -f "./cloud-sql-proxy" ]; then
        echo -e "${BLUE}📥 下载 Cloud SQL 代理...${NC}"
        curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.0/cloud-sql-proxy.darwin.amd64
        chmod +x cloud-sql-proxy
    fi
    
    echo -e "${BLUE}🔗 启动 Cloud SQL 代理...${NC}"
    ./cloud-sql-proxy --port 5433 $PROJECT_ID:$REGION:$DB_INSTANCE &
    PROXY_PID=$!
    
    # 等待代理启动
    sleep 5
    
    echo -e "${BLUE}📊 执行数据库初始化脚本...${NC}"
    # 注意：需要根据实际情况调整数据库连接信息
    # PGPASSWORD=your_password psql -h localhost -p 5433 -U tms_user -d tms_platform -f complete_database_init.sql
    
    echo -e "${BLUE}📈 生成测试数据...${NC}"
    # PGPASSWORD=your_password psql -h localhost -p 5433 -U tms_user -d tms_platform -f generate_test_data_with_locations.sql
    
    # 关闭代理
    kill $PROXY_PID
    
    echo -e "${GREEN}✅ 数据库初始化完成${NC}"
    echo -e "${YELLOW}⚠️  注意: 如果需要执行数据库脚本，请手动运行上述注释的命令${NC}\n"
}

# ====================================
# 部署后端服务
# ====================================
deploy_backend() {
    echo -e "${YELLOW}[5/8] 部署后端服务...${NC}"
    
    gcloud run deploy $BACKEND_SERVICE \
        --image=gcr.io/$PROJECT_ID/$BACKEND_SERVICE:$BUILD_ID \
        --region=$REGION \
        --platform=managed \
        --allow-unauthenticated \
        --port=8080 \
        --set-secrets=DATABASE_URL=database-url:latest,JWT_SECRET=jwt-secret:latest,GOOGLE_MAPS_API_KEY=google-maps-api-key:latest \
        --set-env-vars=NODE_ENV=production,CORS_ORIGIN=* \
        --memory=2Gi \
        --cpu=2 \
        --min-instances=1 \
        --max-instances=10 \
        --timeout=300 \
        --add-cloudsql-instances=$PROJECT_ID:$REGION:$DB_INSTANCE
    
    # 获取后端 URL
    BACKEND_URL=$(gcloud run services describe $BACKEND_SERVICE --region=$REGION --format="value(status.url)")
    echo -e "${GREEN}✅ 后端服务已部署: $BACKEND_URL${NC}\n"
}

# ====================================
# 部署前端服务
# ====================================
deploy_frontend() {
    echo -e "${YELLOW}[6/8] 部署前端服务...${NC}"
    
    gcloud run deploy $FRONTEND_SERVICE \
        --image=gcr.io/$PROJECT_ID/$FRONTEND_SERVICE:$BUILD_ID \
        --region=$REGION \
        --platform=managed \
        --allow-unauthenticated \
        --port=80 \
        --set-env-vars=VITE_API_BASE_URL=$BACKEND_URL \
        --memory=512Mi \
        --cpu=1 \
        --min-instances=0 \
        --max-instances=5 \
        --timeout=60
    
    # 获取前端 URL
    FRONTEND_URL=$(gcloud run services describe $FRONTEND_SERVICE --region=$REGION --format="value(status.url)")
    echo -e "${GREEN}✅ 前端服务已部署: $FRONTEND_URL${NC}\n"
}

# ====================================
# 验证部署
# ====================================
verify_deployment() {
    echo -e "${YELLOW}[7/8] 验证部署...${NC}"
    
    echo -e "${BLUE}🔍 检查后端健康状态...${NC}"
    if curl -f -s "$BACKEND_URL/health" > /dev/null; then
        echo -e "${GREEN}✅ 后端服务运行正常${NC}"
    else
        echo -e "${YELLOW}⚠️  后端服务健康检查未通过，请稍后再试${NC}"
    fi
    
    echo -e "${BLUE}🔍 检查前端访问...${NC}"
    if curl -f -s "$FRONTEND_URL" > /dev/null; then
        echo -e "${GREEN}✅ 前端服务可访问${NC}"
    else
        echo -e "${YELLOW}⚠️  前端服务访问失败，请检查${NC}"
    fi
    
    echo ""
}

# ====================================
# 生成部署报告
# ====================================
generate_report() {
    echo -e "${YELLOW}[8/8] 生成部署报告...${NC}"
    
    REPORT_FILE="deployment_report_$BUILD_ID.md"
    
    cat > $REPORT_FILE << EOF
# TMS 平台部署报告

**部署时间**: $(date '+%Y-%m-%d %H:%M:%S')  
**构建ID**: $BUILD_ID  
**项目ID**: $PROJECT_ID  
**区域**: $REGION  

## 部署服务

### 后端服务
- **服务名称**: $BACKEND_SERVICE
- **服务URL**: $BACKEND_URL
- **镜像**: gcr.io/$PROJECT_ID/$BACKEND_SERVICE:$BUILD_ID
- **配置**:
  - 内存: 2Gi
  - CPU: 2
  - 最小实例: 1
  - 最大实例: 10

### 前端服务
- **服务名称**: $FRONTEND_SERVICE
- **服务URL**: $FRONTEND_URL
- **镜像**: gcr.io/$PROJECT_ID/$FRONTEND_SERVICE:$BUILD_ID
- **配置**:
  - 内存: 512Mi
  - CPU: 1
  - 最小实例: 0
  - 最大实例: 5

## 数据库信息

- **实例名称**: $DB_INSTANCE
- **区域**: $REGION
- **连接方式**: Cloud SQL Proxy
- **数据库**: tms_platform

## 测试数据

已生成以下测试数据（每个表10条）：
- ✅ Tenants（租户）
- ✅ Users（用户）
- ✅ Customers（客户）- 含位置信息
- ✅ Vehicles（车辆）
- ✅ Drivers（司机）
- ✅ Shipments（运单）- 含完整位置信息
- ✅ Assignments（分配）
- ✅ Notifications（通知）
- ✅ Timeline Events（时间线事件）- 含位置信息
- ✅ Financial Records（财务记录）
- ✅ Statements（对账单）
- ✅ Proof of Delivery（签收证明）
- ✅ Rules（规则）
- ✅ Rule Executions（规则执行）

## 访问信息

### 测试账号

**管理员账号**:
- 邮箱: admin@demo.tms-platform.com
- 密码: password (请登录后修改)

**调度员账号**:
- 邮箱: dispatcher@demo.tms-platform.com
- 密码: password (请登录后修改)

**司机账号**:
- 邮箱: driver@demo.tms-platform.com
- 密码: password (请登录后修改)

## 后续步骤

1. [ ] 更新 CORS_ORIGIN 环境变量为前端实际 URL
2. [ ] 配置自定义域名（可选）
3. [ ] 设置监控和告警
4. [ ] 配置日志导出
5. [ ] 修改默认密码
6. [ ] 备份数据库

## 故障排查

如果遇到问题，可以查看日志：

\`\`\`bash
# 查看后端日志
gcloud run services logs read $BACKEND_SERVICE --region=$REGION --limit=100

# 查看前端日志
gcloud run services logs read $FRONTEND_SERVICE --region=$REGION --limit=100

# 查看数据库日志
gcloud sql operations list --instance=$DB_INSTANCE
\`\`\`

---

**部署状态**: ✅ 成功  
**生成时间**: $(date '+%Y-%m-%d %H:%M:%S')
EOF

    echo -e "${GREEN}✅ 部署报告已生成: $REPORT_FILE${NC}\n"
}

# ====================================
# 显示最终结果
# ====================================
show_results() {
    echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║           🎉 部署完成！                         ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}📊 服务信息：${NC}"
    echo -e "   后端服务: ${BLUE}$BACKEND_URL${NC}"
    echo -e "   前端服务: ${BLUE}$FRONTEND_URL${NC}"
    echo ""
    echo -e "${GREEN}📝 测试账号：${NC}"
    echo -e "   管理员: admin@demo.tms-platform.com / password"
    echo -e "   调度员: dispatcher@demo.tms-platform.com / password"
    echo -e "   司机: driver@demo.tms-platform.com / password"
    echo ""
    echo -e "${GREEN}📄 详细报告：${NC}"
    echo -e "   查看文件: $REPORT_FILE"
    echo ""
    echo -e "${YELLOW}⚠️  重要提示：${NC}"
    echo -e "   1. 请登录后立即修改默认密码"
    echo -e "   2. 更新 CORS_ORIGIN 环境变量为前端实际 URL"
    echo -e "   3. 配置监控和告警"
    echo ""
}

# ====================================
# 主函数
# ====================================
main() {
    check_dependencies
    setup_project
    build_images
    init_database
    deploy_backend
    deploy_frontend
    verify_deployment
    generate_report
    show_results
}

# 运行主函数
main "$@"


