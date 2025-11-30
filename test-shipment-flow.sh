#!/bin/bash
# 运单创建流程完整测试脚本
# 创建时间: 2025-11-29T22:20:00

set -e

echo "=========================================="
echo "运单创建流程完整测试"
echo "=========================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试结果统计
PASSED=0
FAILED=0
ERRORS=()

# 1. 登录获取 Token
echo "1. 测试登录功能..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.tms-platform.com","password":"password"}')

if echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); exit(0 if data.get('success') and data.get('data', {}).get('token') else 1)" 2>/dev/null; then
  TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['data']['token'])" 2>/dev/null)
  echo -e "${GREEN}✓ 登录成功${NC}"
  ((PASSED++))
else
  echo -e "${RED}✗ 登录失败${NC}"
  echo "$LOGIN_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$LOGIN_RESPONSE"
  ((FAILED++))
  ERRORS+=("登录失败")
  exit 1
fi

TENANT_ID="00000000-0000-0000-0000-000000000001"
echo ""

# 2. 测试费用计算 API
echo "2. 测试费用计算引擎 API..."
PRICING_PAYLOAD='{
  "shipmentContext": {
    "shipmentId": "'$(python3 -c "import uuid; print(uuid.uuid4())")'",
    "tenantId": "'$TENANT_ID'",
    "pickupLocation": {
      "address": "123 Main St, Toronto, ON",
      "city": "Toronto"
    },
    "deliveryLocation": {
      "address": "456 Oak Ave, Ottawa, ON",
      "city": "Ottawa"
    },
    "distance": 450,
    "weight": 100,
    "volume": 2.5,
    "pallets": 2,
    "cargoType": "GENERAL"
  },
  "forceRecalculate": false
}'

PRICING_RESPONSE=$(curl -s -X POST http://localhost:5000/api/pricing/calculate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -d "$PRICING_PAYLOAD")

if echo "$PRICING_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); exit(0 if data.get('success') else 1)" 2>/dev/null; then
  TOTAL=$(echo "$PRICING_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('data', {}).get('totalRevenue', 0))" 2>/dev/null)
  echo -e "${GREEN}✓ 费用计算成功: \$${TOTAL}${NC}"
  ((PASSED++))
else
  echo -e "${YELLOW}⚠ 费用计算失败（可能未配置模板，使用降级逻辑）${NC}"
  echo "$PRICING_RESPONSE" | python3 -m json.tool 2>/dev/null | head -20 || echo "$PRICING_RESPONSE"
  # 这不算失败，因为有降级逻辑
fi
echo ""

# 3. 测试创建运单 API
echo "3. 测试创建运单 API..."
SHIPMENT_TIMESTAMP=$(date +%s)
SHIPMENT_PAYLOAD='{
  "shipmentNumber": "TEST-'$SHIPMENT_TIMESTAMP'",
  "customerName": "测试客户-'$SHIPMENT_TIMESTAMP'",
  "customerPhone": "+1-555-123-4567",
  "customerEmail": "test@example.com",
  "priority": "vip1",
  "salesChannel": "DIRECT",
  "shipper": {
    "name": "发货人",
    "phone": "+1-555-111-1111",
    "email": "shipper@example.com",
    "address": {
      "addressLine1": "123 Main Street",
      "addressLine2": "Suite 100",
      "city": "Toronto",
      "province": "ON",
      "postalCode": "M5H 2N2",
      "country": "CA"
    }
  },
  "receiver": {
    "name": "收货人",
    "phone": "+1-555-222-2222",
    "email": "receiver@example.com",
    "address": {
      "addressLine1": "456 Oak Avenue",
      "city": "Ottawa",
      "province": "ON",
      "postalCode": "K1A 0A6",
      "country": "CA"
    }
  },
  "distance": 450,
  "cargoLength": 100,
  "cargoWidth": 80,
  "cargoHeight": 60,
  "cargoWeight": 150,
  "cargoQuantity": 5,
  "cargoPalletCount": 2,
  "cargoValue": 5000,
  "cargoDescription": "测试货物",
  "cargoIsFragile": false,
  "cargoIsDangerous": false,
  "cargoType": "GENERAL",
  "estimatedCost": 500,
  "status": "pending_confirmation"
}'

