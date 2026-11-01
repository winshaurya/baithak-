"use client";

import { useMemo, useState } from "react";

type Segment = {
  timestamp?: string;
  speaker?: string;
  text: string;
};

function parseSegments(raw: string): Segment[] {
  const lines = raw.split("\n").filter((l) => l.trim().length > 0);
  const segments: Segment[] = [];

  // Match "[00:12] Speaker Name: message" or "Speaker Name: message" or "[00:12] message"
  const lineRegex =
    /^(?:\[?(\d{1,2}:\d{2}(?::\d{2})?)\]?\s*)?(?:([A-Za-z0-9 _-]{2,25}):\s*)?(.+)$/;

  for (const line of lines) {
    const match = line.match(lineRegex);
    if (match && (match[1] || match[2])) {
      segments.push({
        timestamp: match[1]?.trim(),
        speaker: match[2]?.trim(),
        text: match[3]?.trim() ?? line,
      });
    } else {
      segments.push({ text: line });
    }
  }

  return segments;
}

const SPEAKER_COLORS: string[] = [
  "bg-blue-100 text-blue-800 border-blue-200",
  "bg-purple-100 text-purple-800 border-purple-200",
  "bg-emerald-100 text-emerald-800 border-emerald-200",
  "bg-amber-100 text-amber-800 border-amber-200",
  "bg-rose-100 text-rose-800 border-rose-200",
  "bg-indigo-100 text-indigo-800 border-indigo-200",
];

function getSpeakerColor(speaker: string, indexMap: Map<string, number>): string {
  if (!indexMap.has(speaker)) {
    indexMap.set(speaker, indexMap.size % SPEAKER_COLORS.length);
  }
  return SPEAKER_COLORS[indexMap.get(speaker)!];
}

export default function TranscriptPanel({ transcript }: { transcript: string }) {
  const [viewMode, setViewMode] = useState<"segmented" | "raw">("segmented");

  const segments = useMemo(() => parseSegments(transcript), [transcript]);
  const hasSpeakers = useMemo(
    () => segments.some((s) => s.speaker || s.timestamp),
    [segments],
  );

  const speakerColorMap = useMemo(() => new Map<string, number>(), []);

  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-900">Transcript</h2>
        {transcript.trim() && (
          <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => setViewMode("segmented")}
              className={`rounded-md px-2.5 py-1 transition-colors ${
                viewMode === "segmented"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Segmented
            </button>
            <button
              type="button"
              onClick={() => setViewMode("raw")}
              className={`rounded-md px-2.5 py-1 transition-colors ${
                viewMode === "raw"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Raw
            </button>
          </div>
        )}
      </div>

      <div className="max-h-[70vh] overflow-y-auto p-4">
        {!transcript.trim() ? (
          <p className="text-sm text-slate-400">No speech was detected.</p>
        ) : viewMode === "raw" || !hasSpeakers ? (
          <p className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-slate-700">
            {transcript}
          </p>
        ) : (
          <div className="space-y-3">
            {segments.map((seg, i) => (
              <div
                key={i}
                className="rounded-lg border border-slate-100 bg-slate-50/60 p-3 transition-colors hover:bg-slate-50"
              >
                <div className="mb-1 flex items-center gap-2">
                  {seg.speaker && (
                    <span
                      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${getSpeakerColor(
                        seg.speaker,
                        speakerColorMap,
                      )}`}
                    >
                      {seg.speaker}
                    </span>
                  )}
                  {seg.timestamp && (
                    <span className="font-mono text-xs text-slate-400">
                      [{seg.timestamp}]
                    </span>
                  )}
                </div>
                <p className="text-sm leading-relaxed text-slate-800">
                  {seg.text}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
