# Cloud Run 自定义域名配置指南

**创建时间**: 2025-12-03  
**用途**: 配置二级域名指向 Cloud Run 服务

## 📋 配置步骤

### 步骤 1: 在 Google Cloud Console 创建域名映射

首先需要在 Google Cloud Console 中创建域名映射，而不是直接在 DNS 中配置。

```bash
# 设置变量
export PROJECT_ID=aponytms
export REGION=us-central1  # 或您的服务所在区域
export DOMAIN=tms.yourdomain.com  # 您的二级域名

# 创建域名映射
gcloud run domain-mappings create \
  --service=tms-frontend \
  --domain=$DOMAIN \
  --region=$REGION \
  --project=$PROJECT_ID
```

**重要**: 执行此命令后，Google Cloud 会返回一个 CNAME 记录值，类似：
```
ghs.googlehosted.com
```
或者更具体的值，如：
```
ghs-xxxxx.dv.googlehosted.com
```

### 步骤 2: 在 DNS 提供商配置 CNAME 记录

根据 Google Cloud 返回的 CNAME 值，在您的 DNS 提供商处配置：

**如果您的域名是 `tms.yourdomain.com`**：

| 字段 | 值 | 说明 |
|------|-----|------|
| **HOST** | `tms` | 二级域名前缀 |
| **TYPE** | `CNAME` | 记录类型 |
| **PRIORITY** | `-` | CNAME 不需要优先级 |
| **TTL** | `4 hrs` 或 `3600` | 缓存时间 |
| **ALIAS DATA** | `ghs.googlehosted.com` | **使用 Google Cloud 返回的值** |

### 步骤 3: 验证配置

等待 DNS 传播（通常 5-30 分钟），然后验证：

```bash
# 检查 DNS 记录
dig tms.yourdomain.com CNAME

# 或使用 nslookup
nslookup -type=CNAME tms.yourdomain.com
```

应该看到指向 `ghs.googlehosted.com` 或类似的值。

### 步骤 4: 验证域名映射状态

```bash
# 查看域名映射状态
gcloud run domain-mappings describe $DOMAIN \
  --region=$REGION \
  --project=$PROJECT_ID
```

状态应该是 `ACTIVE` 表示配置成功。

## ⚠️ 常见错误

### ❌ 错误配置

**不要直接填写**：
- ❌ `https://tms-frontend-v4estohola-df.a.run.app` （这是服务 URL，不是 CNAME 目标）
- ❌ `tms-frontend-v4estohola-df.a.run.app` （Cloud Run 服务名不能直接作为 CNAME）

### ✅ 正确配置

1. **先在 Google Cloud Console 创建域名映射**
2. **使用 Google 返回的 CNAME 值**（通常是 `ghs.googlehosted.com` 或类似）

## 📝 完整示例

假设您要配置 `tms.example.com` 指向前端服务：

```bash
# 1. 创建域名映射
gcloud run domain-mappings create \
  --service=tms-frontend \
  --domain=tms.example.com \
  --region=us-central1 \
  --project=aponytms

# 输出示例：
# Waiting for domain mapping to be created...done.
# Domain mapping created. Please update your DNS records:
#   CNAME: tms.example.com -> ghs.googlehosted.com
```

然后在 DNS 提供商配置：

```
HOST: tms
TYPE: CNAME
ALIAS DATA: ghs.googlehosted.com
TTL: 4 hrs
```

## 🔍 验证 DNS 配置

配置完成后，等待 DNS 传播，然后访问：
- `https://tms.yourdomain.com`

如果配置正确，应该能够访问到 TMS 前端应用。

## 📚 参考文档

- [Cloud Run 自定义域名文档](https://cloud.google.com/run/docs/mapping-custom-domains)
- [Google Cloud DNS 配置](https://cloud.google.com/dns/docs/overview)

---

**注意**: 如果您的 DNS 提供商是 Google Cloud DNS，也可以使用 `gcloud dns` 命令自动配置。

