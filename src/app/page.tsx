"use client";

import Link from "next/link";
import { useState } from "react";
import AudioPlayer from "@/components/AudioPlayer";
import AudioUpload from "@/components/AudioUpload";
import Dashboard from "@/components/Dashboard";
import DraftRecoveryBanner from "@/components/DraftRecoveryBanner";
import KeySettings from "@/components/KeySettings";
import ProcessingView from "@/components/ProcessingView";
import Recorder from "@/components/Recorder";
import StatusBadge from "@/components/StatusBadge";
import PushpinTearFooter from "@/components/ui/pushpin-tear-footer";
import { analyzeTranscript, loadSample, transcribeAudio } from "@/lib/api";
import { saveDraft, deleteDraft, saveLocalSession } from "@/lib/storage";
import type { CaptureState, SessionDTO } from "@/lib/types";

type Mode = "record" | "upload";
type Source = { blob: Blob; durationSec: number | null };

const PROCESSING: CaptureState[] = ["uploading", "transcribing", "analyzing"];

const SAMPLES = [
  {
    id: "product_launch",
    title: "Product Launch Sync",
    url: "/samples/product_launch_sync.m4a",
    duration: "20s",
    description: "Multi-speaker launch sync covering blockers, email copy owned by Sundar, and Saturday morning migration.",
  },
  {
    id: "standup",
    title: "Engineering Daily Standup",
    url: "/samples/engineering_standup.m4a",
    duration: "16s",
    description: "Daily engineering standup covering auth token bug reproduction and afternoon pull request review.",
  },
];

