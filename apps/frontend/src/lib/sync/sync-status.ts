export type SyncPhase = "idle" | "syncing" | "synced" | "failed";

export type SyncStatusState = {
  failedCount: number;
  hasPendingWork: boolean;
  isOnline: boolean;
  lastSyncedAt: string | null;
  phase: SyncPhase;
  ready: boolean;
};

const listeners = new Set<() => void>();

let state: SyncStatusState = {
  failedCount: 0,
  hasPendingWork: false,
  isOnline: true,
  lastSyncedAt: null,
  phase: "idle",
  ready: false,
};

export function getSyncStatusState() {
  return state;
}

export function setSyncStatusState(
  nextState:
    | Partial<SyncStatusState>
    | ((current: SyncStatusState) => SyncStatusState),
) {
  state =
    typeof nextState === "function"
      ? nextState(state)
      : {
          ...state,
          ...nextState,
        };

  for (const listener of listeners) {
    listener();
  }
}

export function subscribeSyncStatus(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}
