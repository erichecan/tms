# Neon MCP 服务器配置说明

## 已安装

Neon MCP 服务器已添加到 `.cursor/config.json` 配置文件中。

## 配置步骤

### 1. 获取 Neon API Key

1. 登录 [Neon Console](https://console.neon.tech/)
2. 进入 Settings → API Keys
3. 创建新的 API Key 或使用现有的
4. 复制 API Key（注意：API Key 只显示一次，请妥善保存）

### 2. 配置 API Key

编辑 `.cursor/config.json` 文件，将 `YOUR_NEON_API_KEY_HERE` 替换为您的实际 API Key：

```json
{
  "mcpServers": {
    "neon": {
      "command": "npx",
      "args": [
        "-y",
        "@neondatabase/mcp-server-neon",
        "start",
        "your-actual-api-key-here"  // 替换这里
      ],
      "env": {}
    }
  }
}
```

**重要提示**：
- API Key 具有访问您 Neon 账户的完整权限，请妥善保管
- 不要将包含真实 API Key 的配置文件提交到 Git 仓库
- 建议将 `.cursor/config.json` 添加到 `.gitignore` 中（如果包含敏感信息）

```json
{
  "mcpServers": {
    "neon": {
      "command": "npx",
      "args": [
        "-y",
        "@neondatabase/mcp-server-neon",
        "start",
        "your-actual-api-key-here"
      ],
      "env": {}
    }
  }
}
```

## 功能说明

安装后，您可以使用以下功能：

### 项目管理
- 列出和管理 Neon 项目
- 创建和删除项目
- 查看项目详情

### 分支管理
- 创建和删除分支
- 查看分支详情
- 比较数据库架构差异
- 重置分支

### SQL 查询
- 执行 SQL 查询
- 执行事务
- 查看数据库表结构
- 获取连接字符串

### 数据库迁移
- 安全地准备和完成数据库迁移
- 在临时分支中测试迁移

### 性能优化
- 查找慢查询
- 分析查询执行计划
- 优化查询性能

## 使用示例

配置完成后，重启 Cursor，然后您可以在对话中使用自然语言与 Neon 数据库交互，例如：

- "列出我的所有 Neon 项目"
- "在项目 X 中创建一个新分支"
- "执行 SQL 查询：SELECT * FROM users"
- "准备一个数据库迁移，添加新表"

## 参考文档

- [Neon MCP Server GitHub](https://github.com/neondatabase/mcp-server-neon)
- [Neon 官方文档](https://neon.tech/docs)

## 注意事项

- API Key 具有访问您 Neon 账户的权限，请妥善保管
- 如果使用环境变量方式，确保 Cursor 能够读取到该环境变量
- 配置更改后需要重启 Cursor 才能生效

