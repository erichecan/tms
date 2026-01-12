---
name: compounding-engineer
description: "A high-level engineering workflow that ensures continuous improvement ('Compounding Engineering'), rigorous architectural planning, and strict adherence to product requirements and UI/UX standards. Use this when the user wants to 'develop a feature', 'fix a bug', or 'act like a senior engineer', ensuring lessons are learned and not repeated."
---

# Compounding Engineer Workflow

This skill enforces a disciplined engineering process inspired by the "Claude Code" team's internal workflow. It focuses on:
1.  **Compounding Knowledge**: Using a `myrule.md` file to store and retrieve lessons learned.
2.  **Rigorous Planning**: Validating requirements and architecture *before* coding.
3.  **Standardized Execution**: Adhering to strict UI/UX and framework guidelines.
4.  **Continuous Verification**: Testing every change.

---

## 1. Context & Compounding Knowledge (The "Compounding" Check)

Before writing any code or plans, you **MUST** load context and check for past lessons.

### Action: Read `myrule.md`
-   Check if `myrule.md` exists in the root or `.gemini/` directory.
-   **If it exists**: Read it. **DO NOT DELETE** existing content. You will append new lessons to this file.
-   **If it does not exist**: Create it. Initialize it with a header: `# myrule.md - Lessons Learned & Project Context`.

### Action: Read Requirements
-   Locate requirement documents (e.g., `requirements.md`, `PRD.md`) or analyze the user's prompt deeply.
-   Ensure you understand the **Product Goal** and **User Intent**.

### Action: Architecture Check
-   Review existing codebase architecture.
-   Identify dependencies. Goal: **Minimize coupling**.
-   Ask: "Does this change fit the existing pattern? or does it introduce technical debt?"

---

## 2. Strategic Planning ("Plan Mode")

Do not rush into coding. Produce a solid plan first.

### Step 1: Draft Plan
Create a step-by-step implementation plan.
-   **Files to Create/Edit**: List them.
-   **Dependencies**: List external libs or internal modules.

### Step 2: Validation
-   **Requirement Check**: Does this plan satisfy ALL user requirements?
-   **Coupling Check**: Are there circular dependencies?
-   **Lesson Check**: Does this plan violate any rule in `myrule.md`?

### Step 3: User Review
-   Present the plan to the user.
-   Only proceed to Execution after approval (unless the task is trivial).

---

## 3. Execution & Standards ("Auto-Accept Mode")

When writing code, you act as a Senior Developer.

### strict Standards:
1.  **Framework Compliance**: Use the project's existing framework (e.g., React/Next.js). Do not invent new patterns if old ones exist.
2.  **UI/UX Pro Max**:
    -   No emojis as icons. Use Lucide/Heroicons.
    -   Proper spacing (Tailwind `p-4`, `gap-4`).
    -   Interactive states (`hover:bg-gray-100`, `cursor-pointer`).
    -   Check for mobile responsiveness.
3.  **Code Simplicity**:
    -   Keep functions small.
    -   Type everything (TypeScript).
    -   Avoid "magic numbers".

### Hook: Pre-Commit Formatting
-   Ensure code is formatted (Prettier/ESLint) before "committing" (completing the task).

---

## 4. Verification & Feedback

You must verify your work. "It looks correct" is not enough.

### Action: Verification
-   **Automated Tests**: Run `npm test` or equivalent.
-   **Browser Check**: If UI, open the browser and verify rendering.
-   **Console Check**: Check for errors/warnings in the terminal.

### Action: Reflection (The "Compounding" Loop)
After finishing the task (success or failure):
1.  **Did you encounter an error?**
2.  **Was it caused by a guess or a known issue?**
3.  **Update `myrule.md`**:
    -   If you learned something new (e.g., "The API returns 404 for waybills starting with 'WB-'"), **ADD IT TO `myrule.md`**.
    -   Format: `- [Category] Lesson learned... (e.g., do not use X, use Y)`.

---

## Summary of Commands
-   `openskills read compounding-engineer`: Read this guide.
-   `read_file myrule.md`: Get lessons.
-   `write_to_file myrule.md`: Save new lessons.
