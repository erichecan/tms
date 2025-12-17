# DNS CNAME 记录格式说明

**创建时间**: 2025-12-03  
**问题**: CNAME 记录值末尾是否需要加点（`.`）

## 📋 答案

### ✅ 推荐做法：**加上点（`.`）**

**正确格式**：
```
ghs.googlehosted.com.
```

**说明**：
- 末尾的点（`.`）表示这是一个**绝对域名**（FQDN - Fully Qualified Domain Name）
- 这是 DNS 标准的正确格式
- 确保 DNS 解析器正确识别为完整域名

### ⚠️ 不加点的情况

**也可以工作，但不推荐**：
```
ghs.googlehosted.com
```

**说明**：
- 很多 DNS 提供商会自动处理，加不加点都可以
- 但为了确保兼容性和标准性，建议加上点

## 🔍 如何确认

### 方法 1: 查看 Google Cloud Console

在域名映射详情页，Google Cloud 通常会显示：
```
ghs.googlehosted.com.
```
（带点）

### 方法 2: 使用 gcloud 命令

```bash
gcloud run domain-mappings describe tms.yourdomain.com \
  --region=us-central1 \
  --format="value(status.resourceRecords)"
```

查看返回的值是否带点。

### 方法 3: 查看 DNS 记录示例

Google Cloud 文档中的示例通常显示为：
```
ghs.googlehosted.com.
```

## 📝 在 DNS 提供商处填写

### 如果 Google Cloud 返回的值带点

| 字段 | 值 |
|------|-----|
| **HOST** | `tms` |
| **TYPE** | `CNAME` |
| **ALIAS DATA** | `ghs.googlehosted.com.` | **包含末尾的点** |

### 如果 Google Cloud 返回的值不带点

| 字段 | 值 |
|------|-----|
| **HOST** | `tms` |
| **TYPE** | `CNAME` |
| **ALIAS DATA** | `ghs.googlehosted.com.` | **建议加上点** |

## ✅ 最佳实践

**无论 Google Cloud 返回的值是否带点，建议在 DNS 配置时加上点**：

```
ghs.googlehosted.com.
```

这样可以：
- ✅ 符合 DNS 标准（FQDN 格式）
- ✅ 避免某些 DNS 解析器的兼容性问题
- ✅ 确保在所有环境下都能正确解析

## 🔧 验证

配置完成后，可以使用以下命令验证：

```bash
# 查看 DNS 记录
dig tms.yourdomain.com CNAME

# 或
nslookup -type=CNAME tms.yourdomain.com
```

应该看到指向 `ghs.googlehosted.com.`（带点）。

---

**总结**: 建议加上末尾的点（`.`），格式为 `ghs.googlehosted.com.`

