import { beforeEach, describe, expect, it, vi } from "vitest";

const { dbMock } = vi.hoisted(() => ({
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
    sync_queue: { put: vi.fn() },
    transaction: vi.fn(async (_mode: string, ...args: unknown[]) => {
      const callback = args[args.length - 1] as () => Promise<void>;
      await callback();
    }),
  },
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

import { createClassLocal, deleteExpenseLocal } from "@/lib/mutations/local-data";

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
});
