# DNS 配置指南 - 基于 Google Cloud 域名映射

**创建时间**: 2025-12-03  
**用途**: 在已创建域名映射后，配置 DNS CNAME 记录

## ✅ 如果您已经在 Google Cloud Console 创建了域名映射

### 步骤 1: 获取 CNAME 值

在 Google Cloud Console 的域名映射界面：

1. **找到您创建的映射**（例如 `tms.yourdomain.com`）
2. **点击映射名称**进入详情页
3. **查看 "DNS 记录" 或 "CNAME 记录" 部分**

您会看到类似这样的信息：
```
CNAME 记录：
tms.yourdomain.com -> ghs.googlehosted.com
```

或者更具体的值：
```
ghs-xxxxx.dv.googlehosted.com
```

### 步骤 2: 在 DNS 提供商配置

根据 Google Cloud 返回的 CNAME 值，在您的 DNS 提供商处填写：

**如果 Google Cloud 返回的是 `ghs.googlehosted.com`**：

| 字段 | 值 | 说明 |
|------|-----|------|
| **HOST** | `tms` | 二级域名前缀（不含主域名） |
| **TYPE** | `CNAME` | 记录类型 |
| **PRIORITY** | `-` 或留空 | CNAME 不需要优先级 |
| **TTL** | `4 hrs` 或 `3600` | 缓存时间 |
| **ALIAS DATA** | `ghs.googlehosted.com` | **使用 Google Cloud 返回的确切值** |

**如果 Google Cloud 返回的是 `ghs-xxxxx.dv.googlehosted.com`**：

| 字段 | 值 |
|------|-----|
| **HOST** | `tms` |
| **TYPE** | `CNAME` |
| **ALIAS DATA** | `ghs-xxxxx.dv.googlehosted.com` | **使用完整值** |

## 🔍 如何查看 CNAME 值

### 方法 1: 通过 Google Cloud Console

1. 进入 [Cloud Run 域名映射](https://console.cloud.google.com/run/domains)
2. 找到您的映射（例如 `tms.yourdomain.com`）
3. 点击映射名称
4. 在详情页查看 "DNS 记录" 部分

### 方法 2: 通过 gcloud 命令

```bash
# 查看所有域名映射
gcloud run domain-mappings list --region=us-central1

# 查看特定映射的详细信息（包含 CNAME 值）
gcloud run domain-mappings describe tms.yourdomain.com \
  --region=us-central1 \
  --format="value(status.resourceRecords)"
```

## ⚠️ 重要注意事项

### ✅ 正确做法

1. **先创建域名映射**（在 Google Cloud Console）
2. **获取 Google 返回的 CNAME 值**
3. **在 DNS 提供商填写该 CNAME 值**

### ❌ 错误做法

- ❌ 直接填写 Cloud Run 服务 URL（`https://tms-frontend-v4estohola-df.a.run.app`）
- ❌ 填写服务名称（`tms-frontend`）
- ❌ 不创建映射就直接配置 DNS

## 📝 完整流程示例

假设您要配置 `tms.apony.group.com`：

### 1. 在 Google Cloud Console 创建映射

点击界面上的 **"添加映射"** 按钮，填写：
- **网域**: `tms.apony.group.com`
- **映射目标**: 选择 `tms-frontend` 服务
- **区域**: 选择服务所在区域（如 `us-central1`）

### 2. 等待映射创建完成

创建后，Google Cloud 会显示 CNAME 记录值，例如：
```
ghs.googlehosted.com
```

### 3. 在 DNS 提供商配置

根据返回的值填写：

```
HOST: tms
TYPE: CNAME
ALIAS DATA: ghs.googlehosted.com
TTL: 4 hrs
```

### 4. 验证配置

等待 DNS 传播（5-30 分钟），然后访问：
```
https://tms.apony.group.com
```

## 🔧 故障排查

### 问题 1: DNS 配置后无法访问

**检查项**：
1. 确认 CNAME 值是否正确（使用 Google Cloud 返回的值）
2. 等待 DNS 传播完成（最多 48 小时，通常 5-30 分钟）
3. 检查域名映射状态是否为 "ACTIVE"

```bash
# 检查映射状态
gcloud run domain-mappings describe tms.yourdomain.com \
  --region=us-central1
```

### 问题 2: 找不到 CNAME 值

**解决方案**：
1. 确认映射已创建成功
2. 在映射详情页查看 "DNS 记录" 部分
3. 或使用 gcloud 命令查看

### 问题 3: DNS 记录不生效

**检查项**：
1. HOST 字段只填写前缀（如 `tms`），不要包含完整域名
2. ALIAS DATA 使用 Google Cloud 返回的完整值
3. TTL 设置合理（建议 4 小时或更长）

## 📚 参考

- [Cloud Run 自定义域名文档](https://cloud.google.com/run/docs/mapping-custom-domains)
- [Google Cloud DNS 配置](https://cloud.google.com/dns/docs/overview)

---

**总结**: 如果已经在 Google Cloud Console 创建了域名映射，使用 Google 返回的 CNAME 值（通常是 `ghs.googlehosted.com`）填写 DNS 记录是正确的！

