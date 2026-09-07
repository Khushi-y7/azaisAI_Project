// Tracks generations that are still processing, in localStorage, so the
// global toast watcher (mounted once in the root layout) can keep checking
// on them no matter what page the user is on, and even pick back up after
// a full page reload or reopening the tab later, since the server job
// itself keeps running independent of any open connection (see the video
// generate route's use of `after`).

const STORAGE_KEY = "azaisai_pending_generations";

export interface PendingGeneration {
  id: string;
  type: "video" | "image";
  startedAt: number;
}

export function getPendingGenerations(): PendingGeneration[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addPendingGeneration(entry: PendingGeneration) {
  if (typeof window === "undefined") return;
  try {
    const current = getPendingGenerations();
    if (current.some((g) => g.id === entry.id)) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...current, entry]));
  } catch {
    // localStorage can throw in private-browsing contexts - not worth failing over
  }
}

export function removePendingGeneration(id: string) {
  if (typeof window === "undefined") return;
  try {
    const current = getPendingGenerations();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current.filter((g) => g.id !== id)));
  } catch {
    // ignore
  }
}
