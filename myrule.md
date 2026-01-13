---
description: TMS 项目配置经验和调试规则
---
# UI Design & Terminology Rules

## Modal & Popups
1.  **Size**: Ensure modals have sufficient width (`min-width: 600px` or `max-width: 800px+`) to prevent horizontal scrolling or cramped fields.
2.  **Terminology**: Use simple, direct action verbs.
    - **"Initialize"**: Avoid using this technical term. Use **"Add"**, **"Create"**, **"New"**, or **"Register"** instead.
    - **"Customer"**: Use "Customer" as the standard term. Avoid "Partner" (too ambiguous) or "Client" (not specific enough). Use "Customer" for both B2B and individual entities in the UI.
3.  **Layout**: If a form has many fields (e.g., > 6), use a grid layout (2 or 3 columns) instead of a single long column.

## Coding Standards
1.  **Modals**: Use the shared `Modal` component but override width styles if necessary for complex forms.
2.  **Clean Code**: Avoid hardcoding complex English strings; check for existing translations or simple alternatives.

# TMS 2.0 Development Rules

## UI & Design Consistency
- **Design System**: Strictly adhere to the modern SaaS glassmorphism style defined in `index.css`.
- **CSS Variables**: ALWAYS use CSS variables (e.g., `var(--slate-900)`, `var(--primary-grad)`, `var(--glass-bg)`) instead of hardcoded hex codes.
- **Glassmorphism**: Use `.glass` for large containers and `.glass-card` for content sections.
- **Typography**: Headers should use `fontWeight: 800` and `color: var(--slate-900)`. Labels should be uppercase `var(--slate-400)` with `fontSize: 11px`.
- **Buttons**: Use global classes `.btn-primary` and `.btn-secondary`. Avoid ad-hoc inline background colors for buttons.
- **Tables**: Use `border-collapse: separate` with `border-spacing: 0` and `.table-row-hover` for consistent list styling.
- **Alignment**: Use standard grids (`24px` gap) and flexbox alignment to ensure all form fields and toolbars are visually synchronized.

