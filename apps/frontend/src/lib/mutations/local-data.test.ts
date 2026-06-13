import { beforeEach, describe, expect, it, vi } from "vitest";

const { dbMock, notifySyncMutationQueuedMock } = vi.hoisted(() => ({
  dbMock: {
    assignments: { put: vi.fn() },
    budgets: { get: vi.fn(), put: vi.fn(), where: vi.fn() },
    classes: { get: vi.fn(), put: vi.fn(), where: vi.fn() },
    exams: { get: vi.fn(), put: vi.fn(), where: vi.fn() },
    expenses: { get: vi.fn(), put: vi.fn(), where: vi.fn() },
    notifications: {
      bulkDelete: vi.fn(),
      bulkPut: vi.fn(),
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          and: vi.fn(() => ({
            primaryKeys: vi.fn().mockResolvedValue([]),
            toArray: vi.fn().mockResolvedValue([]),
          })),
        })),
      })),
    },
    sync_queue: { delete: vi.fn(), put: vi.fn() },
    transaction: vi.fn(async (_mode: string, ...args: unknown[]) => {
      const callback = args[args.length - 1] as () => Promise<void>;
      await callback();
    }),
  },
  notifySyncMutationQueuedMock: vi.fn(),
}));

vi.mock("@/lib/db/dexie", () => ({
  db: dbMock,
}));

vi.mock("@/lib/session/current-user", () => ({
  getCurrentUserId: vi.fn(() => "user-1"),
  setCurrentUserId: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/sync/mutation-signal", () => ({
  notifySyncMutationQueued: notifySyncMutationQueuedMock,
}));

import {
  beginDeleteUndoLocal,
  createClassLocal,
  deleteExpenseLocal,
  finalizeDeleteUndoLocal,
  undoDeleteUndoLocal,
} from "@/lib/mutations/local-data";

describe("local data mutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.classes.get.mockResolvedValue(null);
    dbMock.expenses.get.mockResolvedValue(null);
  });

  it("writes the class record and queue item in one transaction", async () => {
    await createClassLocal({
      color: "blue",
      dayIndex: 0,
      dayOfWeek: "monday",
      endTime: "09:00",
      instructor: "Prof. Ada",
      room: "Room 101",
      startTime: "08:00",
      subject: "Math 101",
    });

    expect(dbMock.transaction).toHaveBeenCalled();
    expect(dbMock.classes.put).toHaveBeenCalledTimes(1);
    expect(dbMock.sync_queue.put).toHaveBeenCalledTimes(1);
    expect(notifySyncMutationQueuedMock).toHaveBeenCalledTimes(1);
  });

  it("soft deletes an expense locally before queueing the delete", async () => {
    dbMock.expenses.get.mockResolvedValue({
      amount: 85,
      budget_id: "budget-1",
      category: "food",
      created_at: "2026-06-08T12:30:00.000Z",
      deleted_at: null,
      description: "Lunch",
      id: "expense-1",
      spent_at: "2026-06-08T12:30:00.000Z",
      updated_at: "2026-06-08T12:30:00.000Z",
      user_id: "user-1",
    });

    const deleted = await deleteExpenseLocal("expense-1");

    expect(deleted).toBe(true);
    expect(dbMock.expenses.put).toHaveBeenCalledWith(
      expect.objectContaining({
        deleted_at: expect.any(String),
      }),
    );
    expect(dbMock.sync_queue.put).toHaveBeenCalledWith(
      expect.objectContaining({
        entity_id: "expense-1",
        operation: "delete",
      }),
    );
  });

  it("defers queueing until the undo window expires", async () => {
    dbMock.exams.get.mockResolvedValue({
      class_id: null,
      created_at: "2026-06-08T12:30:00.000Z",
      deleted_at: null,
      description: null,
      exam_date: "2026-06-12T12:30:00.000Z",
      id: "exam-1",
      location: null,
      title: "Midterm",
      updated_at: "2026-06-08T12:30:00.000Z",
      user_id: "user-1",
    });

    const operation = await beginDeleteUndoLocal("exam", "exam-1");

    expect(operation).not.toBeNull();
    expect(dbMock.exams.put).toHaveBeenCalledWith(
      expect.objectContaining({
        deleted_at: expect.any(String),
      }),
    );
    expect(dbMock.sync_queue.put).not.toHaveBeenCalled();

    dbMock.exams.get.mockResolvedValue({
      class_id: null,
      created_at: "2026-06-08T12:30:00.000Z",
      deleted_at: operation?.deletedAt ?? null,
      description: null,
      exam_date: "2026-06-12T12:30:00.000Z",
      id: "exam-1",
      location: null,
      title: "Midterm",
      updated_at: operation?.deletedAt ?? "2026-06-08T12:30:00.000Z",
      user_id: "user-1",
    });

    await finalizeDeleteUndoLocal(operation!);

    expect(dbMock.sync_queue.put).toHaveBeenCalledWith(
      expect.objectContaining({
        entity_id: "exam-1",
        mutation_meta: expect.objectContaining({
          intent: "delete",
        }),
      }),
    );
  });

  it("restores the same entity when delete undo is triggered", async () => {
    dbMock.exams.get.mockResolvedValue({
      class_id: null,
      created_at: "2026-06-08T12:30:00.000Z",
      deleted_at: null,
      description: null,
      exam_date: "2026-06-12T12:30:00.000Z",
      id: "exam-2",
      location: null,
      title: "Finals",
      updated_at: "2026-06-08T12:30:00.000Z",
      user_id: "user-1",
    });

    const operation = await beginDeleteUndoLocal("exam", "exam-2");
    dbMock.exams.get.mockResolvedValue({
      class_id: null,
      created_at: "2026-06-08T12:30:00.000Z",
      deleted_at: operation?.deletedAt ?? null,
      description: null,
      exam_date: "2026-06-12T12:30:00.000Z",
      id: "exam-2",
      location: null,
      title: "Finals",
      updated_at: "2026-06-08T12:30:00.000Z",
      user_id: "user-1",
    });

    const restored = await undoDeleteUndoLocal(operation!);

    expect(restored).toBe(true);
    expect(dbMock.exams.put).toHaveBeenLastCalledWith(
      expect.objectContaining({
        deleted_at: null,
        id: "exam-2",
      }),
    );
    expect(dbMock.sync_queue.delete).toHaveBeenCalledWith(operation!.queueItemId);
  });
});
