import { describe, it, expect } from "vitest";
import { analysisSchema } from "./schema";
import {
  SAMPLE_SUMMARY,
  SAMPLE_ACTION_ITEMS,
  SAMPLE_TRANSCRIPT,
  STANDUP_SAMPLE,
  getSampleFixture,
} from "./sample";

// The sample session is seeded straight into the store, so it never passes
// through the AI schema at runtime. This test is the guard that keeps the
// fixture in lockstep with the real contract anyway.
describe("sample fixture", () => {
  it("conforms to the analysis schema", () => {
    const r = analysisSchema.safeParse({
      summary: SAMPLE_SUMMARY,
      actionItems: SAMPLE_ACTION_ITEMS,
    });
    expect(r.success).toBe(true);
  });

  it("has a non-trivial transcript and some action items", () => {
    expect(SAMPLE_TRANSCRIPT.length).toBeGreaterThan(100);
    expect(SAMPLE_ACTION_ITEMS.length).toBeGreaterThan(0);
  });

  it("validates the engineering standup fixture", () => {
    const r = analysisSchema.safeParse({
      summary: STANDUP_SAMPLE.summary,
      actionItems: STANDUP_SAMPLE.actionItems,
    });
    expect(r.success).toBe(true);
    expect(STANDUP_SAMPLE.transcript.length).toBeGreaterThan(50);
  });

  it("resolves sample fixtures by id correctly", () => {
    expect(getSampleFixture("standup").title).toContain("Engineering Daily Standup");
    expect(getSampleFixture("product_launch").title).toContain("Product Launch Sync");
  });
});