export default function HomePage() {
  const [mode, setMode] = useState<Mode>("record");
  const [state, setState] = useState<CaptureState>("idle");
  const [session, setSession] = useState<SessionDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<Source | null>(null);
  const [loadingSample, setLoadingSample] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeSample, setActiveSample] = useState<{
    url: string;
    title: string;
  } | null>(null);

  const processing = PROCESSING.includes(state);

  async function openSample(sampleId?: string) {
    setError(null);
    setLoadingSample(true);
    try {
      const result = await loadSample(sampleId);
      await saveLocalSession(result).catch(() => {});
      setSession(result);
      setState("completed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the sample.");
      setState("error");
    } finally {
      setLoadingSample(false);
    }
  }

  async function process(src: Source, existingDraftId?: string) {
    setSource(src);
    setError(null);
    setState("uploading");

    // Save draft to browser storage immediately to guarantee zero data loss
    const draftId =
      existingDraftId ||
      (await saveDraft({
        blob: src.blob,
        durationSec: src.durationSec,
        status: "processing",
      }).catch(() => undefined));

    try {
      const pending = transcribeAudio(src.blob);
      setState("transcribing");
      const { text, durationSec } = await pending;
      if (!text.trim()) {
        throw new Error("No speech was detected in that audio.");
      }
      setState("analyzing");
      const result = await analyzeTranscript({
        transcript: text,
        durationSec: durationSec ?? src.durationSec,
      });

      // Save complete session with raw audio in browser IndexedDB
      await saveLocalSession(result, src.blob).catch(() => {});
      if (draftId) await deleteDraft(draftId).catch(() => {});

      setSession(result);
      setState("completed");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      if (draftId) {
        await saveDraft({
          id: draftId,
          blob: src.blob,
          durationSec: src.durationSec,
          status: "failed",
          error: msg,
        }).catch(() => {});
      }
      setError(msg);
      setState("error");
    }
  }

  async function processSampleAudio(url: string) {
    try {
      setError(null);
      setState("uploading");
      const res = await fetch(url);
      if (!res.ok) throw new Error("Could not load sample audio file.");
      const blob = await res.blob();
      const filename = url.split("/").pop() || "sample.m4a";
      const mime = filename.endsWith(".wav")
        ? "audio/wav"
        : filename.endsWith(".m4a")
          ? "audio/mp4"
          : "audio/webm";
      const audioFile = new File([blob], filename, { type: mime });
      await process({ blob: audioFile, durationSec: null });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process sample audio.");
      setState("error");
    }
  }

  function reset() {
    setSession(null);
    setSource(null);
    setError(null);
    setActiveSample(null);
    setState("idle");
  }

  return (
    <div className="flex min-h-screen flex-col justify-between">
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 sm:py-7">
      <nav className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight text-slate-900">Baithak</span>
          <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600 border border-red-200/70">
            बैठक
          </span>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <StatusBadge state={state} />
          <Link href="/sessions" className="text-sm text-slate-600 hover:text-red-600 transition-colors">
            History
          </Link>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="text-sm text-slate-600 hover:text-red-600 transition-colors"
          >
            Keys
          </button>
          {state !== "idle" && !processing && (
            <button
              type="button"
              onClick={reset}
              className="rounded-lg border border-red-200 bg-red-50/50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 hover:border-red-300 transition-colors"
            >
              New session
            </button>
          )}
        </div>
      </nav>

      {state === "completed" && session ? (
        <Dashboard
          key={session.id}
          session={session}
          initialAudioBlob={source?.blob}
          onDeleted={reset}
        />
      ) : processing ? (
        <div className="mx-auto max-w-xl">
          <ProcessingView state={state} />
        </div>
      ) : state === "error" ? (
        <div className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-red-50/80 p-6 shadow-sm backdrop-blur">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-red-600 text-xs font-bold">!</span>
            <h2 className="text-sm font-semibold text-red-900">Processing failed</h2>
          </div>
          <p role="alert" className="mt-2 text-sm leading-relaxed text-red-800">
            {error}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            {error && (error.toLowerCase().includes("limit") || error.toLowerCase().includes("key") || error.toLowerCase().includes("gemini")) && (
              <>
                <button
                  type="button"
                  onClick={() => setSettingsOpen(true)}
                  className="rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-red-700 transition"
                >
                  Add Your Gemini Key
                </button>
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-700 shadow-sm hover:bg-red-50 hover:text-red-800 transition"
                >
                  Get Free Gemini Key ↗
                </a>
              </>
            )}
            {source && (
              <button
                type="button"
                onClick={() => void process(source)}
                className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-700 transition"
              >
                Retry
              </button>
            )}
            <button
              type="button"
              onClick={reset}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Start over
            </button>
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-xl">
          <DraftRecoveryBanner
            onRetry={(draft) =>
              void process(
                { blob: draft.blob, durationSec: draft.durationSec },
                draft.id,
              )
            }
          />
          <h1 className="mb-1 text-2xl font-semibold text-slate-900">New session</h1>
          <p className="mb-1 text-sm text-slate-500">
            Record a meeting or upload audio to get a transcript, summary and action items.
          </p>
          <p className="mb-6 text-xs text-slate-400">
            Free tier: up to 25 MB per clip (~1-2 hrs recorded, ~25 min as MP3).
          </p>

          <div className="mb-4 flex gap-1 rounded-lg bg-slate-100 p-1" role="tablist">
            {(["record", "upload"] as const).map((m) => (
              <button
                key={m}
                role="tab"
                aria-selected={mode === m}
                disabled={state === "recording" || state === "paused"}
                onClick={() => {
                  setMode(m);
                  setActiveSample(null);
                }}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium capitalize disabled:cursor-not-allowed transition-all ${
                  mode === m
                    ? "bg-white text-red-600 shadow-sm font-semibold border border-red-100"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {mode === "record" ? (
            <Recorder
              onStateChange={setState}
              onComplete={(blob, durationSec) => void process({ blob, durationSec })}
            />
          ) : (
            <AudioUpload onSelect={(file) => void process({ blob: file, durationSec: null })} />
          )}

          {/* Sample audio space with live audio preview and playback */}
          <div className="mt-6 border-t border-slate-100 pt-5">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Sample Audio & Instant Testing
              </h2>
              <button
                type="button"
                onClick={() => void openSample()}
                disabled={loadingSample || state === "recording" || state === "paused"}
                className="text-xs font-semibold text-red-600 underline underline-offset-4 hover:text-red-700 disabled:opacity-50 transition-colors"
              >
                {loadingSample ? "Loading..." : "Instant Report (No Keys)"}
              </button>
            </div>
            <p className="mb-3 text-xs text-slate-400">
              Listen to meeting clips with live waveform visualizer, or transcribe with AI.
            </p>

            {activeSample ? (
              <div className="mb-3">
                <AudioPlayer
                  url={activeSample.url}
                  title={activeSample.title}
                  onProcess={() => void processSampleAudio(activeSample.url)}
                  onCancel={() => setActiveSample(null)}
                  disabled={processing}
                />
              </div>
            ) : null}

            <div className="grid gap-2.5 sm:grid-cols-2">
              {SAMPLES.map((sample) => (
                <div
                  key={sample.id}
                  className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-sm hover:border-red-200 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-slate-900">
                      {sample.title}
                    </span>
                    <span className="font-mono text-xs text-slate-400">
                      {sample.duration}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mb-2.5 leading-relaxed line-clamp-2">
                    {sample.description}
                  </p>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveSample({
                          url: sample.url,
                          title: sample.title,
                        })
                      }
                      className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 text-center transition-colors"
                    >
                      Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => void openSample(sample.id)}
                      disabled={loadingSample || processing}
                      className="rounded-lg border border-slate-300 bg-slate-50 px-2 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-100 disabled:opacity-50 text-center transition-colors"
                    >
                      Instant
                    </button>
                    <button
                      type="button"
                      onClick={() => void processSampleAudio(sample.url)}
                      disabled={processing}
                      className="rounded-lg bg-red-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-red-500 shadow-sm disabled:opacity-50 text-center transition-colors"
                    >
                      Transcribe AI
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Seamless transition zone with sparse uneven red halftone dots */}
      <div className="relative mt-6 w-full h-12 overflow-hidden pointer-events-none select-none" aria-hidden="true">
        {/* Sparse, uneven red dots guiding downward into footer */}
        <span className="absolute left-[9%] top-1.5 h-1.5 w-1.5 rounded-full bg-red-400/35" />
        <span className="absolute left-[18%] top-7 h-2.5 w-2.5 rounded-full bg-red-500/45" />
        <span className="absolute left-[31%] top-3 h-2 w-2 rounded-full bg-red-400/30" />
        <span className="absolute left-[42%] top-8 h-3 w-3 rounded-full bg-red-500/50" />
        <span className="absolute left-[54%] top-2 h-2 w-2 rounded-full bg-red-400/40" />
        <span className="absolute left-[67%] top-8 h-3 w-3 rounded-full bg-red-500/55" />
        <span className="absolute left-[78%] top-3 h-2.5 w-2.5 rounded-full bg-red-400/35" />
        <span className="absolute left-[88%] top-9 h-4 w-4 rounded-full bg-red-600/65" />
      </div>

      <KeySettings
        key={settingsOpen ? "open" : "closed"}
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </main>
    <div className="w-full">
      <PushpinTearFooter
        brand="baithak."
        name="baithak · intelligent ai notetaker"
        logoHref="/"
        sheet="#ffffff"
        paper="#ffffff"
        pinColor="#dc2626"
        sheetInk="#0f172a"
        paperInk="#0f172a"
        seed={42}
        socials={[]}
        columns={[]}
        newsletter={null}
        status={null}
        chat={null}
        sideLinks={[]}
        copyright="© 2026 Baithak · All rights reserved"
        credit="Speech Intelligence & Meeting Notes"
        handle={null}
        mark={null}
        timeZone={null}
      />
    </div>
  </div>
  );
}
