import type { NewActionItem } from "./db";
import type { SummaryTopic } from "./types";

// Realistic, pre-baked sessions so the dashboard, history and action-item
// editing can be explored with zero API keys. This is clearly-labelled SAMPLE
// data: it is seeded straight into the store and never claims the live AI ran.
// The real transcribe/analyze path is untouched and still needs real keys.

// Sample 1: Product Launch Sync (matching product_launch_sync.m4a)
export const SAMPLE_TITLE = "Sample: Product Launch Sync";
export const SAMPLE_DURATION_SEC = 20;

export const SAMPLE_TRANSCRIPT = `[00:01] Speaker 1: Quick check on the launch. Any blockers?
[00:04] Speaker 2: The API side is ready, but we need final email copy.
[00:09] Speaker 1: Sundar owns this copy. I will make sure
[00:14] Speaker 1: I will make sure we have it by Thursday.
[00:17] Speaker 1: Let's make sure the database migration runs Saturday morning.`;

export const SAMPLE_SUMMARY: SummaryTopic[] = [
  {
    topic: "Launch readiness and email copy",
    points: [
      "The API side is fully ready for the upcoming launch.",
      "Launch execution is blocked waiting on final onboarding email copy owned by Sundar.",
      "Speaker 1 confirmed ownership to follow up and deliver copy by Thursday.",
    ],
  },
  {
    topic: "Database migration scheduling",
    points: [
      "Database migration must run prior to product launch.",
      "Migration scheduled for off-peak execution on Saturday morning.",
    ],
  },
];

export const SAMPLE_ACTION_ITEMS: NewActionItem[] = [
  {
    task: "Follow up with Sundar to obtain final email copy",
    assignee: "Speaker 1",
    dueDate: "by Thursday",
    priority: "High",
  },
  {
    task: "Deliver final email copy for launch templates",
    assignee: "Sundar",
    dueDate: "by Thursday",
    priority: "High",
  },
  {
    task: "Execute database migration off-peak",
    assignee: "Unassigned",
    dueDate: "Saturday morning",
    priority: "High",
  },
];

// Sample 2: Engineering Daily Standup (matching engineering_standup.m4a)
export const STANDUP_SAMPLE = {
  title: "Sample: Engineering Daily Standup",
  durationSec: 16,
  transcript: `[00:00] Speaker 1: Good morning team. Let's do our daily standup.
[00:03] Speaker 1: Rohan, how is the authentication bug?
[00:06] Speaker 2: I reproduce the auth token refresh issue. I will submit a pull request by this afternoon.
[00:13] Speaker 1: Perfect. I will review it before tomorrow morning.`,
  summary: [
    {
      topic: "Authentication bug investigation",
      points: [
        "Rohan successfully reproduced the auth token refresh bug.",
        "Fix will be packaged into a pull request by this afternoon.",
      ],
    },
    {
      topic: "Code review and release readiness",
      points: [
        "Speaker 1 will review Rohan's pull request before tomorrow morning.",
      ],
    },
  ],
  actionItems: [
    {
      task: "Submit pull request for auth token refresh fix",
      assignee: "Rohan",
      dueDate: "this afternoon",
      priority: "High",
    },
    {
      task: "Review Rohan's auth token pull request",
      assignee: "Speaker 1",
      dueDate: "before tomorrow morning",
      priority: "Medium",
    },
  ] as NewActionItem[],
};

export function getSampleFixture(sampleId?: string) {
  if (sampleId === "standup" || sampleId === "engineering_standup") {
    return STANDUP_SAMPLE;
  }
  return {
    title: SAMPLE_TITLE,
    durationSec: SAMPLE_DURATION_SEC,
    transcript: SAMPLE_TRANSCRIPT,
    summary: SAMPLE_SUMMARY,
    actionItems: SAMPLE_ACTION_ITEMS,
  };
}
