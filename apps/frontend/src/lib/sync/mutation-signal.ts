export const SYNC_MUTATION_QUEUED_EVENT = "unilife:sync-mutation-queued";

export function notifySyncMutationQueued() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(SYNC_MUTATION_QUEUED_EVENT));
}
