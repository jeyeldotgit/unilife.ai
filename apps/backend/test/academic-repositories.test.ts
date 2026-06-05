import { describe, expect, it, vi } from "vitest";

import { AssignmentsRepository } from "../src/repositories/assignments.repository.js";
import { ClassesRepository } from "../src/repositories/classes.repository.js";
import { ExamsRepository } from "../src/repositories/exams.repository.js";

function createQueryBuilder(result: unknown, singleResult = result) {
  const builder = {
    eq: vi.fn(() => builder),
    gt: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    is: vi.fn(() => builder),
    neq: vi.fn(() => builder),
    select: vi.fn(() => builder),
    single: vi.fn(async () => singleResult),
    then: (onFulfilled: (value: unknown) => unknown, onRejected?: (reason: unknown) => unknown) =>
      Promise.resolve(result).then(onFulfilled, onRejected),
    update: vi.fn(() => builder),
  };

  return builder;
}

describe("academic repositories", () => {
  it("scopes class lists by user, excludes soft-deleted rows, and applies the since filter", async () => {
    const builder = createQueryBuilder({
      data: [{ id: "class-1" }],
      error: null,
    });
    const supabase = {
      from: vi.fn(() => builder),
    };
    const repository = new ClassesRepository(supabase as never);

    const result = await repository.listForUser("user-1", {
      since: "2026-06-01T08:00:00.000Z",
    });

    expect(result).toEqual([{ id: "class-1" }]);
    expect(supabase.from).toHaveBeenCalledWith("classes");
    expect(builder.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(builder.is).toHaveBeenCalledWith("deleted_at", null);
    expect(builder.gt).toHaveBeenCalledWith("updated_at", "2026-06-01T08:00:00.000Z");
  });

  it("returns null when an owned class lookup is missing", async () => {
    const builder = createQueryBuilder(
      { data: null, error: null },
      {
        data: null,
        error: { code: "PGRST116", message: "Not found" },
      },
    );
    const repository = new ClassesRepository({
      from: vi.fn(() => builder),
    } as never);

    const result = await repository.findByIdForUser(
      "11111111-1111-4111-8111-111111111111",
      "user-1",
    );

    expect(result).toBeNull();
    expect(builder.eq).toHaveBeenNthCalledWith(1, "id", "11111111-1111-4111-8111-111111111111");
    expect(builder.eq).toHaveBeenNthCalledWith(2, "user_id", "user-1");
    expect(builder.is).toHaveBeenCalledWith("deleted_at", null);
  });

  it("applies assignment status filters and user scoping on list queries", async () => {
    const builder = createQueryBuilder({
      data: [{ id: "assignment-1" }],
      error: null,
    });
    const repository = new AssignmentsRepository({
      from: vi.fn(() => builder),
    } as never);

    const result = await repository.listForUser("user-1", {
      since: "2026-06-01T08:00:00.000Z",
      status: "pending",
    });

    expect(result).toEqual([{ id: "assignment-1" }]);
    expect(builder.eq).toHaveBeenNthCalledWith(1, "user_id", "user-1");
    expect(builder.eq).toHaveBeenNthCalledWith(2, "status", "pending");
    expect(builder.is).toHaveBeenCalledWith("deleted_at", null);
    expect(builder.gt).toHaveBeenCalledWith("updated_at", "2026-06-01T08:00:00.000Z");
  });

  it("scopes assignment updates to the authenticated user and non-deleted rows", async () => {
    const builder = createQueryBuilder(
      { data: null, error: null },
      {
        data: { id: "assignment-1" },
        error: null,
      },
    );
    const repository = new AssignmentsRepository({
      from: vi.fn(() => builder),
    } as never);

    await repository.updateForUser("assignment-1", "user-1", {
      title: "Updated title",
      updated_at: "2026-06-02T08:00:00.000Z",
    });

    expect(builder.update).toHaveBeenCalledWith({
      title: "Updated title",
      updated_at: "2026-06-02T08:00:00.000Z",
    });
    expect(builder.eq).toHaveBeenNthCalledWith(1, "id", "assignment-1");
    expect(builder.eq).toHaveBeenNthCalledWith(2, "user_id", "user-1");
    expect(builder.is).toHaveBeenCalledWith("deleted_at", null);
  });

  it("uses a foreign-ownership probe for exam access checks", async () => {
    const builder = createQueryBuilder(
      { data: null, error: null },
      {
        data: { id: "exam-1" },
        error: null,
      },
    );
    const repository = new ExamsRepository({
      from: vi.fn(() => builder),
    } as never);

    const result = await repository.existsForOtherUser("exam-1", "user-1");

    expect(result).toBe(true);
    expect(builder.eq).toHaveBeenCalledWith("id", "exam-1");
    expect(builder.neq).toHaveBeenCalledWith("user_id", "user-1");
    expect(builder.is).toHaveBeenCalledWith("deleted_at", null);
  });

  it("scopes exam soft deletes to owned, non-deleted rows", async () => {
    const builder = createQueryBuilder(
      { data: null, error: null },
      {
        data: { id: "exam-1" },
        error: null,
      },
    );
    const repository = new ExamsRepository({
      from: vi.fn(() => builder),
    } as never);

    const result = await repository.softDeleteForUser(
      "exam-1",
      "user-1",
      "2026-06-06T08:00:00.000Z",
    );

    expect(result).toBe(true);
    expect(builder.update).toHaveBeenCalledWith({
      deleted_at: "2026-06-06T08:00:00.000Z",
    });
    expect(builder.eq).toHaveBeenNthCalledWith(1, "id", "exam-1");
    expect(builder.eq).toHaveBeenNthCalledWith(2, "user_id", "user-1");
    expect(builder.is).toHaveBeenCalledWith("deleted_at", null);
  });
});
