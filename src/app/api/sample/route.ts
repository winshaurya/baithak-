import { createSession } from "@/lib/db";
import { getSampleFixture } from "@/lib/sample";

// Seeds one clearly-labelled sample session so the app is explorable without
// API keys. It only writes fixture data to the store; it does not call the AI.
export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sampleId = searchParams.get("id") || undefined;
    const fixture = getSampleFixture(sampleId);

    const session = await createSession({
      title: fixture.title,
      transcript: fixture.transcript,
      summary: fixture.summary,
      durationSec: fixture.durationSec,
      actionItems: fixture.actionItems,
    });
    return Response.json(session, { status: 201 });
  } catch (err) {
    console.error("Error in POST /api/sample:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to seed sample session." },
      { status: 500 },
    );
  }
}
