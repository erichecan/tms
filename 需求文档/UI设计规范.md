# TMS UI 设计规范

> [!IMPORTANT]
> 本文档作为 TMS 应用程序 UI/UX 设计的唯一真实来源（SSOT）。

## 1. 设计 Tokens (Design Tokens)

### 间距系统 (Spacing System)
我们要使用基于 4px 的标准化比例。
- **xs**: 4px
- **sm**: 8px
- **md**: 12px
- **lg**: 16px
- **xl**: 24px
- **2xl**: 32px

### 栅格与布局 (Grid & Layout)
- **栅格**: 12 列栅格系统。
- **抽屉/弹窗宽度**:
    - 小 (Small): 480px
    - 中 (Medium): 720px
    - 大 (Large): 960px 或 1200px
- **槽宽 (Gutter)**: 16px 或 24px，视上下文而定。

### 颜色 (Colors)
- **主色 (Primary)**: `#1677ff` (Ant Design 蓝或类似色)
- **错误色 (Error)**: `#ff4d4f`
- **文本 (Text)**:
    - 主要文本: `#000000d9` (85% 黑)
    - 次要文本: `#00000073` (45% 黑)
    - 占位符: `#00000040` (25% 黑)
- **边框 (Border)**: `#d9d9d9`
- **背景 (Background)**: `#ffffff` (卡片/弹窗), `#f5f5f5` (应用背景)

### 排版 (Typography)
- **字体族**: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial`.
- **字号**:
    - 标题 (Header): 16px / 500 字重
    - 标签 (Label): 14px / 400 字重 (颜色: 次要文本)
    - 输入文本 (Input Text): 14px / 400 字重 (颜色: 主要文本)
    - 辅助/错误 (Helper/Error): 12px

## 2. 组件规范 (Component Specifications)

### 弹窗 / 模态框 (Dialog / Modal)
- **标题栏高度**: 55px (带底部边框)。
- **底部/操作栏高度**: 50-60px (按钮右对齐)。
- **主体内边距**: 24px。

### 表单分节 (Form Sections)
- **标题**: 16px, 粗细 500, 左侧带竖向强调条 (蓝色)。
- **间距**:
    - **上边距**: 25px (与上一块内容的间距)。
    - **下边距**: 20px (标题与第一个字段的间距)。

### 表单字段 (Form Fields)
- **垂直布局**: 标签在输入框上方。
- **间距**:
    - 标签到输入框: 8px.
    - 输入框到下一行: 24px (最小 16px).
    - 列间距 (Gutter): 24px.
- **必填标识**: 红色 `*` 在标签之前 (根据截图一致性)。
- **输入框**:
    - 高度: 32px (紧凑) 或 40px (标准)。*根据截图密度建议默认 32px。*
    - 圆角: 4px 或 6px。
    - 内边距: 4px 11px。

## 3. 参考设计

![UI Spec Screenshot](file:///Users/apony-it/.gemini/antigravity/brain/f98ecfa2-5efc-47ab-9a73-c8b07563f695/uploaded_image_1767797785926.png)

## 4. 实施指南
- **CSS 变量**: 上述所有值应在 `src/styles/design-tokens.css` 中实现为 CSS 变量。
- **组件**: 使用 `FormSection`, `FormField` 包装器以确保一致性。请勿在页面中手动编写 Input 样式。
