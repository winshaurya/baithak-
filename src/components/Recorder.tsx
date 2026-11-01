"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { formatTime } from "@/lib/format";

type RecState = "idle" | "recording" | "paused";

type Props = {
  onComplete: (blob: Blob, durationSec: number) => void;
  /** Reports recorder state so the parent can mirror it in a status badge. */
  onStateChange?: (state: RecState) => void;
  disabled?: boolean;
};

function describeMicError(err: unknown): string {
  if (err instanceof DOMException) {
    if (err.name === "NotAllowedError") {
      return "Microphone access was denied. Allow it in your browser settings and try again.";
    }
    if (err.name === "NotFoundError") {
      return "No microphone was found. Connect one and try again.";
    }
  }
  return "Could not start recording. Check your microphone and try again.";
}

export default function Recorder({ onComplete, onStateChange, disabled = false }: Props) {
  const [state, setState] = useState<RecState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Accurate wall-clock timing for background execution
  const startTimeRef = useRef(0);
  const pausedDurationRef = useRef(0);
  const pauseStartRef = useRef(0);
  const elapsedRef = useRef(0);

  const stateRef = useRef<RecState>("idle");
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const changeState = useCallback(
    (next: RecState) => {
      setState(next);
      stateRef.current = next;
      onStateChange?.(next);
    },
    [onStateChange],
  );

  const releaseResources = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;

    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      void audioCtxRef.current.close();
    }
    audioCtxRef.current = null;
  }, []);

  // Synchronize timer when tab visibility changes so background elapsed time is accurate
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (stateRef.current === "recording" && startTimeRef.current > 0) {
        const now = Date.now();
        const current = Math.floor(
          (now - startTimeRef.current - pausedDurationRef.current) / 1000,
        );
        setElapsed(current);
        elapsedRef.current = current;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Stop everything if unmounted mid-recording
  useEffect(() => {
    return () => {
      const rec = recorderRef.current;
      if (rec && rec.state !== "inactive") {
        rec.onstop = null;
        rec.stop();
      }
      releaseResources();
    };
  }, [releaseResources]);

  function startTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (startTimeRef.current > 0 && pauseStartRef.current === 0) {
        const now = Date.now();
        const sec = Math.max(
          0,
          Math.floor((now - startTimeRef.current - pausedDurationRef.current) / 1000),
        );
        setElapsed(sec);
        elapsedRef.current = sec;
      }
    }, 250);
  }

  function drawVisualizer(analyser: AnalyserNode) {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const data = new Uint8Array(analyser.frequencyBinCount);

    const render = () => {
      rafRef.current = requestAnimationFrame(render);
      analyser.getByteFrequencyData(data);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const bars = 48;
      const step = Math.floor(data.length / bars);
      const barWidth = canvas.width / bars;
      ctx.fillStyle = "#0f172a";
      for (let i = 0; i < bars; i++) {
        const value = data[i * step] / 255;
        const h = Math.max(2, value * canvas.height);
        ctx.fillRect(i * barWidth + 1, (canvas.height - h) / 2, barWidth - 2, h);
      }
    };
    render();
  }

  async function start() {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Recording is not supported in this browser. Try uploading a file instead.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      audioCtx.createMediaStreamSource(stream).connect(analyser);

      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : undefined;
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const duration = elapsedRef.current;
        releaseResources();
        changeState("idle");
        if (blob.size > 0) {
          onCompleteRef.current(blob, duration);
        } else {
          setError("No audio was captured. Please try again.");
        }
      };
      recorderRef.current = recorder;

      // Initialize wall clock tracking
      startTimeRef.current = Date.now();
      pausedDurationRef.current = 0;
      pauseStartRef.current = 0;
      elapsedRef.current = 0;
      setElapsed(0);

      recorder.start(1000);
      startTimer();
      drawVisualizer(analyser);
      changeState("recording");

      // Configure MediaSession for OS background audio controls
      if ("mediaSession" in navigator) {
        try {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: "Baithak - Live Recording",
            artist: "Baithak AI Notetaker",
          });
          navigator.mediaSession.setActionHandler("pause", () => togglePause());
          navigator.mediaSession.setActionHandler("play", () => togglePause());
          navigator.mediaSession.setActionHandler("stop", () => stop());
        } catch {
          // ignore unsupported media actions
        }
      }
    } catch (err) {
      releaseResources();
      setError(describeMicError(err));
      changeState("idle");
    }
  }

  function togglePause() {
    const rec = recorderRef.current;
    if (!rec) return;
    if (rec.state === "recording") {
      rec.pause();
      pauseStartRef.current = Date.now();
      changeState("paused");
    } else if (rec.state === "paused") {
      if (pauseStartRef.current > 0) {
        pausedDurationRef.current += Date.now() - pauseStartRef.current;
        pauseStartRef.current = 0;
      }
      rec.resume();
      changeState("recording");
    }
  }

  function stop() {
    const rec = recorderRef.current;
    if (rec && rec.state !== "inactive") {
      rec.stop();
    }
  }

  const active = state !== "idle";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-2">
          {active && (
            <span
              className={`h-2.5 w-2.5 rounded-full ${state === "recording" ? "animate-pulse bg-red-600" : "bg-amber-500"
                }`}
            />
          )}
          <span className="font-mono text-4xl tabular-nums text-slate-900">
            {formatTime(elapsed)}
          </span>
        </div>

        <canvas
          ref={canvasRef}
          width={480}
          height={64}
          className={`h-16 w-full max-w-md rounded-lg bg-slate-50 ${active ? "" : "opacity-50"}`}
          aria-hidden="true"
        />

        <div className="flex flex-wrap items-center justify-center gap-3">
          {!active ? (
            <button
              type="button"
              onClick={start}
              disabled={disabled}
              className="rounded-lg bg-red-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Start recording
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={togglePause}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {state === "paused" ? "Resume" : "Pause"}
              </button>
              <button
                type="button"
                onClick={stop}
                className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-700"
              >
                Stop & Process
              </button>
            </>
          )}
        </div>
        {error && (
          <p role="alert" className="text-center text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
