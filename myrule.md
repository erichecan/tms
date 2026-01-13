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
