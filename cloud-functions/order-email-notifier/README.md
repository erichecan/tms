# Cloud Functions 邮件通知服务

**创建时间**: 2025-12-12 00:25:00  
**版本**: 1.0.0  
**作用**: 支持多语言、Logo、附件的高级邮件通知服务

## 功能特性

- ✅ 多语言支持（中文、英文，可扩展）
- ✅ 品牌 Logo 内嵌（CID 引用）
- ✅ 可配置品牌颜色和公司名称
- ✅ CSV 明细附件自动生成
- ✅ 支持 PDF 等外部附件
- ✅ Gmail SMTP 集成
- ✅ GCP Secret Manager 配置管理

## 部署前准备

### 1. 创建 Secret Manager 密钥

```bash
# 必需的 Secret
echo -n "dispatch@yourcompany.com" | gcloud secrets create smtp_user --data-file=-
echo -n "your-16-digit-app-password" | gcloud secrets create smtp_app_password --data-file=-
echo -n "dispatch@yourcompany.com" | gcloud secrets create smtp_from --data-file=-
echo -n "dispatcher-team@yourcompany.com" | gcloud secrets create smtp_to_default --data-file=-

# 可选的 Secret（Logo base64，不带 data:image/png;base64, 前缀）
echo -n "iVBORw0KGgoAAAANSUhEUgAA..." | gcloud secrets create smtp_logo_base64 --data-file=-
```

### 2. 授予权限

```bash
PROJECT_ID=$(gcloud config get-value project)
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

for secret in smtp_user smtp_app_password smtp_from smtp_to_default smtp_logo_base64; do
  gcloud secrets add-iam-policy-binding $secret \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/secretmanager.secretAccessor" \
    --quiet
done
```

## 部署

### 使用 gcloud CLI

```bash
cd cloud-functions/order-email-notifier

gcloud functions deploy orderEmailNotifier \
  --gen2 \
  --region=asia-east2 \
  --runtime=nodejs18 \
  --entry-point=orderEmailNotifier \
  --trigger-http \
  --allow-unauthenticated \
  --memory=256Mi \
  --timeout=60s \
  --max-instances=10
```

### 使用部署脚本

```bash
./scripts/deploy-email-notifier.sh
```

## 测试

### 中文测试

```bash
curl -X POST "https://asia-east2-YOUR_PROJECT.cloudfunctions.net/orderEmailNotifier" \
  -H "Content-Type: application/json" \
  -d '{
    "lang": "zh-CN",
    "brand": {
      "name": "Apony 物流",
      "primaryColor": "#FF6B35",
      "headerBg": "#FF6B35",
      "headerFg": "#ffffff"
    },
    "order": {
      "orderNo": "SO-2025-0003",
      "customerName": "ACME",
      "amount": 1680,
      "currency": "CNY",
      "pickupDate": "2025-12-13",
      "link": "https://tms.company.com/orders/SO-2025-0003",
      "to": "dispatcher-team@yourcompany.com",
      "items": [
        {"name":"机箱","qty":10,"weight":"12kg"},
        {"name":"主板","qty":20,"weight":"8kg"}
      ],
      "notes": "加急，夜间到仓"
    }
  }'
```

### 英文测试

```bash
curl -X POST "https://asia-east2-YOUR_PROJECT.cloudfunctions.net/orderEmailNotifier" \
  -H "Content-Type: application/json" \
  -d '{
    "lang": "en",
    "brand": {
      "name": "Apony 物流",
      "primaryColor": "#0ea5e9",
      "headerBg": "#0f172a",
      "headerFg": "#ffffff"
    },
    "order": {
      "orderNo": "SO-2025-0004",
      "customerName": "Globex",
      "amount": 2350,
      "currency": "USD",
      "pickupDate": "2025-12-14",
      "link": "https://tms.company.com/orders/SO-2025-0004",
      "to": "dispatch@yourcompany.com",
      "items": [
        {"name":"Chassis","qty":10,"weight":"12kg"},
        {"name":"Mainboard","qty":20,"weight":"8kg"}
      ],
      "notes": "Express"
    }
  }'
```

## 请求体格式

```typescript
{
  lang?: 'zh-CN' | 'en',  // 语言，默认 'zh-CN'
  brand?: {
    name?: string,        // 公司名称
    primaryColor?: string, // 主色调（按钮、链接）
    headerBg?: string,     // 头部背景色
    headerFg?: string     // 头部文字颜色
  },
  logoCid?: string,       // Logo CID 引用名，默认 'company-logo'
  logoBase64?: string,     // Logo base64（可选，优先使用）
  order: {
    orderNo: string,      // 订单号（必填）
    customerName: string, // 客户名称（必填）
    amount?: number,      // 金额
    currency?: string,    // 币种
    pickupDate?: string,  // 提货日期
    link?: string,        // 订单详情链接
    to?: string,          // 收件人（可选，使用 smtp_to_default）
    items?: Array<{       // 货品明细
      name: string,
      qty: number,
      weight: string
    }>,
    notes?: string,       // 备注
    attachments?: Array<{ // 外部附件
      filename: string,
      base64: string,
      contentType: string
    }>
  }
}
```

## 集成到询价请求流程

在询价请求创建成功后，调用此 Cloud Functions：

```typescript
const response = await fetch('https://asia-east2-YOUR_PROJECT.cloudfunctions.net/orderEmailNotifier', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    lang: 'zh-CN',
    brand: {
      name: 'Apony 物流',
      primaryColor: '#2563eb',
      headerBg: '#111827',
      headerFg: '#ffffff'
    },
    order: {
      orderNo: quoteRequest.code,
      customerName: quoteRequest.contactName,
      amount: estimatedPrice,
      currency: 'CNY',
      pickupDate: quoteRequest.shipDate,
      link: `${FRONTEND_URL}/admin/quote-requests/${quoteRequest.id}`,
      items: [
        {
          name: '货物',
          qty: quoteRequest.pieces || 1,
          weight: `${quoteRequest.weightKg}kg`
        }
      ],
      notes: quoteRequest.note
    }
  })
});
```

## 注意事项

1. **Logo 格式**: 推荐 PNG，base64 不要包含 `data:image/png;base64,` 前缀
2. **邮件大小**: Gmail 单封上限约 25MB，超限附件改为下载链接
3. **多语言扩展**: 在 `I18N` 对象中新增语言键即可
4. **防垃圾邮件**: 建议配置 SPF/DKIM/DMARC
5. **安全**: 应用专用密码仅用于 SMTP，保存在 Secret Manager
