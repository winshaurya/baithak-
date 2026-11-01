# Baithak System Architecture

This document specifies the technical architecture, component boundaries, and invariants of Baithak (बैठक), an intelligent full-stack AI Notetaker.

---

## 1. High-Level System Context (C4 Level 1)

```
┌─────────────────────────────────────────────────────────────┐
│                       Meeting User                          │
│  (Interacts via Chrome, Edge, Safari, Firefox)              │
└──────────────────────────────┬──────────────────────────────┘
                               │
                Audio Ingestion / UI Events
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     Baithak Application                     │
│  - Browser Client (Next.js 16 / React 19 / Web Audio API)   │
│  - Server Engine  (Next.js App Router API Routes)           │
│  - Storage Engine (Atomic JSON with in-process mutex)       │
└───────────────┬─────────────────────────────┬───────────────┘
                │                             │
       Transcription & LLM             Hosted Fallback
                ▼                             ▼
┌─────────────────────────────┐ ┌─────────────────────────────┐
│   Google Gemini 2.5 Flash   │ │     Groq Whisper Turbo      │
│  (Multimodal Audio + JSON)  │ │   (Cloud Hosted Whisper)    │
└─────────────────────────────┘ └─────────────────────────────┘
```

---

## 2. Container Architecture (C4 Level 2)

### A. Browser Client
- **Audio Capture Subsystem (`Recorder.tsx`)**: Captures 16kHz/48kHz PCM audio via `navigator.mediaDevices.getUserMedia` using `MediaRecorder`. Connects to Web Audio API (`AudioContext`, `AnalyserNode`) for 48-bar frequency visualization.
- **Background Timing Controller**: Uses wall-clock timestamp delta calculations (`Date.now()`) to ensure uninterrupted recording during browser tab switching and background execution.
- **Upload Subsystem (`AudioUpload.tsx`)**: Drag-and-drop ingestion with MIME verification and 25MB boundary checks for `.mp3`, `.wav`, `.m4a`, and `.webm`.
- **Dashboard (`Dashboard.tsx`)**: Tabbed/split view showing speaker-segmented transcripts, executive summaries, interactive action item checklist, and Markdown/JSON export facilities.
- **Key Store (`keys.ts`)**: Client-side `localStorage` isolation for user-supplied API keys (Bring Your Own Key).

### B. Server Engine (Next.js API Routes)
- **Transcription Gateway (`/api/transcribe`)**: Multiparts audio validation, byte streaming, and multi-provider ASR dispatch.
- **Analysis Engine (`/api/analyze`)**: Enforces Zod schemas against Google Gemini 2.5 Flash, returning typed executive summaries and action items.
- **Session API (`/api/sessions`)**: CRUD endpoints for session history and individual meeting retrieval.
- **Action Item API (`/api/actions`)**: In-place mutation endpoints for task completion, text updates, assignee reassignment, and deletions.

### C. Storage Layer (`lib/db.ts`)
- **Persistence Model**: Local document store (`data/sessions.json`) wrapped in an in-process Promise-chain mutex (`withLock`).
- **Atomic Write Semantics**: Tempfile write (`.tmp.uuid`) followed by atomic rename to prevent torn reads or write corruptions.

---

## 3. Component Boundaries & Information Flow

```
User Action (Stop Recording / Upload)
       │
       ▼
Audio Blob Verified (MIME + Size < 25MB)
       │
       ▼
POST /api/transcribe (Audio Bytes + Key Headers)
       │
       ├─► [Primary] Google Gemini 2.5 Flash (Audio File Part)
       │       └──> Verbatim Speaker-Diarized Transcript
       │
       └─► [Fallback] Groq Whisper Large v3 Turbo
               └──> Verbatim Transcript
       │
       ▼
Client receives transcript and calls POST /api/analyze
       │
       ▼
POST /api/analyze Handed to AI SDK generateObject
       │
       ▼
Zod Schema Enforcement (schema.ts: analysisSchema)
       │
       ▼
Structured Object: { summary: Topic[], actionItems: ActionItem[] }
       │
       ▼
Atomic Write to lib/db.ts (withLock Critical Section)
       │
       ▼
201 Created -> Rendered on Dashboard
```

---

## 4. Key Architectural Invariants

1. **Provider Isolation**: No UI component ever imports or calls AI SDKs or providers directly. All AI interactions go exclusively through `src/lib/ai.ts`.
2. **Deterministic Outputs**: All LLM generation uses strict Zod schema constraints. Free-text parsing (`JSON.parse`) is prohibited across the codebase.
3. **Client Privacy**: User-provided API keys stay in the browser `localStorage` and are sent only via request headers (`x-google-key`, `x-groq-key`). They are never persisted on the server.
4. **Zero-Drift Background Audio**: Timers calculate elapsed duration using absolute wall-clock deltas rather than interval ticks, preventing background tab clock skew.

