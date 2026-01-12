# myrule.md - 经验教训与项目背景

## 项目概览
- **技术栈**: React, Vite, TypeScript, Express (Backend).
- **风格**: "UI/UX Pro Max" - 类似 Tailwind 的风格，但主要使用原生 CSS/内联样式（因为由于现有代码库的限制）.
- **关键模式**:
    -   API 调用使用 `fetch`.
    -   图标使用 `lucide-react`.
    -   **禁止**使用 Emoji 作为图标.
    -   反馈使用 `toast` 或 `alert` (尽量升级为 toast, 目前暂时使用 alert).
    -   **[模态框]**: 使用内联样式的通用 `Modal` 组件，保持简单.

## 经验教训 (Lessons Learned)
-   **[API]**: 后端 `/api/trips/:id/tracking` 接口如果传入 Waybill ID，需要手动查找对应的 Trip ID.
-   **[React]**: 列表渲染必须始终使用 `key` 属性，以避免警告.
-   **[Google Maps]**: API Key 必须放在 `.env` 文件中.
-   **[UI]**: 侧边栏 "Tracking Loop" 在代码中的文本与 UI 显示的 "Active Fleet List" 不一致导致测试失败. 必须确保文本一致.
-   **[Modals]**: 保持模态框通用.
-   **[Testing]**: 使用 Playwright 测试模态框时，使用 `has-text` 匹配标题，并等待可见性以处理动画/过渡.
-   **[流程/根因]**: **水平扫描 (Horizontal Scanning)**: 当在一个条件（例如：司机标签页）中修复 UI 模式（例如：输入框宽度）时，**立即检查**所有其他条件（车辆、费用）是否存在相同模式. 不要等待用户报告.
-   **[依赖]**: **检查包版本**: `LRUCache is not a constructor` 错误是由于假定命名导入 (`import { LRUCache }`) 适用于 v7+，而 `package.json` 中实际上是 v5.1.1 (默认导入). **在导入库之前，务必检查 `package.json` 版本**.
-   **[React]**: **Hooks 规则**: 严禁 `Rendered more hooks than during the previous render` 错误. **千万不要**把 hooks (`useState`, `useEffect`, `useNavigate` 等) placed after conditional returns.
-   **[后端]**: **导入路径**: 在 TypeScript 项目中，除非有特殊 ESM 配置，否则在导入本地 `.ts` 文件时**严禁使用 `.js` 后端扩展名** (例如使用 `./types` 而不是 `./types.js`)，否则会导致 `MODULE_NOT_FOUND` 崩溃.
-   **[后端]**: **变更验证**: 每次修改后端代码（尤其是 `main.ts` 或路由）后，**必须手动验证**后端服务器由于 `nodemon` 重启后依然存活（使用 `curl` 或检查日志），防止因为一个小错误导致整个应用 API 挂掉，从而产生 `ERR_CONNECTION_REFUSED` 报错.
-   **[分析]**: **功能 vs 实现**: 分析旧版本（如 `legacy_ref`）时，**只研究功能**（它做什么，特性，业务逻辑）. **不要**研究或复制实现细节（它是怎么写的）. 专注于需求.
-   **[UI/UX]**: **控件布局与宽度**: 在模态框或表单中，不要让所有输入框都占满 100% 宽度 (Full Width)，不仅难看而且浪费空间. 对于简短字段（如姓名、电话、状态），应使用 Grid 布局或多列布局 (2列或3列) 来优化视觉密度.
