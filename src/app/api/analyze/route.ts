import { analyzeTranscript } from "@/lib/ai";
import { createSession } from "@/lib/db";
import { mapAiError } from "@/lib/http";
import { parseKeys } from "@/lib/failover";

export const maxDuration = 60;

function defaultTitle(): string {
  return `Session ${new Date().toLocaleString()}`;
}

export async function POST(req: Request) {
  try {
    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return Response.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const transcript =
      typeof body.transcript === "string" ? body.transcript.trim() : "";
    if (!transcript) {
      return Response.json({ error: "transcript is required." }, { status: 400 });
    }

    const title =
      typeof body.title === "string" && body.title.trim()
        ? body.title.trim()
        : defaultTitle();
    const durationSec =
      typeof body.durationSec === "number" ? Math.round(body.durationSec) : null;

    const keys = parseKeys(req.headers.get("x-google-key"));

    let analysis;
    try {
      analysis = await analyzeTranscript(transcript, { keys });
    } catch (err) {
      return mapAiError(err, keys.length > 0);
    }

    const actionItems = Array.isArray(analysis?.actionItems)
      ? analysis.actionItems.map((a) => ({
          task: a.task,
          assignee: a.assignee,
          dueDate: a.dueDate,
          priority: a.priority,
        }))
      : [];

    const summary = Array.isArray(analysis?.summary) ? analysis.summary : [];

    const session = await createSession({
      title,
      transcript,
      summary,
      durationSec,
      actionItems,
    });

    return Response.json(session, { status: 201 });
  } catch (err) {
    console.error("Unhandled error in POST /api/analyze:", err);
    return mapAiError(err);
  }
}
