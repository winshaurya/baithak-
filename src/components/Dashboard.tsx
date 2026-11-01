"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ActionItemDTO, SessionDTO } from "@/lib/types";
import { formatDuration } from "@/lib/format";
import { deleteSession } from "@/lib/api";
import {
  getLocalSession,
  deleteLocalSession,
  updateLocalActionItem,
  saveLocalSession,
} from "@/lib/storage";
import InsightsPanel from "./InsightsPanel";
import TranscriptPanel from "./TranscriptPanel";
import FileSystemView from "./FileSystemView";

type Tab = "insights" | "transcript";
type ViewMode = "standard" | "filesystem";

type Props = {
  session: SessionDTO;
  initialAudioBlob?: Blob | null;
  initialAudioUrl?: string | null;
  onDeleted?: () => void;
};

export default function Dashboard({
  session,
  initialAudioBlob,
  initialAudioUrl,
  onDeleted,
}: Props) {
  const router = useRouter();
  const [items, setItems] = useState<ActionItemDTO[]>(session.actionItems);
  const [tab, setTab] = useState<Tab>("insights");
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("baithak.viewMode") as ViewMode | null;
        if (saved === "standard" || saved === "filesystem") {
          return saved;
        }
      } catch {}
    }
    return "standard";
  });
  const [copied, setCopied] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(initialAudioBlob ?? null);
  const audioUrl = initialAudioUrl ?? null;
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Check local storage for audio blob if not passed in props
  useEffect(() => {
    if (!audioBlob) {
      getLocalSession(session.id)
        .then((local) => {
          if (local?.audioBlob) {
            setAudioBlob(local.audioBlob);
          }
        })
        .catch(() => {});
    }
  }, [session.id, audioBlob]);

  function handleViewModeChange(mode: ViewMode) {
    setViewMode(mode);
    try {
      localStorage.setItem("baithak.viewMode", mode);
    } catch {}
  }

  const duration = formatDuration(session.durationSec);

  function generateMarkdown(): string {
    const lines: string[] = [
      `# ${session.title}`,
      `Date: ${new Date(session.createdAt).toLocaleString()}`,
      duration ? `Duration: ${duration}` : "",
      "",
      "## Executive Summary",
      ...session.summary.flatMap((t) => [
        `### ${t.topic}`,
        ...t.points.map((p) => `- ${p}`),
        "",
      ]),
      "## Action Items",
      ...items.map(
        (i) =>
          `- [${i.done ? "x" : " "}] **${i.task}** (Assignee: ${i.assignee || "Unassigned"}, Due: ${i.dueDate || "N/A"}, Priority: ${i.priority})`,
      ),
      "",
      "## Transcript",
      session.transcript,
    ];
    return lines.filter((l) => l !== "").join("\n");
  }

  function downloadFile(content: string, filename: string, type: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handleExportMd() {
    const md = generateMarkdown();
    const safeTitle = session.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    downloadFile(md, `${safeTitle || "baithak-session"}.md`, "text/markdown");
  }

  function handleExportJson() {
    const payload = JSON.stringify({ ...session, actionItems: items }, null, 2);
    const safeTitle = session.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    downloadFile(payload, `${safeTitle || "baithak-session"}.json`, "application/json");
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(generateMarkdown());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard fallback
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      // Delete from local IndexedDB first
      await deleteLocalSession(session.id);
      // Delete from server API
      await deleteSession(session.id);
    } catch (err) {
      console.warn("Delete error:", err);
    } finally {
      setDeleting(false);
      if (onDeleted) {
        onDeleted();
      } else {
        router.push("/sessions");
      }
    }
  }

  function handleItemChange(updated: ActionItemDTO) {
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    void updateLocalActionItem(session.id, updated);
  }

  function handleItemDelete(id: string) {
    setItems((prev) => {
      const next = prev.filter((i) => i.id !== id);
      void saveLocalSession({ ...session, actionItems: next }, audioBlob ?? undefined);
      return next;
    });
  }

  function handleItemAdd(item: ActionItemDTO) {
    setItems((prev) => {
      const next = [...prev, item];
      void saveLocalSession({ ...session, actionItems: next }, audioBlob ?? undefined);
      return next;
    });
  }

  const transcript = <TranscriptPanel transcript={session.transcript} />;
  const insights = (
    <InsightsPanel
      sessionId={session.id}
      summary={session.summary}
      actionItems={items}
      onItemChange={handleItemChange}
      onItemDelete={handleItemDelete}
      onItemAdd={handleItemAdd}
    />
  );

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{session.title}</h1>
          <p className="text-sm text-slate-500">
            {new Date(session.createdAt).toLocaleString()}
            {duration && ` · ${duration}`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View mode toggle: Standard vs File System */}
          <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => handleViewModeChange("standard")}
              className={`rounded-md px-2.5 py-1 transition-colors ${
                viewMode === "standard"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Standard
            </button>
            <button
              type="button"
              onClick={() => handleViewModeChange("filesystem")}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 transition-colors ${
                viewMode === "filesystem"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>📁</span>
              File System
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50"
          >
            {copied ? "Copied!" : "Copy Notes"}
          </button>
          <button
            type="button"
            onClick={handleExportMd}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50"
          >
            Export .md
          </button>
          <button
            type="button"
            onClick={handleExportJson}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50"
          >
            Export JSON
          </button>

          {/* Delete session button */}
          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
              title="Delete this session"
            >
              Delete
            </button>
          ) : (
            <div className="flex items-center gap-1.5 rounded-lg border border-red-300 bg-red-50 p-1">
              <span className="text-xs text-red-700 pl-1 font-medium">Confirm?</span>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded bg-red-600 px-2 py-0.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "…" : "Yes, delete"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="rounded bg-white px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Render View Mode */}
      {viewMode === "filesystem" ? (
        <FileSystemView
          session={session}
          actionItems={items}
          audioBlob={audioBlob}
          audioUrl={audioUrl}
          onItemChange={handleItemChange}
          onItemDelete={handleItemDelete}
          onItemAdd={handleItemAdd}
          onExportMd={handleExportMd}
          onExportJson={handleExportJson}
        />
      ) : (
        <>
          {/* Mobile: tabs */}
          <div className="lg:hidden">
            <div className="mb-3 flex gap-1 rounded-lg bg-slate-100 p-1" role="tablist">
              {(["insights", "transcript"] as const).map((t) => (
                <button
                  key={t}
                  role="tab"
                  aria-selected={tab === t}
                  onClick={() => setTab(t)}
                  className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium capitalize ${
                    tab === t ? "bg-white text-slate-900 shadow-xs" : "text-slate-500"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            {tab === "insights" ? insights : transcript}
          </div>

          {/* Desktop: side by side */}
          <div className="hidden gap-6 lg:grid lg:grid-cols-2 lg:items-start">
            {transcript}
            {insights}
          </div>
        </>
      )}
    </div>
  );
}
