# myrule.md - Lessons Learned & Project Context

## Project Overview
- **Stack**: React, Vite, TypeScript, Express (Backend).
- **Style**: "UI/UX Pro Max" - Tailwind-like styles but using vanilla CSS/inline styles (mostly inline based on existing code).
- **Key Patterns**:
    -   Use `fetch` for API calls.
    -   Use `lucide-react` for icons.
    -   Do not use emoji icons.
    -   Use `toast` or `alert` for feedback (upgrade to toast if possible, currently alert is used).
    -   **[Modals]**: Use inline-styled generic `Modal` components for simplicity in this codebase.

## Lessons Learned
-   **[API]**: The backend `/api/trips/:id/tracking` endpoint requires looking up Waybill IDs manually if passed.
-   **[React]**: Always use `key` props in lists to avoid warnings.
-   **[Google Maps]**: API Key must be in `.env`.
-   **[UI]**: Sidebar "Tracking Loop" text in code vs "Active Fleet List" in UI caused test failures. Ensure text matches.
-   **[Modals]**: Keep modals generic.
-   **[Testing]**: When testing modals with Playwright, use `has-text` for titles and wait for visibility to handle animations/transitions.
-   **[Process/Root Cause]**: **Horizontal Scanning**: When fixing a UI pattern (e.g., Input Width) in one condition (e.g., Drivers Tab), **IMMEDIATELY CHECK** all other conditions (Vehicles, Expenses) for the same pattern. Do not wait for the user to report it.
-   **[Dependencies]**: **Check Package Versions**: `LRUCache is not a constructor` error was caused by assuming named import (`import { LRUCache }`) which is for v7+, while `package.json` had v5.1.1 (default export). **Always check `package.json` version** before importing libraries.
-   **[React]**: **Rules of Hooks**: `Rendered more hooks than during the previous render` is strictly forbidden. **NEVER** place hooks (`useState`, `useEffect`, `useNavigate`, etc.) after conditional returns (`if (error) return ...`). All hooks must be at the top level of the component.
-   **[Analysis]**: **Functionality vs Implementation**: When analyzing previous versions (e.g. `legacy_ref`), **ONLY study the functionality** (what it does, features, business logic). **DO NOT** study or copy the implementation details (how it was written). Focus on requirements.
