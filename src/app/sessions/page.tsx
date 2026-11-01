"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listSessions, deleteSession } from "@/lib/api";
import { listLocalSessions, deleteLocalSession } from "@/lib/storage";
import type { SessionListItem } from "@/lib/types";

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      try {
        // Fetch from server and client storage in parallel
        const [serverItems, localItems] = await Promise.all([
          listSessions().catch(() => [] as SessionListItem[]),
          listLocalSessions().catch(() => [] as SessionListItem[]),
        ]);

        if (cancelled) return;

        // Merge by session ID, giving priority to server data but preserving client-only sessions
        const map = new Map<string, SessionListItem>();
        for (const item of localItems) {
          map.set(item.id, item);
        }
        for (const item of serverItems) {
          map.set(item.id, item);
        }

        const merged = Array.from(map.values()).sort((a, b) =>
          b.createdAt.localeCompare(a.createdAt),
        );
        setSessions(merged);
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load sessions.");
        }
      }
    }

    void loadAll();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDeletingId(id);
    try {
      await deleteLocalSession(id).catch(() => {});
      await deleteSession(id).catch(() => {});
      setSessions((prev) => (prev ? prev.filter((s) => s.id !== id) : []));
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
      setConfirmId(null);
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <nav className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">History</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Sessions saved across server and browser storage
          </p>
        </div>
        <Link
          href="/"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          New session
        </Link>
      </nav>

      {error ? (
        <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      ) : sessions === null ? (
        <div className="space-y-3" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
          No sessions yet.{" "}
          <Link href="/" className="font-medium text-slate-900 underline">
            Record your first one
          </Link>
          .
        </div>
      ) : (
        <ul className="space-y-3">
          {sessions.map((s) => (
            <li key={s.id} className="relative group">
              <Link
                href={`/sessions/${s.id}`}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-400 transition-colors"
              >
                <div className="min-w-0 pr-4">
                  <p className="truncate text-sm font-medium text-slate-900">{s.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {new Date(s.createdAt).toLocaleString()}
                    {s.durationSec ? ` · ${Math.round(s.durationSec)}s` : ""}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                    {s.actionItemCount} {s.actionItemCount === 1 ? "task" : "tasks"}
                  </span>

                  {confirmId === s.id ? (
                    <div
                      className="flex items-center gap-1.5"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    >
                      <button
                        type="button"
                        onClick={(e) => handleDelete(s.id, e)}
                        disabled={deletingId === s.id}
                        className="rounded bg-red-600 px-2 py-1 text-2xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        {deletingId === s.id ? "…" : "Delete"}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setConfirmId(null);
                        }}
                        className="rounded border border-slate-200 bg-white px-2 py-1 text-2xs text-slate-600 hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setConfirmId(s.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 p-1 rounded transition-opacity"
                      title="Delete session"
                      aria-label={`Delete ${s.title}`}
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
