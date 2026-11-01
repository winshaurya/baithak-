# Client Lifecycle & State Machine Specification

## 1. Capture State Machine

The client application runs on a single deterministic state machine represented by the `CaptureState` union type:

```typescript
export type CaptureState =
  | "idle"
  | "recording"
  | "paused"
  | "uploading"
  | "transcribing"
  | "analyzing"
  | "completed"
  | "error";
```

### State Transition Diagram

```
       ┌────────────────────────┐
       │          idle          │
       └────┬──────────────┬────┘
            │ start()      │ fileSelected()
            ▼              │
       ┌───────────┐       │
  ┌───►│ recording │       │
  │    └─────┬─────┘       │
  │          │ pause()     │
  │          ▼             │
  │    ┌───────────┐       │
  └───-│  paused   │       │
       └─────┬─────┘       │
             │ stop()      │
             ▼             ▼
       ┌────────────────────────┐
       │       uploading        │
       └───────────┬────────────┘
                   │
                   ▼
       ┌────────────────────────┐
       │      transcribing      │
       └───────────┬────────────┘
                   │
                   ▼
       ┌────────────────────────┐
       │       analyzing        │
       └───────────┬────────────┘
                   │
                   ▼
       ┌────────────────────────┐
       │       completed        │
       └────────────────────────┘
```

---

## 2. Background Execution & Picture-in-Picture Protocol

### The Problem of Background Tab Throttling
Modern browsers aggressively throttle background tabs:
- Timers (`setInterval`, `setTimeout`) are clamped to 1Hz or frozen entirely.
- `requestAnimationFrame` loops stop firing.

### The Baithak Solution
1. **Wall-Clock Math**:
   - `startTimeRef`: Timestamp at recording inception.
   - `pausedDurationRef`: Cumulative milliseconds elapsed during paused states.
   - Active duration calculation: `Math.floor((Date.now() - startTime - pausedDuration) / 1000)`.
2. **Background Audio Continuity**:
   - `MediaRecorder` continues capturing live audio streams in the background.
   - On `visibilitychange`, the elapsed timer synchronizes against wall-clock timestamps so zero drift occurs when switching tabs.
