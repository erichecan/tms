# MCP (Model Context Protocol) 配置指南
> 更新时间：2025-11-24T17:00:00Z（由 Assistant 创建）

本文档说明如何在 Cursor 中配置和使用 MCP 服务器。

---

## 📦 已安装的 MCP 服务器

### Chrome DevTools MCP

**功能**: 通过 MCP 协议访问 Chrome DevTools，可以：
- 自动化浏览器测试
- 截取网页截图
- 执行 JavaScript
- 监控网络请求
- 分析性能指标

**配置位置**: `.cursor/config.json`

**配置内容**:
```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": [
        "chrome-devtools-mcp@latest",
        "--headless",
        "--logFile",
        "/tmp/chrome-devtools.log"
      ]
    }
  }
}
```

**参数说明**:
- `--headless`: 无头模式运行（不显示浏览器窗口）
- `--logFile`: 日志文件路径，用于调试

---

## 🚀 使用方法

### 1. 验证安装

在 Cursor 中，MCP 服务器会自动启动。你可以通过以下方式验证：

1. 打开 Cursor 设置
2. 查看 MCP 服务器状态
3. 检查是否有错误日志

### 2. 使用 Chrome DevTools MCP

在 Cursor 中，你可以直接要求 AI 助手：
- "使用 Chrome DevTools 打开 https://example.com 并截图"
- "分析这个网页的性能指标"
- "监控这个 API 的网络请求"

---

## 🔧 配置选项

### Chrome DevTools MCP 高级选项

如果需要连接到已运行的 Chrome 实例：

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": [
        "chrome-devtools-mcp@latest",
        "--browserUrl",
        "http://localhost:9222"
      ]
    }
  }
}
```

或者使用 WebSocket 端点：

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": [
        "chrome-devtools-mcp@latest",
        "--wsEndpoint",
        "ws://127.0.0.1:9222/devtools/browser/<id>"
      ]
    }
  }
}
```

### 其他可用参数

- `--executablePath`: 自定义 Chrome 可执行文件路径
- `--channel`: 指定 Chrome 渠道（stable, canary, beta, dev）
- `--viewport`: 设置视口大小（如 `1280x720`）
- `--proxyServer`: 代理服务器配置
- `--categoryEmulation`: 启用/禁用模拟工具（默认: true）
- `--categoryPerformance`: 启用/禁用性能工具（默认: true）
- `--categoryNetwork`: 启用/禁用网络工具（默认: true）

---

## 🐛 故障排除

### 问题 1: MCP 服务器无法启动

**解决方案**:
1. 检查 Node.js 版本（需要 22.12.0+）
2. 检查网络连接（需要下载 npm 包）
3. 查看日志文件: `/tmp/chrome-devtools.log`

### 问题 2: Chrome 无法启动

**解决方案**:
1. 确保已安装 Chrome 浏览器
2. 检查 `--executablePath` 是否正确
3. 尝试使用 `--channel stable` 指定稳定版

### 问题 3: 连接超时

**解决方案**:
1. 检查防火墙设置
2. 确保端口未被占用
3. 尝试使用 `--browserUrl` 连接到已运行的实例

---

## 📚 相关资源

- [Chrome DevTools MCP 官方文档](https://github.com/modelcontextprotocol/servers/tree/main/src/chrome-devtools-mcp)
- [MCP 协议规范](https://modelcontextprotocol.io/)
- [Cursor MCP 配置文档](https://docs.cursor.com/mcp)

---

## 🔄 更新 MCP 服务器

要更新到最新版本，只需重启 Cursor，MCP 服务器会自动使用 `@latest` 标签下载最新版本。

或者手动更新：

```bash
npx chrome-devtools-mcp@latest --version
```

---

**最后更新**: 2025-11-24T17:00:00Z  
**维护者**: TMS 开发团队

