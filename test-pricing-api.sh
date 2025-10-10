#!/bin/bash
# 计费引擎 API 直接测试
# 创建时间: 2025-10-08 14:50:00

echo "=== 计费引擎 API 测试 ==="
echo ""

# JWT Token
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwMDAwMDAwMC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDEiLCJ0ZW5hbnRJZCI6IjAwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAwMSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1OTUyMTcxOCwiZXhwIjoxNzYwMTI2NTE4fQ.NPx9IZ_YT-nORbmEEHygm_ewJYLY8dt29D7ucHR_a68"

# 测试数据
REQUEST_DATA='{
  "shipmentContext": {
    "shipmentId": "550e8400-e29b-41d4-a716-446655440000",
    "tenantId": "00000000-0000-0000-0000-000000000001",
    "pickupLocation": {
      "address": "228-8323 KENNEDY RD",
      "city": "MARKHAM"
    },
    "deliveryLocation": {
      "address": "8323 KENNEDY RD",
      "city": "MARKHAM"
    },
    "distance": 25,
    "weight": 15,
    "volume": 0.001,
    "pallets": 1
  },
  "forceRecalculate": false
}'

echo "📊 请求数据:"
echo "$REQUEST_DATA" | jq '.'
echo ""

echo "🚀 调用计费引擎 API..."
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST http://localhost:8000/api/pricing/calculate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: 00000000-0000-0000-0000-000000000001" \
  -d "$REQUEST_DATA")

# 分离响应体和状态码
HTTP_BODY=$(echo "$RESPONSE" | sed -e 's/HTTP_STATUS\:.*//g')
HTTP_STATUS=$(echo "$RESPONSE" | tr -d '\n' | sed -e 's/.*HTTP_STATUS://')

echo ""
echo "📈 HTTP 状态码: $HTTP_STATUS"
echo ""

if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ API 调用成功！"
    echo ""
    echo "📋 响应数据:"
    echo "$HTTP_BODY" | jq '.'
    echo ""
    
    # 验证响应结构
    SUCCESS=$(echo "$HTTP_BODY" | jq -r '.success')
    TOTAL_REVENUE=$(echo "$HTTP_BODY" | jq -r '.data.totalRevenue')
    
    if [ "$SUCCESS" = "true" ] && [ "$TOTAL_REVENUE" != "null" ]; then
        echo "✅ 响应结构正确"
        echo "✅ 总收入: \$$TOTAL_REVENUE"
        echo ""
        echo "💰 费用明细:"
        echo "$HTTP_BODY" | jq '.data.revenueBreakdown[] | {componentCode, amount}'
        echo ""
        echo "🎉 计费引擎工作正常！"
    else
        echo "❌ 响应结构错误"
        echo "  success: $SUCCESS"
        echo "  totalRevenue: $TOTAL_REVENUE"
    fi
else
    echo "❌ API 调用失败"
    echo ""
    echo "错误信息:"
    echo "$HTTP_BODY" | jq '.'
fi

