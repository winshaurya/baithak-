# Baithak Code Capability Index (CODE_INDEX.md)

This index catalogs all core utilities, components, schemas, and API handlers in the Baithak repository. Consult this index before creating new files or helper functions to prevent duplication.

---

## 1. AI & Speech Layer (`src/lib/`)

| Module | Exports | Purpose |
|---|---|---|
| `src/lib/ai.ts` | `transcribeAudio`, `analyzeTranscript` | Unified bridge to Google Gemini 2.5 Flash and Groq Whisper. Handles multi-provider failover. |
| `src/lib/prompts.ts` | `ANALYSIS_SYSTEM_PROMPT`, `buildAnalysisPrompt` | Strict prompt templates for executive summaries and action items. |
| `src/lib/schema.ts` | `analysisSchema`, `actionItemSchema`, `summaryTopicSchema`, `PRIORITIES` | Canonical Zod schemas and TypeScript types for structured outputs. |
| `src/lib/failover.ts` | `parseKeys`, `withKeyFailover` | Key parsing and sequential failover executor across multiple API keys. |
| `src/lib/http.ts` | `mapAiError` | Maps provider errors to HTTP status codes (`429`, `500`, `502`). |
| `src/lib/keys.ts` | `getKeys`, `setKeys`, `keyHeader` | Safe client `localStorage` manager for Bring-Your-Own-Key. |
| `src/lib/types.ts` | `SessionDTO`, `ActionItemDTO`, `CaptureState`, `SessionListItem` | Shared data transfer objects across client and server. |

---

## 2. Storage & Persistence (`src/lib/`)

| Module | Exports | Purpose |
|---|---|---|
| `src/lib/db.ts` | `createSession`, `listSessions`, `getSession`, `deleteSession`, `addActionItem`, `updateActionItem`, `deleteActionItem` | Concurrency-safe JSON file store (`data/sessions.json`) with promise mutex and atomic rename. |
| `src/lib/storage.ts` | `saveDraft`, `getDraft`, `listDrafts`, `deleteDraft`, `saveLocalSession`, `getLocalSession`, `listLocalSessions`, `deleteLocalSession`, `updateLocalActionItem` | Native browser IndexedDB engine (`baithak_db`) for zero-data-loss drafts and local session persistence. |
| `src/lib/format.ts` | `formatTime`, `formatDuration`, `getPriorityStyle`, `PRIORITY_STYLES` | Canonical DRY time and duration formatters and priority badge classes. |
| `src/lib/sample.ts` | `SAMPLE_TITLE`, `SAMPLE_TRANSCRIPT`, `SAMPLE_SUMMARY`, `SAMPLE_ACTION_ITEMS` | Pre-baked offline sample data for instant zero-key testing. |

---

## 3. Client API Layer (`src/lib/`)

| Function | Endpoint | Description |
|---|---|---|
| `transcribeAudio` | `POST /api/transcribe` | Submits audio blob with BYOK headers. |
| `analyzeTranscript` | `POST /api/analyze` | Generates summary and action items, creates session. |
| `listSessions` | `GET /api/sessions` | Retrieves session history list. |
| `getSession` | `GET /api/sessions/:id` | Loads single session with tasks. |
| `addAction` | `POST /api/sessions/:id/actions` | Appends a manual action item. |
| `updateAction` | `PATCH /api/actions/:id` | Toggles done state or edits task attributes. |
| `deleteAction` | `DELETE /api/actions/:id` | Removes an action item. |
| `deleteSession` | `DELETE /api/sessions/:id` | Removes a session from the store. |
| `loadSample` | `POST /api/sample` | Seeds and returns demo session. |

---

## 4. UI Components (`src/components/`)

| Component | Props | Purpose |
|---|---|---|
| `Recorder.tsx` | `onComplete`, `onStateChange`, `disabled` | MediaRecorder audio capture, live frequency visualizer, and accurate wall-clock timing. |
| `AudioPlayer.tsx` | `file`, `url`, `title`, `onProcess`, `onCancel` | Live 48-bar frequency visualizer and audio playback player for uploaded and sample files. |
| `AudioUpload.tsx` | `onSelect`, `disabled` | Drag-and-drop audio file uploader with extension and 25MB validation. |
| `Dashboard.tsx` | `session`, `initialAudioBlob`, `onDeleted` | Dual view layout (Transcript + Insights) & File System View mode, Markdown/JSON export, clipboard copy, delete session. |
| `FileSystemView.tsx` | `session`, `actionItems`, `audioBlob`, `onItemChange`, etc. | Interactive virtual file system workspace (`audio.webm`, `transcript.txt`, `summary.md`, `tasks.json`). |
| `DraftRecoveryBanner.tsx` | `onRetry` | Recovers uncompleted/failed recording drafts from IndexedDB for zero data loss and retries. |
| `SessionClientLoader.tsx` | `sessionId`, `initialSession` | Client fallback loader fetching from browser IndexedDB if session is missing on server. |
| `TranscriptPanel.tsx` | `transcript` | Dual mode transcript viewer (Color-coded speaker segments vs raw monospace). |
| `InsightsPanel.tsx` | `sessionId`, `summary`, `actionItems`, change handlers | Topic summary cards, task list, and add-task form. |
| `ActionItemRow.tsx` | `item`, `onChange`, `onDelete` | Interactive task row with done toggle, inline edit, and priority styling. |
| `StatusBadge.tsx` | `state` | Pill badge reflecting the active `CaptureState` with animation. |
| `ProcessingView.tsx` | `state` | Stepper progress indicator during uploading, transcribing, and analyzing. |
| `KeySettings.tsx` | `open`, `onClose` | Modal to manage client-side API keys in browser storage. |

---

## 5. Engineering Skills & Standards (`docs/skills/`)

| Skill File | Source | Key Focus |
|---|---|---|
| `docs/skills/ui-ux-design-system.md` | Toss Design System + Radix/Shadcn | Grayscale hierarchy, spacing tokens, cards, accessibility, mobile ergonomics. |
| `docs/skills/nextjs-app-router.md` | Next.js App Router Specs | Server vs Client leaf isolation, partial prerendering, route handlers. |
| `docs/skills/typescript-strict-standards.md` | TypeScript LLM Stack + Zod | Strict typing, zero `any`, Zod schema inference, no enums. |
| `docs/skills/system-design-distributed-resilience.md` | Distributed Systems Specs | Dual ASR failover, 5s circuit breakers, idempotent mutations. |
| `docs/skills/clean-code-architecture.md` | Clean Code + Anti-Overengineering | Constants over magic numbers, single responsibility, atomic I/O. |
| `docs/skills/testing-quality-assurance.md` | Vitest Standards | Mock isolation, schema validation guards, pre-commit gates. |
| `docs/skills/security-devsecops-appsec.md` | DevSecOps & AppSec | BYOK sanitization, 25MB limits, MIME whitelisting, HTTP headers. |
| `docs/skills/vercel-serverless-optimization.md` | Vercel Deployment Rules | 10s Hobby timeout budget, ephemeral memory fallback, Turbopack ignore. |
| `docs/skills/seo-web-performance.md` | Next.js SEO & Web Vitals | Dynamic sitemap, OpenGraph metadata, Core Web Vitals optimization. |
| `docs/skills/prompt-engineering-structured-llm.md` | Structured Output Guidelines | Schema-enforced generation, field-level intent, diarization prompts. |


