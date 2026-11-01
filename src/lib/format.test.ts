import { describe, it, expect } from "vitest";
import { formatTime, formatDuration, getPriorityStyle } from "./format";

describe("formatTime", () => {
  it("formats standard seconds correctly", () => {
    expect(formatTime(0)).toBe("00:00");
    expect(formatTime(9)).toBe("00:09");
    expect(formatTime(65)).toBe("01:05");
    expect(formatTime(3600)).toBe("60:00");
  });

  it("handles negative and NaN values gracefully", () => {
    expect(formatTime(-5)).toBe("00:00");
    expect(formatTime(NaN)).toBe("00:00");
  });
});

describe("formatDuration", () => {
  it("formats seconds under a minute", () => {
    expect(formatDuration(45)).toBe("45s");
    expect(formatDuration(0)).toBe("0s");
  });

  it("formats minutes and seconds", () => {
    expect(formatDuration(90)).toBe("1m 30s");
    expect(formatDuration(125)).toBe("2m 5s");
  });

  it("returns null for null, undefined, or negative values", () => {
    expect(formatDuration(null)).toBeNull();
    expect(formatDuration(undefined)).toBeNull();
    expect(formatDuration(-10)).toBeNull();
  });
});

describe("getPriorityStyle", () => {
  it("returns correct CSS classes for known priorities", () => {
    expect(getPriorityStyle("High")).toContain("bg-red-100");
    expect(getPriorityStyle("Medium")).toContain("bg-amber-100");
    expect(getPriorityStyle("Low")).toContain("bg-slate-100");
  });

  it("defaults to Low styling for unknown or null priorities", () => {
    expect(getPriorityStyle(null)).toContain("bg-slate-100");
    expect(getPriorityStyle("Unknown")).toContain("bg-slate-100");
  });
});

