# System Design & Distributed Resilience Skill

Source: Derived from High-Availability Distributed Systems Engineering Standards and [PatrickJS/awesome-cursorrules](https://github.com/PatrickJS/awesome-cursorrules/tree/main/rules).

## Purpose & Scope
This skill governs multi-provider failover, circuit breaking, distributed timeout budgeting, and idempotent state transitions across Baithak.

---

## 1. Dual-Provider ASR Architecture
- **Primary Tier (Groq Whisper):** Ultra-fast transcription (~1 to 2 seconds) powered by `whisper-large-v3-turbo` when a verified `gsk_` key is present.
- **Secondary Tier (Google Gemini Multimodal):** Highly reliable direct audio transcription and speaker diarization (~6 to 7 seconds) powered by `gemini-2.5-flash`.
- **Failover Guarantee:** If Groq fails with an HTTP 4xx/5xx or exceeds the 5-second circuit breaker, execution automatically routes to Gemini without failing the user's request.

---

## 2. Distributed Resilience Patterns
1. **Circuit Breakers:** Guard all external HTTP requests with non-blocking timers (`withTimeout(promise, ms, msg)`). Prevent third-party downtime or infinite SDK retries from cascading into server timeouts.
2. **Key Rotation & Failover:** Support comma-separated API keys (`parseKeys(header)`). Sequentially try user keys upon rate limiting (429) or exhaustion before failing.
3. **Idempotent Mutations:** Action item toggles and updates must be idempotent. Updating task state multiple times produces the identical deterministic state.
4. **Offline Resilience:** Maintain a zero-dependency fixture path (`/api/sample`) allowing the system to run and be tested without external network access or credentials.
