"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatTime } from "@/lib/format";

type Props = {
  file?: File | Blob | null;
  url?: string;
  title?: string;
  onProcess?: () => void;
  onCancel?: () => void;
  disabled?: boolean;
};

export default function AudioPlayer({
  file,
  url,
  title,
  onProcess,
  onCancel,
  disabled = false,
}: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const rafRef = useRef<number | null>(null);

  const audioUrl = useMemo(() => {
    if (url) return url;
    if (file) return URL.createObjectURL(file);
    return null;
  }, [file, url]);

  // Revoke object URL on unmount or file change
  useEffect(() => {
    return () => {
      if (file && audioUrl && !url) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [file, audioUrl, url]);

  // Cleanup audio context and animation frame on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        void audioCtxRef.current.close();
      }
    };
  }, []);

  function setupVisualizer() {
    if (!audioRef.current || audioCtxRef.current) return;

    try {
      const AudioCtxClass =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtxClass) return;

      const ctx = new AudioCtxClass();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;

      const source = ctx.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(ctx.destination);

      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      sourceRef.current = source;
    } catch {
      // Browser cross-origin or already connected fallback
    }
  }

  function startVisualizer() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const analyser = analyserRef.current;
    if (!canvas || !ctx) return;

    const data = new Uint8Array(analyser ? analyser.frequencyBinCount : 48);

    const render = () => {
      rafRef.current = requestAnimationFrame(render);
      if (analyser) {
        analyser.getByteFrequencyData(data);
      } else {
        // Fallback subtle movement when playing
        for (let j = 0; j < 48; j++) {
          data[j] = Math.floor(Math.random() * 128);
        }
      }

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

  function stopVisualizer() {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Draw quiet baseline
      ctx.fillStyle = "#e2e8f0";
      const bars = 48;
      const barWidth = canvas.width / bars;
      for (let i = 0; i < bars; i++) {
        ctx.fillRect(i * barWidth + 1, (canvas.height - 2) / 2, barWidth - 2, 2);
      }
    }
  }

  async function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      setupVisualizer();
      if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
        await audioCtxRef.current.resume();
      }
      try {
        await audio.play();
        setIsPlaying(true);
        startVisualizer();
      } catch (err) {
        console.error("Playback failed:", err);
      }
    } else {
      audio.pause();
      setIsPlaying(false);
      stopVisualizer();
    }
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const targetTime = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
    }
  }

  const displayName =
    title ||
    (file instanceof File ? file.name : "Recorded Audio");

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="metadata"
          onLoadedMetadata={(e) => {
            setDuration(e.currentTarget.duration);
          }}
          onTimeUpdate={(e) => {
            setCurrentTime(e.currentTarget.currentTime);
          }}
          onEnded={() => {
            setIsPlaying(false);
            stopVisualizer();
          }}
        />
      )}

      <div className="flex flex-col items-center gap-4">
        <div className="text-center">
          <h3 className="text-sm font-semibold text-slate-900 truncate max-w-sm">
            {displayName}
          </h3>
          <div className="font-mono text-xs tabular-nums text-slate-500 mt-0.5">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>

        {/* 48-bar waveform visualizer matching Recorder */}
        <canvas
          ref={canvasRef}
          width={480}
          height={64}
          className="h-16 w-full max-w-md rounded-lg bg-slate-50"
          aria-hidden="true"
        />

        {/* Scrub slider */}
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          disabled={disabled || !duration}
          className="h-1.5 w-full max-w-md cursor-pointer appearance-none rounded-lg bg-slate-200 accent-red-600 focus:outline-none"
        />

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={togglePlay}
            disabled={disabled || !audioUrl}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {isPlaying ? "Pause Preview" : "Play & Listen"}
          </button>

          {onProcess && (
            <button
              type="button"
              onClick={onProcess}
              disabled={disabled}
              className="rounded-lg bg-red-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-500 disabled:opacity-50 transition-colors"
            >
              Transcribe & Analyze
            </button>
          )}

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={disabled}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100"
            >
              Change file
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
