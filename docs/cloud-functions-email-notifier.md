# Cloud Functions 邮件通知服务部署指南

**创建时间**: 2025-12-12 00:25:00  
**版本**: 1.0.0  
**作用**: 客户下单后自动向调度员发送邮件通知（Gmail SMTP + Secret Manager）

## 一、功能特性

- ✅ **多语言支持**：中文（zh-CN）、英文（en），可扩展
- ✅ **Logo 内嵌**：支持 CID 引用，邮件客户端兼容
- ✅ **品牌配置**：可配置公司名称、颜色主题
- ✅ **附件支持**：自动生成 CSV 明细，支持 PDF 等外部附件
- ✅ **托盘数量**：询价请求中的托盘数量会包含在邮件中
- ✅ **Gmail SMTP**：使用 Gmail SMTP 发送邮件
- ✅ **Secret Manager**：所有敏感配置存储在 GCP Secret Manager

## 二、部署前准备

### 步骤 A：准备发信邮箱（Google Workspace）

1. **选择发信邮箱**
   - 建议使用功能型地址：`dispatch@yourcompany.com`
   - 避免使用个人邮箱

2. **启用两步验证**
   - 登录该邮箱 → Google 账户 → 安全性 → 两步验证 → 开启

3. **创建应用专用密码**
   - 进入"安全性" → "应用密码"
   - 选择"邮件" + "其他（自定义名称：Cloud Functions）"
   - 生成并复制 16 位应用专用密码（只显示一次）

4. **邮件域名投递配置**（建议，提升成功率）
   - **SPF**：在 DNS 添加 TXT 记录
     ```
     v=spf1 include:_spf.google.com ~all
     ```
   - **DKIM**：Google Admin → Apps → Gmail → Authenticate email
   - **DMARC**（可选）：TXT 记录 `_dmarc.yourcompany.com`
     ```
     v=DMARC1; p=none; rua=mailto:dmarc@yourcompany.com
     ```

### 步骤 B：在 GCP 创建 Secret

运行配置脚本：

```bash
./scripts/setup-smtp-secrets.sh
```

或手动创建：

```bash
# 必需的 Secret
echo -n "dispatch@yourcompany.com" | gcloud secrets create smtp_user --data-file=-
echo -n "your-16-digit-app-password" | gcloud secrets create smtp_app_password --data-file=-
echo -n "dispatch@yourcompany.com" | gcloud secrets create smtp_from --data-file=-
echo -n "dispatcher-team@yourcompany.com" | gcloud secrets create smtp_to_default --data-file=-

# 可选的 Secret（Logo base64，不带 data:image/png;base64, 前缀）
echo -n "iVBORw0KGgoAAAANSUhEUgAA..." | gcloud secrets create smtp_logo_base64 --data-file=-
```

### 步骤 C：授予权限

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

## 三、部署 Cloud Functions

### 使用部署脚本（推荐）

```bash
./scripts/deploy-email-notifier.sh
```

### 手动部署

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

### 获取函数 URL

```bash
gcloud functions describe orderEmailNotifier \
  --gen2 \
  --region=asia-east2 \
  --format='value(serviceConfig.uri)'
```

## 四、配置后端服务

### 1. 设置环境变量

在 Cloud Run 后端服务中设置：

```bash
EMAIL_NOTIFIER_FUNCTION_URL=https://asia-east2-YOUR_PROJECT.cloudfunctions.net/orderEmailNotifier
COMPANY_NAME=优迈德物流 TMS
BRAND_PRIMARY_COLOR=#2563eb
BRAND_HEADER_BG=#111827
BRAND_HEADER_FG=#ffffff
DISPATCH_EMAILS=dispatcher1@company.com,dispatcher2@company.com
FRONTEND_URL=https://tms-frontend-v4estohola-df.a.run.app
```

### 2. 更新部署脚本

在 `scripts/gcp-deploy-auto-artifact.sh` 中添加环境变量：

```bash
--set-env-vars="NODE_ENV=production,CORS_ORIGIN=*,EMAIL_NOTIFIER_FUNCTION_URL=https://asia-east2-YOUR_PROJECT.cloudfunctions.net/orderEmailNotifier,COMPANY_NAME=优迈德物流 TMS,BRAND_PRIMARY_COLOR=#2563eb,BRAND_HEADER_BG=#111827,BRAND_HEADER_FG=#ffffff,DISPATCH_EMAILS=dispatcher1@company.com,dispatcher2@company.com,FRONTEND_URL=https://tms-frontend-v4estohola-df.a.run.app"
```

## 五、测试

### 使用测试脚本

```bash
./scripts/test-email-notifier.sh
```

### 手动测试

