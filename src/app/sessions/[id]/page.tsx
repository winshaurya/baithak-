import Link from "next/link";
import SessionClientLoader from "@/components/SessionClientLoader";
import { getSession } from "@/lib/db";

export const instant = false;

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession(id);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <nav className="mb-6">
        <Link
          href="/sessions"
          className="text-sm text-slate-600 hover:text-slate-900"
        >
          ← History
        </Link>
      </nav>
      <SessionClientLoader sessionId={id} initialSession={session} />
    </main>
  );
}
