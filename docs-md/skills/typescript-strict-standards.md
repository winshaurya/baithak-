# TypeScript Strict Standards & Zod Validation Skill

Source: Imported from [PatrickJS/awesome-cursorrules](https://github.com/PatrickJS/awesome-cursorrules/blob/main/rules/typescript-zod-tailwind-nextjs-cursorrules-prompt-.mdc) and TypeScript LLM Tech Stack Guidelines.

## Philosophy & Typing Discipline
- **Strict Typing:** All TypeScript code operates under `strict: true` in `tsconfig.json`.
- **Zero Any:** Prohibit `any` across the entire codebase. Use `unknown` with runtime type narrowing, type guards, or Zod schemas.
- **Single Source of Truth:** Prefer Zod schema inference (`z.infer<typeof schema>`) over duplicate manual interface declarations to eliminate drift between runtime validation and compile-time types.
- **No Enums:** Use `as const` arrays and derived union types (e.g. `export const PRIORITIES = ["High", "Medium", "Low"] as const; export type Priority = (typeof PRIORITIES)[number];`).

---

## Code Quality Standards
1. **Functional and Declarative:** Prefer pure functions and immutable data transformations over class-based state manipulation.
2. **Early Returns & Guard Clauses:** Handle edge cases, null checks, and invalid inputs at the top of the function.
3. **Descriptive Auxiliary Naming:**
   - Booleans: `isLoading`, `hasError`, `isSupported`, `hasValidKey`.
   - Handlers: `handleFileSelect`, `handleStateChange`.
4. **Structured Error Handling:**
   - Expected validation failures must return typed results or mapped HTTP status codes (400, 415, 422).
   - Never swallow exceptions with empty catch blocks without logging or recovery logic.

---

## Zod Schema Validation Pipeline
- Hand all external data (multipart audio metadata, API query params, JSON request bodies, and LLM structured outputs) to Zod schemas before processing.
- Hand Zod schemas directly to AI SDK functions (`generateObject({ schema: analysisSchema })`) so models are mathematically constrained to valid JSON shapes without regex or free-text parsing.
