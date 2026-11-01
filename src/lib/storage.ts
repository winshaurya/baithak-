import type {
  SessionDTO,
  SessionListItem,
  ActionItemDTO,
} from "./types";

export type AudioDraft = {
  id: string;
  blob: Blob;
  durationSec: number | null;
  createdAt: string;
  title?: string;
  status: "captured" | "processing" | "failed" | "completed";
  error?: string;
};

export type LocalStoredSession = SessionDTO & {
  audioBlob?: Blob;
  audioMime?: string;
};

const DB_NAME = "baithak_db";
const DB_VERSION = 1;
const DRAFTS_STORE = "drafts";
const SESSIONS_STORE = "sessions";

function isIndexedDBAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.indexedDB !== "undefined";
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isIndexedDBAvailable()) {
      return reject(new Error("IndexedDB is not available in this environment."));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(DRAFTS_STORE)) {
        db.createObjectStore(DRAFTS_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(SESSIONS_STORE)) {
        db.createObjectStore(SESSIONS_STORE, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function runTx<T>(
  storeName: string,
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => IDBRequest<T> | void,
): Promise<T> {
  return openDB().then((db) => {
    return new Promise<T>((resolve, reject) => {
      try {
        const tx = db.transaction(storeName, mode);
        const store = tx.objectStore(storeName);
        const req = callback(store);

        tx.oncomplete = () => {
          if (req && "result" in req) {
            resolve(req.result);
          } else {
            resolve(undefined as unknown as T);
          }
        };

        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      } catch (err) {
        reject(err);
      }
    });
  });
}

// -------------------------------------------------------------
// Audio Draft Operations (Zero Data Loss & Retries)
// -------------------------------------------------------------

export async function saveDraft(input: {
  id?: string;
  blob: Blob;
  durationSec: number | null;
  title?: string;
  status?: AudioDraft["status"];
  error?: string;
}): Promise<string> {
  if (!isIndexedDBAvailable()) return input.id || String(Date.now());

  const draft: AudioDraft = {
    id: input.id || `draft_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    blob: input.blob,
    durationSec: input.durationSec,
    createdAt: new Date().toISOString(),
    title: input.title,
    status: input.status || "captured",
    error: input.error,
  };

  await runTx(DRAFTS_STORE, "readwrite", (store) => {
    store.put(draft);
  });

  return draft.id;
}

export async function getDraft(id: string): Promise<AudioDraft | null> {
  if (!isIndexedDBAvailable()) return null;
  return runTx<AudioDraft | undefined>(DRAFTS_STORE, "readonly", (store) => {
    return store.get(id);
  }).then((res) => res ?? null);
}

export async function listDrafts(): Promise<AudioDraft[]> {
  if (!isIndexedDBAvailable()) return [];
  return runTx<AudioDraft[]>(DRAFTS_STORE, "readonly", (store) => {
    return store.getAll();
  }).then((items) => (items || []).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
}

export async function deleteDraft(id: string): Promise<void> {
  if (!isIndexedDBAvailable()) return;
  await runTx(DRAFTS_STORE, "readwrite", (store) => {
    store.delete(id);
  });
}

// -------------------------------------------------------------
// Client-Side Session Storage (Session-Wise & File-System Backed)
// -------------------------------------------------------------

export async function saveLocalSession(
  session: SessionDTO,
  audioBlob?: Blob,
  audioMime?: string,
): Promise<void> {
  if (!isIndexedDBAvailable()) return;

  // If session already exists locally with an audioBlob and none was provided here, preserve existing audio
  let existingAudioBlob = audioBlob;
  let existingAudioMime = audioMime;
  if (!existingAudioBlob) {
    const existing = await getLocalSession(session.id);
    if (existing?.audioBlob) {
      existingAudioBlob = existing.audioBlob;
      existingAudioMime = existing.audioMime;
    }
  }

  const record: LocalStoredSession = {
    ...session,
    audioBlob: existingAudioBlob,
    audioMime: existingAudioMime,
  };

  await runTx(SESSIONS_STORE, "readwrite", (store) => {
    store.put(record);
  });
}

export async function getLocalSession(id: string): Promise<LocalStoredSession | null> {
  if (!isIndexedDBAvailable()) return null;
  return runTx<LocalStoredSession | undefined>(SESSIONS_STORE, "readonly", (store) => {
    return store.get(id);
  }).then((res) => res ?? null);
}

export async function listLocalSessions(): Promise<SessionListItem[]> {
  if (!isIndexedDBAvailable()) return [];
  return runTx<LocalStoredSession[]>(SESSIONS_STORE, "readonly", (store) => {
    return store.getAll();
  }).then((items) =>
    (items || [])
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((s) => ({
        id: s.id,
        title: s.title,
        createdAt: s.createdAt,
        durationSec: s.durationSec,
        actionItemCount: s.actionItems?.length || 0,
      })),
  );
}

export async function deleteLocalSession(id: string): Promise<void> {
  if (!isIndexedDBAvailable()) return;
  await runTx(SESSIONS_STORE, "readwrite", (store) => {
    store.delete(id);
  });
}

export async function updateLocalActionItem(
  sessionId: string,
  updated: ActionItemDTO,
): Promise<void> {
  if (!isIndexedDBAvailable()) return;
  const session = await getLocalSession(sessionId);
  if (!session) return;
  const nextActions = session.actionItems.map((a) => (a.id === updated.id ? updated : a));
  session.actionItems = nextActions;
  await saveLocalSession(session, session.audioBlob, session.audioMime);
}

