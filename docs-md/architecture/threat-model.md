# Security Architecture & Threat Model

## 1. Security Objectives

1. **Confidentiality**: Spoken conversations and sensitive transcripts must not be exposed to unauthorized parties or persisted without user intent.
2. **Integrity**: Action item updates and session mutations must remain atomic, preventing race conditions or corrupted snapshots.
3. **Key Protection**: Client-provided API keys must never be logged, cached on disk, or leaked across requests.

---

## 2. Threat Analysis (STRIDE Model)

| Threat Category | Identified Vector | Mitigation Strategy |
|---|---|---|
| **Spoofing** | Forged API requests with spoofed session IDs | Input validation, UUID strict formatting, 404 on missing entity. |
| **Tampering** | Concurrent writes corrupting `data/sessions.json` | In-process critical section lock (`withLock`) + atomic tempfile rename. |
| **Repudiation** | Untracked modifications to action items | Timestamped state changes, discrete PATCH endpoints. |
| **Information Disclosure** | API keys leaked to server logs or disk | Keys stored exclusively in client `localStorage`, passed via transit headers only. |
| **Denial of Service** | Oversized audio upload exhausting memory | Strict 25MB ceiling enforced on both client and Next.js route boundaries. |
| **Elevation of Privilege** | Malformed prompt injecting instructions to LLM | Structural JSON output enforcement using Zod and AI SDK `generateObject`. |

---

## 3. Data Governance & Privacy Invariants

- **Zero Server-Side Key Persistence**: The backend never writes `x-google-key` or `x-groq-key` headers to files, databases, or logging streams.
- **Microphone Hardware Access**: Microphones are only requested upon explicit user click (`start()`), and media tracks are explicitly stopped (`t.stop()`) when recording ends or unmounts.
- **Audio Disposal**: Uploaded audio buffers are processed in memory and released to garbage collection immediately following transcription.
