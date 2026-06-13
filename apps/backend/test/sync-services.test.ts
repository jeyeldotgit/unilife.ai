import { describe, expect, it, vi } from "vitest";

import { SyncService } from "../src/services/sync.service.js";

describe("sync service", () => {
  it("syncs AI action history through the authenticated user scope", async () => {
    const upsert = vi.fn();
    const service = new SyncService({} as never, "user-1", {
      aiActionsRepository: { upsert } as never,
    });
    const timestamp = "2026-06-13T00:00:00.000Z";

    const result = await service.push([
      {
        id: "11111111-1111-4111-8111-111111111111",
        entity_type: "ai_action",
        entity_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        operation: "create",
        payload: {
          proposal: { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" },
          status: "proposed",
          processing_layer: "local",
          created_at: timestamp,
          updated_at: timestamp,
        },
      },
    ]);

    expect(result.failed).toEqual([]);
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        user_id: "user-1",
        status: "proposed",
      }),
    );
  });

  it("processes mixed batches independently and does not abort after a failed item", async () => {
    const updateClass = vi
      .fn()
      .mockResolvedValueOnce({ status: "stale" })
      .mockResolvedValueOnce({ status: "updated", record: { id: "class-2" } });
    const service = new SyncService({} as never, "user-1", {
      classesService: {
        updateClass,
        deleteClass: vi.fn(),
      } as never,
    });

    const result = await service.push([
      {
        id: "11111111-1111-4111-8111-111111111111",
        entity_type: "class",
        entity_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        operation: "update",
        payload: {
          updated_at: "2026-06-05T08:00:00.000Z",
          subject: "Physics",
        },
      },
      {
        id: "22222222-2222-4222-8222-222222222222",
        entity_type: "expense",
        entity_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        operation: "update",
        payload: {
          updated_at: "2026-06-05T08:30:00.000Z",
        },
      },
      {
        id: "33333333-3333-4333-8333-333333333333",
        entity_type: "class",
        entity_id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
        operation: "update",
        payload: {
          updated_at: "2026-06-05T09:00:00.000Z",
          room: "Lab 2",
        },
      },
    ]);

    expect(result).toEqual({
      synced: [
        "11111111-1111-4111-8111-111111111111",
        "33333333-3333-4333-8333-333333333333",
      ],
      failed: ["22222222-2222-4222-8222-222222222222"],
    });
    expect(updateClass).toHaveBeenCalledTimes(2);
  });

  it("marks stale create conflicts as synced without overwriting the newer server row", async () => {
    const upsert = vi.fn();
    const service = new SyncService({} as never, "user-1", {
      assignmentsRepository: {
        findByIdIncludingDeletedForUser: vi.fn(async () => ({
          id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          user_id: "user-1",
          class_id: null,
          title: "Server copy",
          description: null,
          due_date: "2026-06-10T08:00:00.000Z",
          status: "pending",
          priority: 1,
          recurrence: null,
          created_at: "2026-06-01T08:00:00.000Z",
          updated_at: "2026-06-06T09:00:00.000Z",
          deleted_at: null,
        })),
        existsForOtherUserIncludingDeleted: vi.fn(),
        upsert,
      } as never,
    });

    const result = await service.push([
      {
        id: "11111111-1111-4111-8111-111111111111",
        entity_type: "assignment",
        entity_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        operation: "create",
        payload: {
          id: "ignored-client-id",
          user_id: "user-2",
          title: "Offline copy",
          due_date: "2026-06-10T08:00:00.000Z",
          created_at: "2026-06-01T08:00:00.000Z",
          updated_at: "2026-06-05T09:00:00.000Z",
        },
      },
    ]);

    expect(result).toEqual({
      synced: ["11111111-1111-4111-8111-111111111111"],
      failed: [],
    });
    expect(upsert).not.toHaveBeenCalled();
  });

  it("revives soft-deleted rows and overwrites payload user_id with the authenticated user", async () => {
    const upsert = vi.fn(async (record) => record);
    const service = new SyncService({} as never, "user-1", {
      classesRepository: {
        findByIdIncludingDeletedForUser: vi.fn(async () => ({
          id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          user_id: "user-1",
          subject: "Old subject",
          room: null,
          instructor: null,
          day_of_week: "monday",
          start_time: "08:00",
          end_time: "09:00",
          color: null,
          is_active: true,
          recurrence: null,
          created_at: "2026-06-01T08:00:00.000Z",
          updated_at: "2026-06-05T08:00:00.000Z",
          deleted_at: "2026-06-05T12:00:00.000Z",
        })),
        existsForOtherUserIncludingDeleted: vi.fn(async () => false),
        upsert,
      } as never,
    });

    const result = await service.push([
      {
        id: "11111111-1111-4111-8111-111111111111",
        entity_type: "class",
        entity_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        operation: "create",
        payload: {
          user_id: "user-2",
          subject: "Revived subject",
          day_of_week: "friday",
          start_time: "10:00",
          end_time: "11:00",
          created_at: "2026-06-01T08:00:00.000Z",
          updated_at: "2026-06-06T08:00:00.000Z",
        },
      },
    ]);

    expect(result).toEqual({
      synced: ["11111111-1111-4111-8111-111111111111"],
      failed: [],
    });
    expect(upsert).toHaveBeenCalledWith({
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      user_id: "user-1",
      subject: "Revived subject",
      room: null,
      instructor: null,
      day_of_week: "friday",
      start_time: "10:00",
      end_time: "11:00",
      color: null,
      is_active: true,
      recurrence: null,
      created_at: "2026-06-01T08:00:00.000Z",
      updated_at: "2026-06-06T08:00:00.000Z",
      deleted_at: null,
    });
  });

  it("fails update items whose payload is missing updated_at", async () => {
    const updateExam = vi.fn();
    const service = new SyncService({} as never, "user-1", {
      examsService: {
        updateExam,
        deleteExam: vi.fn(),
      } as never,
    });

    const result = await service.push([
      {
        id: "11111111-1111-4111-8111-111111111111",
        entity_type: "exam",
        entity_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        operation: "update",
        payload: {
          title: "No timestamp",
        },
      },
    ]);

    expect(result).toEqual({
      synced: [],
      failed: ["11111111-1111-4111-8111-111111111111"],
    });
    expect(updateExam).not.toHaveBeenCalled();
  });
});
