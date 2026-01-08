# TMS Project Development Rules

This document outlines critical development standards and lessons learned. **ALL developers and agents must read this before starting development tasks.**

## 1. API Integration & Error Handling (CRITICAL)

### The "jobs.map is not a function" Incident
**Context**: On 2026-01-08, the Dashboard crashed with `TypeError: jobs.map is not a function`.
**Cause**: The Frontend code blindly assumed the backend API always returns an array. When the API failed or returned an error object, the application tried to map over a non-array value.
**Fix**: Implemented strict response validation and error fallbacks.

### Rules for Future Development
1.  **Never Trust the Backend**: Frontend MUST validate that the API response matches the expected type before using it.
    *   *Bad*: `fetch(...).then(res => res.json()).then(setData)`
    *   *Good*: `fetch(...).then(res => { if (!res.ok) throw ...; return res.json(); }).then(data => { if (isActive(data)) setData(data); else setData([]); })`
2.  **Defensive State Initialization**: Always initialize array states with `[]` and ensure they reset to `[]` on error, never `null` or `undefined` if the component expects an array.
3.  **Graceful Degradation**: If a widget fails to load data (e.g., Metrics or Jobs list), catch the error and display a placeholder or empty state. **Do not crash the entire page.**
4.  **Type Safety is Not Runtime Safety**: TypeScript types checking the build does NOT guarantee the runtime API response is valid. Runtime checks (like `Array.isArray()`) are mandatory for collection data.

## 2. General Coding Standards
- **Theme**: Use CSS Variables (`var(--color-primary)`) for all colors. Do not hardcode hex values.
- **Strict Mode**: React Strict Mode is enabled. Ensure effects are idempotent.
- **Mock Data**: When mocking data, ensure the mock structure perfectly matches the interface definitions in `types.ts`.

---
*Last Updated: 2026-01-08*