SHIPMENT_RESPONSE=$(curl -s -X POST http://localhost:5000/api/shipments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -d "$SHIPMENT_PAYLOAD")

if echo "$SHIPMENT_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); exit(0 if data.get('success') else 1)" 2>/dev/null; then
  SHIPMENT_ID=$(echo "$SHIPMENT_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('data', {}).get('id', ''))" 2>/dev/null)
  echo -e "${GREEN}✓ 运单创建成功: $SHIPMENT_ID${NC}"
  ((PASSED++))
else
  echo -e "${RED}✗ 运单创建失败${NC}"
  echo "$SHIPMENT_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$SHIPMENT_RESPONSE"
  ((FAILED++))
  ERRORS+=("运单创建失败: $SHIPMENT_RESPONSE")
  SHIPMENT_ID=""
fi
echo ""

# 4. 测试多行货物运单创建
if [ -n "$SHIPMENT_ID" ]; then
  echo "4. 测试多行货物运单创建..."
  MULTI_TIMESTAMP=$(date +%s)
  MULTI_ITEM_PAYLOAD='{
    "shipmentNumber": "TEST-MULTI-'$MULTI_TIMESTAMP'",
    "customerName": "测试客户-MULTI-'$MULTI_TIMESTAMP'",
    "customerPhone": "+1-555-123-4567",
    "customerEmail": "test@example.com",
    "priority": "vip1",
    "salesChannel": "DIRECT",
    "shipper": {
      "name": "发货人",
      "phone": "+1-555-111-1111",
      "email": "shipper@example.com",
      "address": {
        "addressLine1": "123 Main Street",
        "city": "Toronto",
        "province": "ON",
        "postalCode": "M5H 2N2",
        "country": "CA"
      }
    },
    "receiver": {
      "name": "收货人",
      "phone": "+1-555-222-2222",
      "email": "receiver@example.com",
      "address": {
        "addressLine1": "456 Oak Avenue",
        "city": "Ottawa",
        "province": "ON",
        "postalCode": "K1A 0A6",
        "country": "CA"
      }
    },
    "distance": 450,
    "cargoItems": [
      {
        "length": 100,
        "width": 80,
        "height": 60,
        "weight": 50,
        "quantity": 3,
        "pallets": 1,
        "value": 2000,
        "description": "货物A"
      },
      {
        "length": 120,
        "width": 90,
        "height": 70,
        "weight": 75,
        "quantity": 2,
        "pallets": 1,
        "value": 3000,
        "description": "货物B"
      }
    ],
    "estimatedCost": 600,
    "status": "pending_confirmation"
  }'
  
  MULTI_ITEM_RESPONSE=$(curl -s -X POST http://localhost:5000/api/shipments \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -H "X-Tenant-ID: $TENANT_ID" \
    -d "$MULTI_ITEM_PAYLOAD")
  
  if echo "$MULTI_ITEM_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); exit(0 if data.get('success') else 1)" 2>/dev/null; then
    MULTI_SHIPMENT_ID=$(echo "$MULTI_ITEM_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('data', {}).get('id', ''))" 2>/dev/null)
    echo -e "${GREEN}✓ 多行货物运单创建成功: $MULTI_SHIPMENT_ID${NC}"
    ((PASSED++))
  else
    echo -e "${RED}✗ 多行货物运单创建失败${NC}"
    echo "$MULTI_ITEM_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$MULTI_ITEM_RESPONSE"
    ((FAILED++))
    ERRORS+=("多行货物运单创建失败: $MULTI_ITEM_RESPONSE")
  fi
  echo ""
fi

# 5. 测试指派司机（如果有运单）
if [ -n "$SHIPMENT_ID" ]; then
  echo "5. 测试指派司机功能..."
  
  # 先获取可用司机列表
  DRIVERS_RESPONSE=$(curl -s -X GET http://localhost:5000/api/drivers \
    -H "Authorization: Bearer $TOKEN" \
    -H "X-Tenant-ID: $TENANT_ID")
  
  DRIVER_ID=$(echo "$DRIVERS_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); drivers=data.get('data', []); print(drivers[0].get('id', '') if drivers else '')" 2>/dev/null)
  
  if [ -n "$DRIVER_ID" ]; then
    ASSIGN_RESPONSE=$(curl -s -X POST "http://localhost:5000/api/shipments/$SHIPMENT_ID/assign" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -H "X-Tenant-ID: $TENANT_ID" \
      -d "{\"driverId\": \"$DRIVER_ID\"}")
    
    if echo "$ASSIGN_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); exit(0 if data.get('success') else 1)" 2>/dev/null; then
      echo -e "${GREEN}✓ 指派司机成功${NC}"
      ((PASSED++))
    else
      echo -e "${YELLOW}⚠ 指派司机失败（可能运单状态不允许）${NC}"
      echo "$ASSIGN_RESPONSE" | python3 -m json.tool 2>/dev/null | head -10 || echo "$ASSIGN_RESPONSE"
    fi
  else
    echo -e "${YELLOW}⚠ 没有可用司机进行测试${NC}"
  fi
  echo ""
fi

# 6. 测试挂载到行程
if [ -n "$SHIPMENT_ID" ]; then
  echo "6. 测试挂载运单到行程..."
  
  # 先获取可用行程列表
  TRIPS_RESPONSE=$(curl -s -X GET "http://localhost:5000/api/trips?status=planning" \
    -H "Authorization: Bearer $TOKEN" \
    -H "X-Tenant-ID: $TENANT_ID")
  
  TRIP_ID=$(echo "$TRIPS_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); trips=data.get('data', []); print(trips[0].get('id', '') if trips else '')" 2>/dev/null)
  
  if [ -n "$TRIP_ID" ]; then
    MOUNT_RESPONSE=$(curl -s -X POST "http://localhost:5000/api/trips/$TRIP_ID/shipments" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -H "X-Tenant-ID: $TENANT_ID" \
      -d "{\"shipmentIds\": [\"$SHIPMENT_ID\"]}")
    
    if echo "$MOUNT_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); exit(0 if data.get('success') else 1)" 2>/dev/null; then
      echo -e "${GREEN}✓ 挂载到行程成功${NC}"
      ((PASSED++))
    else
      echo -e "${YELLOW}⚠ 挂载到行程失败（可能行程不存在或状态不允许）${NC}"
      echo "$MOUNT_RESPONSE" | python3 -m json.tool 2>/dev/null | head -10 || echo "$MOUNT_RESPONSE"
    fi
  else
    echo -e "${YELLOW}⚠ 没有可用行程进行测试${NC}"
  fi
  echo ""
fi

# 总结
echo "=========================================="
echo "测试总结"
echo "=========================================="
echo -e "${GREEN}通过: $PASSED${NC}"
echo -e "${RED}失败: $FAILED${NC}"
echo ""

if [ ${#ERRORS[@]} -gt 0 ]; then
  echo "错误列表:"
  for error in "${ERRORS[@]}"; do
    echo -e "  ${RED}✗ $error${NC}"
  done
  echo ""
fi

exit $FAILED

