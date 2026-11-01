# Vitest Testing & Quality Assurance Skill

Source: Imported from [PatrickJS/awesome-cursorrules](https://github.com/PatrickJS/awesome-cursorrules/blob/main/rules/vitest-unit-testing-cursorrules-prompt-file.mdc).

## Purpose & Scope
This skill defines unit, integration, and contract testing standards across the application using Vitest.

---

## 1. Testing Philosophy
- **Critical Functionality First:** Prioritize business logic, schema parsing, failover recovery, and HTTP status mappings.
- **Dependency Isolation:** Mock external third-party API SDKs (`@/lib/ai`, Groq, Google Generative AI) using `vi.mock()` before imports in route tests. Route tests verify validation contracts and status code mappings, not third-party uptime.
- **Deterministic Assertions:** Avoid flaky tests by using explicit mock return values and strict assertions.
- **Test Matrix:** Cover happy paths, invalid payloads (empty body, wrong MIME, oversized files), and rate limit / failure modes (400, 413, 415, 422, 429, 500).

---

## 2. Best Practices
1. **Dependency Mocking:** Always mock external modules before importing the system-under-test.
2. **Setup and Teardown:** Reset mocks in `beforeEach(() => { vi.clearAllMocks(); })` to guarantee test independence.
3. **Fixture Integrity:** Fixtures (such as `src/lib/sample.ts`) must be validated against production Zod schemas in test suites to prevent schema drift.
4. **Fast Execution:** Unit test runs must complete in under 2 seconds locally and on GitHub Actions CI.

---

## 3. Required Pre-Commit Gate
All code changes must pass the full verification matrix before being committed:
```bash
npm run lint
npm run typecheck
npm test
npm run build
```
