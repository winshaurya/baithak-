# Audio Ingestion & Processing Pipeline Specification

## 1. Pipeline Overview

The Baithak ingestion and intelligence pipeline converts raw spoken conversations into verifiable, structured business intelligence across four discrete stages:

```
[ Stage 1: Audio Capture ] ──► [ Stage 2: Ingestion & Validation ]
                                            │
                                            ▼
[ Stage 4: Structured Extraction ] ◄── [ Stage 3: Multi-Provider ASR ]
```

---

## 2. Stage 1: Audio Capture

### In-Browser Recording
- **Audio Constraints**: Mono channel, 16,000Hz or 48,000Hz sample rate.
- **Encoding**: WebM with Opus compression where supported (`audio/webm;codecs=opus`).
- **Timing**: Wall-clock delta evaluation via `Date.now() - startTime - pausedDuration`.

### File Upload Fallback
- Supported extensions: `.mp3`, `.wav`, `.m4a`, `.webm`.
- Size ceiling: Enforced at 25MB (26,214,400 bytes).

---

## 3. Stage 2: Ingestion & Server Validation

Endpoint: `POST /api/transcribe`
- **MIME Check**: Rejects invalid payloads with HTTP 415.
- **Empty Check**: Rejects zero-byte payloads with HTTP 400.
- **Size Check**: Rejects payloads exceeding 25MB with HTTP 413.
- **Header Parsing**: Extracts optional BYOK headers `x-google-key` and `x-groq-key`.

---

## 4. Stage 3: Multi-Provider ASR & Speaker Diarization

The ASR subsystem implements an active failover hierarchy:

```
                      ┌──────────────────────┐
                      │ Incoming Audio Bytes │
                      └──────────┬───────────┘
                                 │
                     Does Groq Key Exist?
                                 │
                 ┌───────────────┴───────────────┐
                 │ YES                           │ NO
                 ▼                               ▼
       Groq Whisper ASR               Google Gemini 2.5 Flash
       (whisper-large-v3-turbo)       (Multimodal Audio Part)
                 │                               │
           Did it succeed?                       │
           ┌─────┴─────┐                         │
        YES│         NO│                         │
           ▼           └─────────► Fallback ─────┤
     Clean Text                                  ▼
                                       Speaker Diarized
                                       Transcript with Timestamps
```

### Prompt Engineering for Diarization (Gemini)
Gemini receives the binary audio part alongside strict formatting instructions:
- Output only the transcript without conversational filler.
- Detect distinct acoustic speakers and prepend speaker labels: `[MM:SS] Speaker Name: text`.
- If no audible speech is detected, output exactly: `NO_SPEECH`.

---

## 5. Stage 4: Schema-Enforced Analysis

Endpoint: `POST /api/analyze`
Input contract: `{ transcript: string, title?: string, durationSec?: number }`

### Zod Schema Definition (`src/lib/schema.ts`)

```typescript
export const actionItemSchema = z.object({
  task: z.string().min(1),
  assignee: z.string(),
  dueDate: z.string().nullable(),
  priority: z.enum(["High", "Medium", "Low"]),
});

export const summaryTopicSchema = z.object({
  topic: z.string(),
  points: z.array(z.string()),
});

export const analysisSchema = z.object({
  summary: z.array(summaryTopicSchema),
  actionItems: z.array(actionItemSchema),
});
```

The AI SDK `generateObject` binds this schema directly into Gemini's generation parameters, eliminating JSON parsing failures and structural hallucinations.
