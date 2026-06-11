import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getPendingQueueItemsMock,
  getQueueSnapshotMock,
  handleQueueRequestFailureMock,
  hydrateAllMock,
  markHydrationSuccessMock,
  markQueueItemsSyncingMock,
  reconcileQueueResultsMock,
  resetSyncingQueueItemsMock,
} = vi.hoisted(() => ({
  getPendingQueueItemsMock: vi.fn(),
  getQueueSnapshotMock: vi.fn(),
  handleQueueRequestFailureMock: vi.fn(),
  hydrateAllMock: vi.fn(),
  markHydrationSuccessMock: vi.fn(),
  markQueueItemsSyncingMock: vi.fn(),
  reconcileQueueResultsMock: vi.fn(),
  resetSyncingQueueItemsMock: vi.fn(),
}));

vi.mock("@/lib/sync/hydration", () => ({
  hydrateAllEntities: hydrateAllMock,
  markHydrationSuccess: markHydrationSuccessMock,
}));

vi.mock("@/lib/sync/queue", async () => {
  const actual = await vi.importActual<typeof import("@/lib/sync/queue")>(
    "@/lib/sync/queue",
  );

  return {
    ...actual,
    getPendingQueueItems: getPendingQueueItemsMock,
    getQueueSnapshot: getQueueSnapshotMock,
    handleQueueRequestFailure: handleQueueRequestFailureMock,
    markQueueItemsSyncing: markQueueItemsSyncingMock,
    reconcileQueueResults: reconcileQueueResultsMock,
    resetSyncingQueueItems: resetSyncingQueueItemsMock,
  };
});

import { createSyncEngine } from "@/lib/sync/sync-engine";
import { buildFailureQueueUpdate } from "@/lib/sync/queue";

function createQueueItem(id: string, createdAt: string, retryCount = 0) {
  return {
    created_at: createdAt,
    entity_id: `entity-${id}`,
    entity_type: "assignment" as const,
    id,
    last_attempted_at: null,
    operation: "create" as const,
    payload: {
      created_at: createdAt,
      due_date: createdAt,
      title: `Assignment ${id}`,
      updated_at: createdAt,
    },
    retry_count: retryCount,
    status: "pending" as const,
    user_id: "user-1",
  };
}

function createWindowMock() {
  const listeners = new Map<string, Set<() => void>>();

  return {
    addEventListener: vi.fn((event: string, listener: () => void) => {
      const nextListeners = listeners.get(event) ?? new Set<() => void>();
      nextListeners.add(listener);
      listeners.set(event, nextListeners);
    }),
    dispatch(event: "offline" | "online") {
      for (const listener of listeners.get(event) ?? []) {
        listener();
      }
    },
    removeEventListener: vi.fn((event: string, listener: () => void) => {
      listeners.get(event)?.delete(listener);
    }),
  };
}

describe("sync engine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hydrateAllMock.mockResolvedValue(undefined);
    markHydrationSuccessMock.mockResolvedValue(undefined);
    getPendingQueueItemsMock.mockResolvedValue([]);
    getQueueSnapshotMock.mockResolvedValue({
      failedCount: 0,
      hasPendingWork: false,
    });
    handleQueueRequestFailureMock.mockResolvedValue({
      failedCount: 0,
      hasPendingWork: true,
    });
    markQueueItemsSyncingMock.mockResolvedValue(undefined);
    reconcileQueueResultsMock.mockResolvedValue({
      failedCount: 0,
      hasPendingWork: false,
    });
    resetSyncingQueueItemsMock.mockResolvedValue({
      failedCount: 0,
      hasPendingWork: false,
    });
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: { onLine: true },
    });
  });

  it("preserves oldest-first queue ordering when flushing", async () => {
    const queueItems = [
      createQueueItem("queue-1", "2026-06-01T08:00:00.000Z"),
      createQueueItem("queue-2", "2026-06-01T09:00:00.000Z"),
    ];
    const requestPush = vi.fn().mockResolvedValue({
      failed: [],
      synced: queueItems.map((item) => item.id),
    });
    getPendingQueueItemsMock.mockResolvedValue(queueItems);
    const engine = createSyncEngine({
      requestPush,
      userId: "user-1",
      windowRef: createWindowMock(),
    });

    await engine.flush();

    expect(requestPush).toHaveBeenCalledWith(queueItems);
  });

  it("reconciles mixed success and failure responses without skipping hydration", async () => {
    const queueItems = [
      createQueueItem("queue-1", "2026-06-01T08:00:00.000Z"),
      createQueueItem("queue-2", "2026-06-01T09:00:00.000Z"),
    ];
    const requestPush = vi.fn().mockResolvedValue({
      failed: ["queue-2"],
      synced: ["queue-1"],
    });
    getPendingQueueItemsMock.mockResolvedValue(queueItems);
    const engine = createSyncEngine({
      requestPush,
      userId: "user-1",
      windowRef: createWindowMock(),
    });

    await engine.flush();

    expect(reconcileQueueResultsMock).toHaveBeenCalledWith("user-1", queueItems, {
      failed: ["queue-2"],
      synced: ["queue-1"],
    });
    expect(hydrateAllMock).toHaveBeenCalled();
  });

  it("increments retries and marks failed at the configured limit", () => {
    expect(
      buildFailureQueueUpdate(createQueueItem("queue-1", "2026-06-01T08:00:00.000Z")),
    ).toMatchObject({
      retry_count: 1,
      status: "pending",
    });
    expect(
      buildFailureQueueUpdate(
        createQueueItem("queue-2", "2026-06-01T08:00:00.000Z", 2),
      ),
    ).toMatchObject({
      retry_count: 3,
      status: "failed",
    });
  });

  it("resets orphaned syncing items when the engine starts", async () => {
    const windowMock = createWindowMock();
    const engine = createSyncEngine({
      requestPush: vi.fn().mockResolvedValue({ failed: [], synced: [] }),
      userId: "user-1",
      windowRef: windowMock,
    });

    engine.start();
    await Promise.resolve();

    expect(resetSyncingQueueItemsMock).toHaveBeenCalledWith("user-1");
    engine.stop();
  });

  it("flushes automatically when the browser reconnects", async () => {
    const queueItems = [createQueueItem("queue-1", "2026-06-01T08:00:00.000Z")];
    const requestPush = vi.fn().mockResolvedValue({
      failed: [],
      synced: ["queue-1"],
    });
    const windowMock = createWindowMock();
    getPendingQueueItemsMock.mockResolvedValue(queueItems);
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: { onLine: false },
    });

    const engine = createSyncEngine({
      requestPush,
      userId: "user-1",
      windowRef: windowMock,
    });

    engine.start();
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: { onLine: true },
    });
    windowMock.dispatch("online");

    await vi.waitFor(() => {
      expect(requestPush).toHaveBeenCalled();
    });
    engine.stop();
  });

  it("requeues the whole batch when the push request fails", async () => {
    const queueItems = [createQueueItem("queue-1", "2026-06-01T08:00:00.000Z")];
    const requestPush = vi.fn().mockRejectedValue(new Error("network"));
    getPendingQueueItemsMock.mockResolvedValue(queueItems);
    const engine = createSyncEngine({
      requestPush,
      userId: "user-1",
      windowRef: createWindowMock(),
    });

    await engine.flush();

    expect(handleQueueRequestFailureMock).toHaveBeenCalledWith("user-1", queueItems);
  });
});
