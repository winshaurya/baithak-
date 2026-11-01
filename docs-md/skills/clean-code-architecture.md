# Clean Code & Anti-Overengineering Skill

Source: Imported from [PatrickJS/awesome-cursorrules](https://github.com/PatrickJS/awesome-cursorrules/blob/main/rules/clean-code.mdc) and [anti-overengineering.mdc](https://github.com/PatrickJS/awesome-cursorrules/blob/main/rules/anti-overengineering.mdc).

## Core Principles

### 1. Constants Over Magic Numbers
- Replace hardcoded literals with named constants (`MAX_BYTES = 25 * 1024 * 1024`, `MAX_GROQ_TIMEOUT_MS = 5000`).
- Place constants at the top of the file or in a centralized configuration module.

### 2. Meaningful and Intent-Revealing Names
- Variables, functions, and types must reveal their exact purpose without requiring comments.
- Avoid cryptic abbreviations. Prefer `transcriptionResult` over `trRes`.

### 3. Smart Comments
- Never comment on *what* readable code does: write self-documenting code.
- Use comments exclusively to document *why* a design choice exists (e.g. Vercel Hobby 10s execution budget, RFC 2361 MIME normalization).

### 4. Single Responsibility
- Each module and function should have one reason to change.
- `ai.ts` is the single module that communicates with external AI APIs.
- `db.ts` is the single module that handles persistence and atomicity.
- `api.ts` is the client-side transport layer.

### 5. DRY Without Premature Abstraction
- Share common logic through proper helper functions (`withKeyFailover`, `withTimeout`).
- Do not build multi-layered class hierarchies or generic enterprise wrappers for straightforward workflows.
- Solve the concrete problem cleanly first before generalizing.

### 6. Atomic Persistence & Safe I/O
- File writes must use write-to-temp and atomic rename (`fs.rename`) to prevent torn or corrupted state during process interruption.
- Implement serverless fallback to ephemeral memory when operating on read-only cloud filesystems (`EROFS`).
