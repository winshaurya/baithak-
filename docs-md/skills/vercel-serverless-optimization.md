# Vercel Serverless Optimization Skill

Source: Imported from [PatrickJS/awesome-cursorrules](https://github.com/PatrickJS/awesome-cursorrules/blob/main/rules/vercel-deployment-cursorrules-prompt-file.mdc) and [web-app-optimization-cursorrules-prompt-file.mdc](https://github.com/PatrickJS/awesome-cursorrules/blob/main/rules/web-app-optimization-cursorrules-prompt-file.mdc).

## Purpose & Scope
This skill details serverless operational constraints, execution duration budgets, Turbopack bundling, and edge deployment practices.

---

## 1. Execution Budgets & Timeout Constraints
- **Vercel Hobby Tier:** Serverless functions enforce a strict hard limit of 10 to 15 seconds execution duration.
- **Circuit Breakers for External APIs:** Any outbound network call (e.g. Groq Whisper, Gemini API) must be capped with an explicit timeout (`AbortSignal.timeout(5000)`). If a third-party service hangs or retries, abort the call before reaching the serverless ceiling.
- **Failover Budgets:** Multi-provider failovers must calculate aggregate latency. If Provider A is budgeted 5 seconds, Provider B must be able to complete within the remaining 5 to 7 seconds.

---

## 2. Serverless Filesystem Boundaries
- **Ephemeral and Read-Only Filesystems:** Serverless container root filesystems (`/var/task`) are read-only except for `/tmp`.
- **In-Memory Graceful Degradation:** When a persistent file write fails with `EROFS` or `EACCES`, the database layer must seamlessly fall back to an in-memory store so the serverless invocation succeeds without 500 errors.

---

## 3. Turbopack Build Optimization
- **Prevent Directory Tracing:** Dynamic `fs.readFile(dataFile())` calls cause Turbopack to trace and bundle the entire project directory into serverless lambda artifacts.
- Annotate dynamic filesystem reads with `/*turbopackIgnore: true*/` to ensure lightweight lambdas and ultra-fast deployment builds.
