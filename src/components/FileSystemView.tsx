"use client";

import { useMemo, useState } from "react";
import type { ActionItemDTO, SessionDTO } from "@/lib/types";
import { formatDuration } from "@/lib/format";
import AudioPlayer from "./AudioPlayer";
import TranscriptPanel from "./TranscriptPanel";
import InsightsPanel from "./InsightsPanel";

type VirtualFileId = "audio" | "transcript" | "summary" | "tasks" | "json";

type VirtualFile = {
  id: VirtualFileId;
  name: string;
  icon: string;
  badge: string;
  sizeDesc?: string;
};

type Props = {
  session: SessionDTO;
  actionItems: ActionItemDTO[];
  audioBlob?: Blob | null;
  audioUrl?: string | null;
  onItemChange: (item: ActionItemDTO) => void;
  onItemDelete: (id: string) => void;
  onItemAdd: (item: ActionItemDTO) => void;
  onExportMd: () => void;
  onExportJson: () => void;
};

function downloadText(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function FileSystemView({
  session,
  actionItems,
  audioBlob,
  audioUrl,
  onItemChange,
  onItemDelete,
  onItemAdd,
  onExportMd,
  onExportJson,
}: Props) {
  const [selectedFile, setSelectedFile] = useState<VirtualFileId>("summary");
  const [copied, setCopied] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");

  const durationStr = formatDuration(session.durationSec);
  const doneCount = actionItems.filter((i) => i.done).length;

  const virtualFiles: VirtualFile[] = useMemo(() => {
    const audioExt = audioBlob?.type?.includes("wav")
      ? "wav"
      : audioBlob?.type?.includes("mp4")
        ? "m4a"
        : "webm";

    return [
      {
        id: "summary",
        name: "summary.md",
        icon: "📊",
        badge: "Executive Brief",
        sizeDesc: `${session.summary.length} topics`,
      },
      {
        id: "tasks",
        name: "tasks.json",
        icon: "✅",
        badge: "Action Items",
        sizeDesc: `${doneCount}/${actionItems.length} done`,
      },
      {
        id: "transcript",
        name: "transcript.txt",
        icon: "📄",
        badge: "Diarized Speech",
        sizeDesc: `${session.transcript.split("\n").filter(Boolean).length} lines`,
      },
      {
        id: "audio",
        name: `audio.${audioExt}`,
        icon: "🎙️",
        badge: "Bitstream",
        sizeDesc: durationStr ?? (audioBlob ? `${Math.round(audioBlob.size / 1024)} KB` : "Audio"),
      },
      {
        id: "json",
        name: "session.json",
        icon: "📋",
        badge: "Full DTO",
        sizeDesc: "Structured data",
      },
    ];
  }, [session, actionItems, audioBlob, durationStr, doneCount]);

  function handleDownloadActive() {
    const safeTitle = session.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    if (selectedFile === "audio") {
      if (audioBlob) {
        const ext = audioBlob.type?.includes("wav") ? "wav" : "webm";
        downloadText(
          "",
          `${safeTitle}.${ext}`,
          audioBlob.type || "audio/webm",
        );
        // download binary blob directly
        const url = URL.createObjectURL(audioBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${safeTitle}.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } else if (selectedFile === "transcript") {
      downloadText(session.transcript, `${safeTitle}-transcript.txt`, "text/plain");
    } else if (selectedFile === "summary") {
      onExportMd();
    } else if (selectedFile === "tasks") {
      downloadText(
        JSON.stringify(actionItems, null, 2),
        `${safeTitle}-tasks.json`,
        "application/json",
      );
    } else if (selectedFile === "json") {
      onExportJson();
    }
  }

  async function handleCopyActive() {
    let text = "";
    if (selectedFile === "transcript") text = session.transcript;
    else if (selectedFile === "summary") {
      text = session.summary
        .map((t) => `## ${t.topic}\n` + t.points.map((p) => `- ${p}`).join("\n"))
        .join("\n\n");
    } else if (selectedFile === "tasks") {
      text = JSON.stringify(actionItems, null, 2);
    } else if (selectedFile === "json") {
      text = JSON.stringify({ ...session, actionItems }, null, 2);
    }

    if (text) {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // clipboard fallback
      }
    }
  }

  const activeMeta = virtualFiles.find((f) => f.id === selectedFile)!;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* File System Header & Breadcrumbs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/75 px-4 py-3">
        <div className="flex items-center gap-2 font-mono text-xs text-slate-600">
          <span className="font-semibold text-slate-800">baithak</span>
          <span>/</span>
          <span>sessions</span>
          <span>/</span>
          <span className="truncate max-w-[200px] text-slate-800 font-medium">
            {session.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}
          </span>
          <span>/</span>
          <span className="font-semibold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
            {activeMeta.name}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {selectedFile !== "audio" && (
            <button
              type="button"
              onClick={handleCopyActive}
              className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              {copied ? "Copied!" : "Copy Content"}
            </button>
          )}
          <button
            type="button"
            onClick={handleDownloadActive}
            className="rounded-md bg-slate-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-slate-800"
          >
            Download {activeMeta.name}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 min-h-[540px]">
        {/* Left Sidebar: Virtual File Tree */}
        <aside className="border-b md:border-b-0 md:border-r border-slate-200 bg-slate-50/40 p-3 md:col-span-4 lg:col-span-3 space-y-1">
          <div className="px-2 py-1.5 text-2xs font-semibold uppercase tracking-wider text-slate-400">
            Session Files
          </div>
          {virtualFiles.map((file) => {
            const isActive = file.id === selectedFile;
            return (
              <button
                key={file.id}
                type="button"
                onClick={() => setSelectedFile(file.id)}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left transition-colors ${
                  isActive
                    ? "bg-white text-slate-900 shadow-xs border border-slate-200 font-medium"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="text-sm">{file.icon}</span>
                  <span className="font-mono text-xs truncate">{file.name}</span>
                </div>
                {file.sizeDesc && (
                  <span className="shrink-0 font-mono text-3xs text-slate-400 ml-2">
                    {file.sizeDesc}
                  </span>
                )}
              </button>
            );
          })}

          <div className="mt-6 border-t border-slate-200 pt-3 px-2">
            <div className="text-2xs uppercase tracking-wider text-slate-400 font-semibold mb-1">
              Metadata
            </div>
            <div className="space-y-1 text-xs text-slate-500 font-mono">
              <p>ID: {session.id.slice(0, 8)}...</p>
              <p>Created: {new Date(session.createdAt).toLocaleDateString()}</p>
              {durationStr && <p>Duration: {durationStr}</p>}
            </div>
          </div>
        </aside>

        {/* Center / Right: File Content Inspector */}
        <div className="p-4 md:col-span-8 lg:col-span-9 bg-white flex flex-col">
          {selectedFile === "audio" && (
            <div className="flex-1 flex flex-col justify-center max-w-xl mx-auto w-full py-4">
              {audioBlob || audioUrl ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                      Audio preserved in browser IndexedDB
                    </span>
                  </div>
                  <AudioPlayer
                    file={audioBlob}
                    url={audioUrl || undefined}
                    title={session.title}
                  />
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
                  <p className="text-2xl mb-2">🎙️</p>
                  <h4 className="text-sm font-semibold text-slate-800">
                    Audio Not Stored in Browser
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    This session was created on a previous instance or seeded from sample data.
                    Newly recorded or uploaded sessions automatically preserve their audio bitstream in browser storage.
                  </p>
                </div>
              )}
            </div>
          )}

          {selectedFile === "summary" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-semibold text-slate-900">Executive Summary</h3>
                <span className="text-xs text-slate-500">
                  {session.summary.length} topics identified
                </span>
              </div>
              <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-2">
                {session.summary.map((t) => (
                  <div key={t.topic} className="rounded-lg border border-slate-200 p-4 bg-slate-50/50">
                    <h4 className="text-sm font-semibold text-slate-900">{t.topic}</h4>
                    <ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-slate-700">
                      {t.points.map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedFile === "tasks" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-semibold text-slate-900">Action Items</h3>
                <span className="text-xs font-medium text-slate-600">
                  {doneCount} of {actionItems.length} completed
                </span>
              </div>
              <InsightsPanel
                sessionId={session.id}
                summary={[]}
                actionItems={actionItems}
                onItemChange={onItemChange}
                onItemDelete={onItemDelete}
                onItemAdd={onItemAdd}
              />
            </div>
          )}

          {selectedFile === "transcript" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <input
                  type="text"
                  placeholder="Filter transcript lines..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-slate-800 focus:outline-none w-64"
                />
                <span className="text-xs text-slate-400">
                  {searchFilter ? "Filtered preview" : "Full verbatim transcript"}
                </span>
              </div>
              <div className="max-h-[60vh] overflow-y-auto">
                {searchFilter ? (
                  <div className="space-y-2">
                    {session.transcript
                      .split("\n")
                      .filter((l) => l.toLowerCase().includes(searchFilter.toLowerCase()))
                      .map((line, i) => (
                        <div
                          key={i}
                          className="rounded-md border border-slate-100 bg-amber-50/40 p-2.5 font-mono text-xs text-slate-800"
                        >
                          {line}
                        </div>
                      ))}
                  </div>
                ) : (
                  <TranscriptPanel transcript={session.transcript} />
                )}
              </div>
            </div>
          )}

          {selectedFile === "json" && (
            <div className="flex-1 flex flex-col">
              <div className="mb-2 text-xs text-slate-500 font-mono">
                Full typed DTO contract:
              </div>
              <pre className="flex-1 max-h-[65vh] overflow-auto rounded-lg border border-slate-200 bg-slate-900 p-4 font-mono text-xs text-emerald-400">
                {JSON.stringify({ ...session, actionItems }, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

