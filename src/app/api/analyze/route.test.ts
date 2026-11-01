import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/ai", () => ({
  analyzeTranscript: vi.fn(),
}));

import { POST } from "./route";
import { analyzeTranscript } from "@/lib/ai";

const mockedAnalyze = vi.mocked(analyzeTranscript);

function reqWith(body: unknown, headers?: Record<string, string>) {
  return new Request("http://localhost/api/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

beforeEach(() => {
  mockedAnalyze.mockReset();
});

describe("POST /api/analyze validation", () => {
  it("400 for empty transcript", async () => {
    const res = await POST(reqWith({ transcript: "" }));
    expect(res.status).toBe(400);
    expect(mockedAnalyze).not.toHaveBeenCalled();
  });

  it("400 for invalid json", async () => {
    const res = await POST(reqWith("invalid json string"));
    expect(res.status).toBe(400);
    expect(mockedAnalyze).not.toHaveBeenCalled();
  });
});

describe("POST /api/analyze execution", () => {
  it("201 on successful analysis and session creation", async () => {
    mockedAnalyze.mockResolvedValue({
      summary: [{ topic: "Sprint Review", points: ["Discussed tickets."] }],
      actionItems: [
        {
          task: "Deploy update",
          assignee: "Alice",
          dueDate: "Friday",
          priority: "High",
        },
      ],
    });

    const res = await POST(
      reqWith({
        transcript: "Alice will deploy the update on Friday.",
        title: "Team Sync",
        durationSec: 120,
      }),
    );

    expect(res.status).toBe(201);
    const json = (await res.json()) as { id: string; title: string; actionItems: unknown[] };
    expect(json.id).toBeDefined();
    expect(json.title).toBe("Team Sync");
    expect(json.actionItems).toHaveLength(1);
  });

  it("maps rate limits to 429", async () => {
    mockedAnalyze.mockRejectedValue(new Error("rate limit exceeded (429)"));
    const res = await POST(reqWith({ transcript: "Some meeting transcript" }));
    expect(res.status).toBe(429);
  });
});