## 经验教训 (Lessons Learned)
-   **[API]**: 后端 `/api/trips/:id/tracking` 接口如果传入 Waybill ID，需要手动查找对应的 Trip ID.
-   **[React]**: 列表渲染必须始终使用 `key` 属性，以避免警告.
-   **[Google Maps]**: API Key 必须放在 `.env` 文件中.
-   **[UI]**: 侧边栏 "Tracking Loop" 在代码中的文本与 UI 显示 of "Active Fleet List" 不一致导致测试失败. 必须确保文本一致.
-   **[Modals]**: 保持模态框通用.
-   **[Testing]**: 使用 Playwright 测试模态框时，使用 `has-text` 匹配标题，并等待可见性以处理动画/过渡.
-   **[流程/根因]**: **水平扫描 (Horizontal Scanning)**: 当在一个条件（例如：司机标签页）中修复 UI 模式（例如：输入框宽度）时，**立即检查**所有其他条件（车辆、费用）是否存在相同模式. 不要等待用户报告.
-   **[依赖]**: **检查包版本**: `LRUCache is not a constructor` 错误是由于假定命名导入 (`import { LRUCache }`) 适用于 v7+，而 `package.json` 中实际上是 v5.1.1 (默认导入). **在导入库之前，务必检查 `package.json` 版本**.
-   **[React]**: **Hooks 规则**: 严禁 `Rendered more hooks than during the previous render` 错误. **千万不要**把 hooks (`useState`, `useEffect`, `useNavigate` 等) placed after conditional returns.
-   **[后端]**: **导入路径**: 在 TypeScript 项目中，除非有特殊 ESM 配置，否则在导入本地 `.ts` 文件时**严禁使用 `.js` 后端扩展名** (例如使用 `./types` 而不是 `./types.js`)，否则会导致 `MODULE_NOT_FOUND` 崩溃.
-   **[后端]**: **变更验证**: 每次修改后端代码（尤其是 `main.ts` 或路由）后，**必须手动验证**后端服务器由于 `nodemon` 重启后依然存活（使用 `curl` 或检查日志），防止因为一个小错误导致整个应用 API 挂掉，从而产生 `ERR_CONNECTION_REFUSED` 报错.
-   **[分析]**: **功能 vs 实现**: 分析旧版本（如 `legacy_ref`）时，**只研究功能**（它做什么，特性，业务逻辑）. **不要**研究或复制实现细节（它是怎么写的）. 专注于需求.
-   **[UI/UX]**: **控件布局与宽度**: 在模态框或表单中，不要让所有输入框都占满 100% 宽度 (Full Width)，不仅难看而且浪费空间. 对于简短字段（如姓名、电话、状态），应使用 Grid 布局或多列布局 (2列或3列) 来优化视觉密度.
-   **[API/部署]**: **禁止硬编码 API 地址**: 严禁在代码中直接写 `http://localhost:3001`. 必须统一引用 `src/apiConfig.ts` 中的 `API_BASE_URL`. 它会自动根据环境选择 API 地址。
-   **[数据库]**: **同步更新**: 每当前端增加新字段（如 `waybill` 的 `item_count`），**必须同步修改** `apps/backend/src/migrate.ts` 并增加 `ALTER TABLE` 语句确保老环境也能直接运行迁移。
-   **[V2 部署]**: **平行部署流程**: 运行 `./deploy-v2.sh` 进行平行部署. 该脚本会自动化创建 `tms-v2-backend` 和 `tms-v2-frontend` 服务，确保不影响生产环境。
-   **[后端/CORS]**: **双端口与地址冲突**: 如果前端报错 `blocked by CORS` 或 `Failed to fetch` 指向 `localhost:8000` 而后端运行在 `3001`，通常是 `API_BASE_URL` 配置不一致。注意：**8000 端口常被系统/编辑器插件代理占用**，项目应优先统一使用 **3001** 端口。在 `apiConfig.ts` 和 `main.ts` 中必须保持一致。
-   **[前端/路由]**: **侧边栏与路由同步**: 每次在 `Layout.tsx` 侧边栏增加新功能链接（如 `/pricing`）后，**必须同步**在 `App.tsx` 的 `createBrowserRouter` 中注册对应的路由和组件。否则会导致 404 Error (Unexpected Application Error)。
-   **[API/配置]**: **环境变量缺失**: 如果系统报错 `Google Maps API Key is required`，说明 `.env` 文件缺失或配置错误。**前端**需在 `apps/frontend/.env` 设置 `VITE_GOOGLE_MAPS_API_KEY`；**后端**需在 `apps/backend/.env` 设置 `GOOGLE_MAPS_API_KEY`。务必区分前端专用 Key（常带前端限流/授权）与后端 Key。
-   **[React/UI]**: **数值输入框清除逻辑**: 在 React 中处理数字输入框 (`type="number"`) 时，避免在 `onChange` 中使用 `parseInt(val) || 0`，这会导致用户无法删除最后的 0 或清空输入。**正确做法**: 状态应允许 `number | string`，允许 `""` (空字符串) 存在，在提交 API 前再统一转换回数字。
-   **[规则引擎]**: **规则动态同步**: 后端规则引擎 (`json-rules-engine`) 如果以单例模式运行，在数据库规则发生变更后（如迁移、手动增删）**必须重新加载**规则到内存中。可以在计算前增加 `await loadRulesFromDb()` 调用，或实现监听/过期机制，否则会导致计算仍使用旧规则，产生数据不一致。
-   **[后端/数据库]**: **JSONB 数据持久化安全**: 在执行 `UPDATE` 操作时，如果涉及 `jsonb` 字段（如 `details`），务必在 SQL 中使用 `details = COALESCE($15, details)`。这可以防止在前端进行 partial update（如仅修改状态或签名）而未传递完整 JSON 时，导致原有复杂的详情数据被 null 覆盖。
-   **[前端/兼容性]**: **旧数据兜底解析**: 随着系统升级，核心数据可能从“平铺字段”迁移到“JSONB 详情字段”。在加载数据时应实现**智能回退机制**：如果 JSONB 为空，尝试通过正则 (Regex) 从 `cargo_desc` 等文本记录中提取关键信息（如 `ShipFrom`, `ShipTo` 公司），确保历史运单在 View 模式下依然完整可见。
