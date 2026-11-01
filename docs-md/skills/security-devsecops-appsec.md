# Security, DevSecOps & AppSec Skill

Source: Imported from [PatrickJS/awesome-cursorrules](https://github.com/PatrickJS/awesome-cursorrules/blob/main/rules/security-devsecops-ssdls-appsec.mdc).

## Purpose & Scope
This skill outlines security, API key management, sanitization, and defense-in-depth principles for Baithak.

---

## 1. Secret Hygiene & Zero-Leakage Policy
- **No Hardcoded Secrets:** Never hardcode API keys, service accounts, or tokens in source code, commit history, or test fixtures.
- **Environment Isolation:** Use `.env` for local testing, `.env.example` with dummy values for repo documentation, and secure dashboard vaults on production hosting providers (Vercel).
- **Client Sanitization:** API keys provided by users (Bring Your Own Key: BYOK) must reside strictly in client memory or `localStorage`. They are transmitted only over encrypted HTTPS via custom headers (`x-groq-key`, `x-google-key`) and must never be stored on the server.

---

## 2. Input Validation & DoS Mitigation
- **Strict Size Limits:** Cap audio payload uploads at 25 MB (`MAX_BYTES`) to protect serverless instances against memory exhaustion.
- **MIME & Extension Whitelisting:** Enforce multi-layer validation (MIME sniffing, standard audio header verification, and file extension checks) to reject executable uploads before buffer parsing.
- **JSON Injection Defense:** All LLM outputs are parsed through Zod schema validation (`generateObject`), completely removing raw `eval()` or unconstrained JSON parsing vulnerabilities.

---

## 3. Defense-in-Depth HTTP Headers
Production deployments must enforce security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
