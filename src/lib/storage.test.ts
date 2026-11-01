import { describe, it, expect } from "vitest";
import {
  saveDraft,
  getDraft,
  listDrafts,
  deleteDraft,
  saveLocalSession,
  getLocalSession,
  listLocalSessions,
  deleteLocalSession,
} from "./storage";

describe("storage SSR fallback", () => {
  it("safely handles saveDraft without throwing in Node environment", async () => {
    const dummyBlob = new Blob(["test"], { type: "text/plain" });
    const id = await saveDraft({
      blob: dummyBlob,
      durationSec: 10,
      title: "Test Draft",
    });
    expect(id).toBeDefined();
  });

  it("returns null/empty lists when indexedDB is undefined", async () => {
    expect(await getDraft("dummy")).toBeNull();
    expect(await listDrafts()).toEqual([]);
    await expect(deleteDraft("dummy")).resolves.toBeUndefined();

    expect(await getLocalSession("dummy")).toBeNull();
    expect(await listLocalSessions()).toEqual([]);
    await expect(deleteLocalSession("dummy")).resolves.toBeUndefined();
  });

  it("handles saveLocalSession gracefully", async () => {
    await expect(
      saveLocalSession({
        id: "s1",
        title: "Test Session",
        createdAt: new Date().toISOString(),
        transcript: "Hello world",
        durationSec: 20,
        summary: [],
        actionItems: [],
      }),
    ).resolves.toBeUndefined();
  });
});