```bash
curl -X POST "https://asia-east2-YOUR_PROJECT.cloudfunctions.net/orderEmailNotifier" \
  -H "Content-Type: application/json" \
  -d '{
    "lang": "zh-CN",
    "brand": {
      "name": "优迈德物流 TMS",
      "primaryColor": "#2563eb",
      "headerBg": "#111827",
      "headerFg": "#ffffff"
    },
    "order": {
      "orderNo": "QR-20251212-0001",
      "customerName": "测试客户",
      "amount": 1680,
      "currency": "CNY",
      "pickupDate": "2025-12-13",
      "link": "https://tms-frontend-v4estohola-df.a.run.app/admin/quote-requests/test-id",
      "items": [
        {"name": "机箱", "qty": 10, "weight": "12kg"},
        {"name": "主板", "qty": 20, "weight": "8kg"},
        {"name": "托盘", "qty": 5, "weight": "-"}
      ],
      "notes": "加急，夜间到仓"
    }
  }'
```

## 六、集成到询价请求流程

询价请求创建成功后，系统会自动调用 Cloud Functions 发送邮件。流程如下：

1. 客户提交询价请求
2. 后端创建询价记录
3. 检查 `EMAIL_NOTIFIER_FUNCTION_URL` 环境变量
4. 如果配置了，调用 Cloud Functions 发送邮件
5. 如果未配置或调用失败，回退到直接 SMTP 方式

### 邮件内容包含

- 询价编号
- 客户信息（联系人、公司、联系方式）
- 路线信息（起始地、目的地）
- 预计发货日期
- 重量、体积、件数、**托盘数量**
- 服务类型
- 备注
- 订单详情链接
- CSV 明细附件（自动生成）

## 七、请求体格式

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
  logoBase64?: string,   // Logo base64（可选，优先使用）
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

## 八、常见问题与排查

### 1. 535 Authentication failed

**原因**：
- 应用专用密码错误
- 账户未开启两步验证
- 用户名不是完整邮箱地址

**解决**：
- 检查应用专用密码是否正确
- 确认两步验证已开启
- 使用完整邮箱地址（如 `dispatch@yourcompany.com`）

### 2. ECONNREFUSED 或 ETIMEDOUT

**原因**：
- 函数出网受限
- VPC 配置阻止访问 SMTP 端口

**解决**：
- 确认 Cloud Functions 可以访问互联网
- 如果使用私有 VPC，开放 587/465 端口

### 3. 邮件被判垃圾邮件

**原因**：
- 缺少 SPF/DKIM/DMARC 配置
- 发信频率过高
- 内容过于营销化

**解决**：
- 配置 SPF/DKIM/DMARC
- 控制发信频率
- 优化邮件主题和内容

### 4. 长附件超限

**原因**：
- Gmail 单封邮件上限约 25MB

**解决**：
- 超过限制的附件改为提供下载链接
- 压缩附件大小

### 5. Secret Manager 权限错误

**原因**：
- 服务账号缺少 `roles/secretmanager.secretAccessor` 角色

**解决**：
```bash
# 授予权限
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

gcloud secrets add-iam-policy-binding smtp_user \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/secretmanager.secretAccessor"
```

## 九、监控与日志

### 查看 Cloud Functions 日志

```bash
gcloud functions logs read orderEmailNotifier \
  --gen2 \
  --region=asia-east2 \
  --limit=50
```

### 查看邮件发送状态

在 Cloud Logging 中搜索：
- `orderEmailNotifier`
- `Email sent successfully`
- `orderEmailNotifier error`

## 十、成本说明

- **Cloud Functions 2nd gen**：
  - 免费层：每月前 200 万次调用
  - 超出后：$0.40 / 100 万次调用
  - 内存：256Mi（免费层足够）

- **Secret Manager**：
  - 免费层：每月前 6 个 Secret 版本访问
  - 超出后：$0.06 / 10,000 次访问

- **Gmail SMTP**：
  - Google Workspace 账户：每日发送限额较高（通常 2000 封/天）
  - 个人 Gmail：每日 500 封

## 十一、安全建议

1. **应用专用密码**：仅用于 SMTP，保存在 Secret Manager
2. **Secret 轮换**：定期更新应用专用密码
3. **访问控制**：限制 Cloud Functions 的调用来源（可选）
4. **日志监控**：监控异常发送行为
5. **速率限制**：在应用层实现发送频率限制

## 十二、扩展功能

### 添加新语言

在 `cloud-functions/order-email-notifier/index.js` 的 `I18N` 对象中添加：

```javascript
'fr': {
  subject: (o) => `Nouvelle commande: ${o.customerName || ''} — ${o.orderNo || ''}`,
  // ... 其他翻译
}
```

### 自定义邮件模板

修改 `renderHtmlTemplate` 函数，调整 HTML 结构和样式。

### 添加更多附件类型

在 `buildAttachments` 函数中添加新的附件处理逻辑。

---

**最后更新**: 2025-12-12 00:25:00
