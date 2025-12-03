# GCP 部署配置指南

## 当前状态

- **gcloud SDK**: 已安装 ✅
- **当前账户**: `itsouvenir1600@gmail.com`
- **目标项目 ID**: `275911787144`
- **问题**: 当前账户无法访问目标项目

## 解决方案

### 方案 1: 使用正确的账户登录（推荐）

如果您有访问项目 `275911787144` 的账户，请使用以下命令登录：

```bash
# 登录新账户
gcloud auth login

# 设置项目
gcloud config set project 275911787144

# 验证访问权限
gcloud projects describe 275911787144
```

### 方案 2: 使用服务账户

如果您需要使用服务账户：

```bash
# 下载服务账户密钥文件（JSON格式）
# 然后使用以下命令激活：
gcloud auth activate-service-account SERVICE_ACCOUNT_EMAIL --key-file=path/to/key.json

# 设置项目
gcloud config set project 275911787144
```

### 方案 3: 在 GCP Console 中授权

1. 访问 [GCP Console](https://console.cloud.google.com/)
2. 选择项目 `275911787144`
3. 导航到 "IAM & Admin" > "IAM"
4. 添加 `itsouvenir1600@gmail.com` 并授予必要权限（如 Editor 或 Owner）

## 部署步骤

### 1. 验证项目访问

```bash
# 验证项目访问权限
gcloud projects describe 275911787144

# 验证认证状态
gcloud auth list

# 设置默认项目
gcloud config set project 275911787144
```

### 2. 启用必要的 API

```bash
# 启用 Cloud Run API
gcloud services enable run.googleapis.com

# 启用 Cloud Build API
gcloud services enable cloudbuild.googleapis.com

# 启用 Container Registry API
gcloud services enable containerregistry.googleapis.com

# 启用 Secret Manager API（用于管理敏感信息）
gcloud services enable secretmanager.googleapis.com
```

### 3. 配置 Docker 认证

```bash
# 配置 Docker 以使用 gcloud 作为凭证助手
gcloud auth configure-docker
```

### 4. 设置区域

```bash
# 设置默认区域（例如：us-central1, asia-east1, asia-east2）
gcloud config set compute/region asia-east2
```

## 下一步

完成上述配置后，可以开始部署应用。请告知我：

1. 您是否已经解决了项目访问权限问题？
2. 您希望使用哪个区域部署？（推荐：`asia-east2` 或 `us-central1`）
3. 您是否需要创建服务账户用于 CI/CD？

完成后我们可以继续部署流程。

