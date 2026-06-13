import { describe, expect, it, vi } from "vitest";

import { AssignmentsService } from "../src/services/assignments.service.js";
import { ClassesService } from "../src/services/classes.service.js";
import { ExamsService } from "../src/services/exams.service.js";

describe("academic services", () => {
  it("injects class defaults and the authenticated user on create", async () => {
    const create = vi.fn(async (record) => record);
    const service = new ClassesService(
      {} as never,
      "user-1",
      {
        create,
      } as never,
    );

    const record = await service.createClass({
      id: "11111111-1111-4111-8111-111111111111",
      subject: "Algorithms",
      day_of_week: "monday",
      start_time: "09:00",
      end_time: "10:00",
      created_at: "2026-06-01T08:00:00.000Z",
      updated_at: "2026-06-01T08:00:00.000Z",
    });

    expect(create).toHaveBeenCalledWith({
      id: "11111111-1111-4111-8111-111111111111",
      user_id: "user-1",
      subject: "Algorithms",
      room: null,
      instructor: null,
      day_of_week: "monday",
      start_time: "09:00",
      end_time: "10:00",
      color: null,
      is_active: true,
      recurrence: null,
      created_at: "2026-06-01T08:00:00.000Z",
      updated_at: "2026-06-01T08:00:00.000Z",
      deleted_at: null,
    });
    expect(record.user_id).toBe("user-1");
  });

  it("injects assignment defaults on create", async () => {
    const create = vi.fn(async (record) => record);
    const service = new AssignmentsService(
      {} as never,
      "user-1",
      {
        create,
      } as never,
    );

    const record = await service.createAssignment({
      id: "33333333-3333-4333-8333-333333333333",
      title: "Homework 1",
      due_date: "2026-06-10T12:00:00.000Z",
      created_at: "2026-06-01T08:00:00.000Z",
      updated_at: "2026-06-01T08:00:00.000Z",
    });

    expect(create).toHaveBeenCalledWith({
      id: "33333333-3333-4333-8333-333333333333",
      user_id: "user-1",
      class_id: null,
      title: "Homework 1",
      description: null,
      due_date: "2026-06-10T12:00:00.000Z",
      status: "pending",
      priority: 1,
      recurrence: null,
      created_at: "2026-06-01T08:00:00.000Z",
      updated_at: "2026-06-01T08:00:00.000Z",
      deleted_at: null,
    });
    expect(record.status).toBe("pending");
    expect(record.priority).toBe(1);
  });

  it("accepts a newer class update and returns the updated record", async () => {
    const findByIdForUser = vi.fn(async () => ({
      id: "11111111-1111-4111-8111-111111111111",
      user_id: "user-1",
      subject: "Algorithms",
      room: null,
      instructor: null,
      day_of_week: "monday",
      start_time: "09:00",
      end_time: "10:00",
      color: null,
      is_active: true,
      created_at: "2026-06-01T08:00:00.000Z",
      updated_at: "2026-06-01T08:00:00.000Z",
      deleted_at: null,
    }));
    const updateForUser = vi.fn(async (_id, _userId, changes) => ({
      id: "11111111-1111-4111-8111-111111111111",
      user_id: "user-1",
      subject: changes.subject,
      room: null,
      instructor: null,
      day_of_week: "monday",
      start_time: "09:00",
      end_time: "10:00",
      color: null,
      is_active: true,
      created_at: "2026-06-01T08:00:00.000Z",
      updated_at: changes.updated_at,
      deleted_at: null,
    }));
    const service = new ClassesService(
      {} as never,
      "user-1",
      {
        existsForOtherUser: vi.fn(),
        findByIdForUser,
        updateForUser,
      } as never,
    );

    const result = await service.updateClass("11111111-1111-4111-8111-111111111111", {
      subject: "Advanced Algorithms",
      updated_at: "2026-06-02T08:00:00.000Z",
    });

    expect(updateForUser).toHaveBeenCalledWith(
      "11111111-1111-4111-8111-111111111111",
      "user-1",
      {
        subject: "Advanced Algorithms",
        updated_at: "2026-06-02T08:00:00.000Z",
      },
    );
    expect(result).toEqual({
      status: "updated",
      record: expect.objectContaining({
        subject: "Advanced Algorithms",
        updated_at: "2026-06-02T08:00:00.000Z",
      }),
    });
  });

  it("rejects stale assignment updates without writing", async () => {
    const updateForUser = vi.fn();
    const service = new AssignmentsService(
      {} as never,
      "user-1",
      {
        existsForOtherUser: vi.fn(),
        findByIdForUser: vi.fn(async () => ({
          id: "33333333-3333-4333-8333-333333333333",
          user_id: "user-1",
          class_id: null,
          title: "Homework 1",
          description: null,
          due_date: "2026-06-10T12:00:00.000Z",
          status: "pending",
          priority: 1,
          created_at: "2026-06-01T08:00:00.000Z",
          updated_at: "2026-06-05T08:00:00.000Z",
          deleted_at: null,
        })),
        updateForUser,
      } as never,
    );

    const result = await service.updateAssignment("33333333-3333-4333-8333-333333333333", {
      title: "Older Homework",
      updated_at: "2026-06-04T08:00:00.000Z",
    });

    expect(result).toEqual({ status: "stale" });
    expect(updateForUser).not.toHaveBeenCalled();
  });

  it("uses a server timestamp during exam soft delete", async () => {
    const softDeleteForUser = vi.fn(async () => true);
    const service = new ExamsService(
      {} as never,
      "user-1",
      {
        existsForOtherUser: vi.fn(),
        findByIdForUser: vi.fn(async () => ({
          id: "55555555-5555-4555-8555-555555555555",
          user_id: "user-1",
          class_id: null,
          title: "Midterms",
          description: null,
          exam_date: "2026-06-20T08:00:00.000Z",
          location: null,
          created_at: "2026-06-01T08:00:00.000Z",
          updated_at: "2026-06-05T08:00:00.000Z",
          deleted_at: null,
        })),
        softDeleteForUser,
      } as never,
    );

    const result = await service.deleteExam("55555555-5555-4555-8555-555555555555");

    expect(result).toEqual({ status: "deleted" });
    expect(softDeleteForUser).toHaveBeenCalledTimes(1);

    const deletedAt = softDeleteForUser.mock.calls[0][2];
    expect(new Date(deletedAt).toISOString()).toBe(deletedAt);
  });
});
