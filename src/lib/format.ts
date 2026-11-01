import type { Priority } from "./types";

/**
 * Format seconds into MM:SS format.
 * Canonical implementation used across Recorder, AudioPlayer, and transcript timestamps.
 */
export function formatTime(sec: number): string {
  if (isNaN(sec) || sec < 0) return "00:00";
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

/**
 * Format duration into human-readable format like "1m 30s" or "45s".
 */
export function formatDuration(sec: number | null | undefined): string | null {
  if (sec === null || sec === undefined || isNaN(sec) || sec < 0) return null;
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

/**
 * Priority badge styling classes.
 */
export const PRIORITY_STYLES: Record<string, string> = {
  High: "bg-red-100 text-red-700",
  Medium: "bg-amber-100 text-amber-700",
  Low: "bg-slate-100 text-slate-600",
};

export function getPriorityStyle(priority?: Priority | string | null): string {
  if (!priority) return PRIORITY_STYLES.Low;
  return PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.Low;
}

