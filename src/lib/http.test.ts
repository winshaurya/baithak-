import { describe, it, expect } from "vitest";
import { mapAiError } from "./http";

// mapAiError is what turns an opaque provider failure into the right status the
// client branches on, so each class gets a case.

async function body(res: Response) {
  return (await res.json()) as { error: string };
}

describe("mapAiError", () => {
  it("maps rate-limit language to 429", async () => {
    for (const m of ["Rate limit exceeded", "got a 429", "quota reached"]) {
      const res = mapAiError(new Error(m));
      expect(res.status).toBe(429);
      expect((await body(res)).error).toMatch(/rate limited/i);
    }
  });

  it("maps auth/key failures to 500", async () => {
    for (const m of ["invalid api key", "401 Unauthorized", "permission denied"]) {
      const res = mapAiError(new Error(m));
      expect(res.status).toBe(500);
    }
  });

  it("maps auth/key failures to 401 when using client BYOK keys", async () => {
    const res = mapAiError(new Error("invalid api key"), true);
    expect(res.status).toBe(401);
    expect((await body(res)).error).toMatch(/key settings/i);
  });

  it("falls back to 502 for anything else", async () => {
    const res = mapAiError(new Error("socket hang up"));
    expect(res.status).toBe(502);
  });

  it("handles a non-Error value", () => {
    const res = mapAiError("boom");
    expect(res.status).toBe(502);
  });
});
