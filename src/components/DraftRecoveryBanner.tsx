"use client";

import { useEffect, useState } from "react";
import { listDrafts, deleteDraft, type AudioDraft } from "@/lib/storage";
import { formatDuration } from "@/lib/format";

type Props = {
  onRetry: (draft: AudioDraft) => void;
};

export default function DraftRecoveryBanner({ onRetry }: Props) {
  const [drafts, setDrafts] = useState<AudioDraft[]>([]);

  useEffect(() => {
    let cancelled = false;
    listDrafts()
      .then((items) => {
        if (!cancelled) {
          // Show drafts that are failed or captured (unprocessed)
          setDrafts(items.filter((d) => d.status !== "completed"));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (drafts.length === 0) return null;

  const current = drafts[0];
  const duration = formatDuration(current.durationSec);

  function handleDownload() {
    const ext = current.blob.type.includes("wav")
      ? "wav"
      : current.blob.type.includes("mp4")
        ? "m4a"
        : "webm";
    const url = URL.createObjectURL(current.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `recovered-recording-${new Date(current.createdAt).toISOString()}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function handleDiscard() {
    await deleteDraft(current.id);
    setDrafts((prev) => prev.filter((d) => d.id !== current.id));
  }

  return (
    <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50/90 p-4 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-800 text-lg">
            🎙️
          </span>
          <div>
            <h4 className="text-sm font-semibold text-amber-900">
              Recovered Local Audio Recording
            </h4>
            <p className="text-xs text-amber-700">
              Saved in browser storage from {new Date(current.createdAt).toLocaleTimeString()}
              {duration ? ` (${duration})` : ""}
              {current.error ? ` · Last error: ${current.error}` : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onRetry(current)}
            className="rounded-lg bg-amber-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-800 shadow-2xs"
          >
            Retry Processing
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-50"
          >
            Download Audio
          </button>
          <button
            type="button"
            onClick={handleDiscard}
            className="rounded-lg px-2.5 py-1.5 text-xs text-amber-700 hover:text-amber-900"
          >
            Discard
          </button>
        </div>
      </div>
    </div>
  );
}

