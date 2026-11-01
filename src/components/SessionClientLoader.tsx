"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Dashboard from "./Dashboard";
import { getLocalSession } from "@/lib/storage";
import type { SessionDTO } from "@/lib/types";

type Props = {
  sessionId: string;
  initialSession: SessionDTO | null;
};

export default function SessionClientLoader({
  sessionId,
  initialSession,
}: Props) {
  const [session, setSession] = useState<SessionDTO | null>(initialSession);
  const [loading, setLoading] = useState(!initialSession);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!session) {
      getLocalSession(sessionId)
        .then((local) => {
          if (local) {
            setSession(local);
          } else {
            setNotFound(true);
          }
        })
        .catch(() => {
          setNotFound(true);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [sessionId, session]);

  if (loading) {
    return (
      <div className="space-y-4 max-w-xl mx-auto py-12" aria-busy="true">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-100" />
        <div className="h-64 animate-pulse rounded-xl bg-slate-100" />
      </div>
    );
  }

  if (notFound || !session) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center">
        <p className="text-3xl mb-2">🔍</p>
        <h2 className="text-lg font-semibold text-slate-800">Session Not Found</h2>
        <p className="text-sm text-slate-500 mt-1 mb-4">
          This session does not exist on the server or in your browser storage.
        </p>
        <Link
          href="/sessions"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Return to History
        </Link>
      </div>
    );
  }

  return <Dashboard session={session} />;
}

