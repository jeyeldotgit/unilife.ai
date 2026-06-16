import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  assignments: [] as Record<string, unknown>[],
  classes: [] as Record<string, unknown>[],
  exams: [] as Record<string, unknown>[],
}));

vi.mock("../src/repositories/health.repository.js", () => ({
  HealthRepository: class HealthRepository {
    async isDatabaseReachable() {
      return true;
    }
  },
}));

vi.mock("../src/lib/supabase.js", () => ({
  createSupabaseClient: () => ({
    auth: {
      getUser: async (token: string) => {
        if (token === "valid-token") {
          return {
            data: { user: { id: "user-1" } },
            error: null,
          };
        }

        if (token === "other-token") {
          return {
            data: { user: { id: "user-2" } },
            error: null,
          };
        }

        return {
          data: { user: null },
          error: { message: "Invalid token" },
        };
      },
    },
  }),
}));

vi.mock("../src/repositories/classes.repository.js", () => ({
  ClassesRepository: class ClassesRepository {
    async listForUser(userId: string, filters: { since?: string }) {
      return state.classes.filter((record) => {
        if (record.user_id !== userId || record.deleted_at !== null) {
          return false;
        }

        if (!filters.since) {
          return true;
        }

        return Date.parse(String(record.updated_at)) > Date.parse(filters.since);
      });
    }

    async findByIdForUser(id: string, userId: string) {
      return (
        state.classes.find(
          (record) =>
            record.id === id && record.user_id === userId && record.deleted_at === null,
        ) ?? null
      );
    }

    async existsForOtherUser(id: string, userId: string) {
      return state.classes.some(
        (record) =>
          record.id === id && record.user_id !== userId && record.deleted_at === null,
      );
    }

    async create(record: Record<string, unknown>) {
      state.classes.push(record);
      return record;
    }

    async updateForUser(id: string, userId: string, changes: Record<string, unknown>) {
      const index = state.classes.findIndex(
        (record) =>
          record.id === id && record.user_id === userId && record.deleted_at === null,
      );

      if (index === -1) {
        return null;
      }

      state.classes[index] = {
        ...state.classes[index],
        ...changes,
      };

      return state.classes[index];
    }

    async softDeleteForUser(id: string, userId: string, deletedAt: string) {
      const index = state.classes.findIndex(
        (record) =>
          record.id === id && record.user_id === userId && record.deleted_at === null,
      );

      if (index === -1) {
        return false;
      }

      state.classes[index] = {
        ...state.classes[index],
        deleted_at: deletedAt,
      };

      return true;
    }
  },
}));

vi.mock("../src/repositories/academic-terms.repository.js", () => ({
  AcademicTermsRepository: class AcademicTermsRepository {
    async findByIdForUser(id: string, userId: string) {
      return {
        id,
        user_id: userId,
        name: "Current Schedule",
        status: "active",
        created_at: "2026-06-01T00:00:00.000Z",
        updated_at: "2026-06-01T00:00:00.000Z",
        archived_at: null,
        deleted_at: null,
      };
    }

    async findActiveForUser(userId: string) {
      return {
        id: "99999999-9999-4999-8999-999999999999",
        user_id: userId,
        name: "Current Schedule",
        status: "active",
        created_at: "2026-06-01T00:00:00.000Z",
        updated_at: "2026-06-01T00:00:00.000Z",
        archived_at: null,
        deleted_at: null,
      };
    }
  },
}));

vi.mock("../src/repositories/assignments.repository.js", () => ({
  AssignmentsRepository: class AssignmentsRepository {
    async listForUser(userId: string, filters: { since?: string; status?: string }) {
      return state.assignments.filter((record) => {
        if (record.user_id !== userId || record.deleted_at !== null) {
          return false;
        }

        if (filters.since && Date.parse(String(record.updated_at)) <= Date.parse(filters.since)) {
          return false;
        }

        if (filters.status && record.status !== filters.status) {
          return false;
        }

        return true;
      });
    }

    async findByIdForUser(id: string, userId: string) {
      return (
        state.assignments.find(
          (record) =>
            record.id === id && record.user_id === userId && record.deleted_at === null,
        ) ?? null
      );
    }

    async existsForOtherUser(id: string, userId: string) {
      return state.assignments.some(
        (record) =>
          record.id === id && record.user_id !== userId && record.deleted_at === null,
      );
    }

    async create(record: Record<string, unknown>) {
      state.assignments.push(record);
      return record;
    }

    async updateForUser(id: string, userId: string, changes: Record<string, unknown>) {
      const index = state.assignments.findIndex(
        (record) =>
          record.id === id && record.user_id === userId && record.deleted_at === null,
      );

      if (index === -1) {
        return null;
      }

      state.assignments[index] = {
        ...state.assignments[index],
        ...changes,
      };

      return state.assignments[index];
    }

    async softDeleteForUser(id: string, userId: string, deletedAt: string) {
      const index = state.assignments.findIndex(
        (record) =>
          record.id === id && record.user_id === userId && record.deleted_at === null,
      );

      if (index === -1) {
        return false;
      }

      state.assignments[index] = {
        ...state.assignments[index],
        deleted_at: deletedAt,
      };

      return true;
    }
  },
}));

vi.mock("../src/repositories/exams.repository.js", () => ({
  ExamsRepository: class ExamsRepository {
    async listForUser(userId: string, filters: { since?: string }) {
      return state.exams.filter((record) => {
        if (record.user_id !== userId || record.deleted_at !== null) {
          return false;
        }

        if (!filters.since) {
          return true;
        }

        return Date.parse(String(record.updated_at)) > Date.parse(filters.since);
      });
    }

    async findByIdForUser(id: string, userId: string) {
      return (
        state.exams.find(
          (record) =>
            record.id === id && record.user_id === userId && record.deleted_at === null,
        ) ?? null
      );
    }

    async existsForOtherUser(id: string, userId: string) {
      return state.exams.some(
        (record) =>
          record.id === id && record.user_id !== userId && record.deleted_at === null,
      );
    }

    async create(record: Record<string, unknown>) {
      state.exams.push(record);
      return record;
    }

    async updateForUser(id: string, userId: string, changes: Record<string, unknown>) {
      const index = state.exams.findIndex(
        (record) =>
          record.id === id && record.user_id === userId && record.deleted_at === null,
      );

      if (index === -1) {
        return null;
      }

      state.exams[index] = {
        ...state.exams[index],
        ...changes,
      };

      return state.exams[index];
    }

    async softDeleteForUser(id: string, userId: string, deletedAt: string) {
      const index = state.exams.findIndex(
        (record) =>
          record.id === id && record.user_id === userId && record.deleted_at === null,
      );

      if (index === -1) {
        return false;
      }

      state.exams[index] = {
        ...state.exams[index],
        deleted_at: deletedAt,
      };

      return true;
    }
  },
}));

import { app } from "../src/app.js";

function seedState() {
  state.classes = [
    {
      id: "11111111-1111-4111-8111-111111111111",
      user_id: "user-1",
      subject: "Algorithms",
      room: "A-101",
      instructor: "Prof. Cruz",
      day_of_week: "monday",
      start_time: "09:00",
      end_time: "10:00",
      color: "#ff0000",
      is_active: true,
      created_at: "2026-06-01T08:00:00.000Z",
      updated_at: "2026-06-03T08:00:00.000Z",
      deleted_at: null,
    },
    {
      id: "22222222-2222-4222-8222-222222222222",
      user_id: "user-2",
      subject: "Physics",
      room: "B-202",
      instructor: "Prof. Reyes",
      day_of_week: "tuesday",
      start_time: "10:00",
      end_time: "11:00",
      color: "#00ff00",
      is_active: true,
      created_at: "2026-06-01T08:00:00.000Z",
      updated_at: "2026-06-04T08:00:00.000Z",
      deleted_at: null,
    },
  ];

  state.assignments = [
    {
      id: "33333333-3333-4333-8333-333333333333",
      user_id: "user-1",
      class_id: "11111111-1111-4111-8111-111111111111",
      title: "Homework 1",
      description: "Read chapter 1",
      due_date: "2026-06-10T12:00:00.000Z",
      status: "pending",
      priority: 1,
      created_at: "2026-06-01T08:00:00.000Z",
      updated_at: "2026-06-03T08:00:00.000Z",
      deleted_at: null,
    },
    {
      id: "44444444-4444-4444-8444-444444444444",
      user_id: "user-2",
      class_id: null,
      title: "Foreign Homework",
      description: null,
      due_date: "2026-06-11T12:00:00.000Z",
      status: "completed",
      priority: 2,
      created_at: "2026-06-01T08:00:00.000Z",
      updated_at: "2026-06-04T08:00:00.000Z",
      deleted_at: null,
    },
  ];

  state.exams = [
    {
      id: "55555555-5555-4555-8555-555555555555",
      user_id: "user-1",
      class_id: "11111111-1111-4111-8111-111111111111",
      title: "Midterms",
      description: "Covers units 1-3",
      exam_date: "2026-06-20T08:00:00.000Z",
      location: "Hall A",
      created_at: "2026-06-01T08:00:00.000Z",
      updated_at: "2026-06-03T08:00:00.000Z",
      deleted_at: null,
    },
    {
      id: "66666666-6666-4666-8666-666666666666",
      user_id: "user-2",
      class_id: null,
      title: "Foreign Exam",
      description: null,
      exam_date: "2026-06-21T08:00:00.000Z",
      location: null,
      created_at: "2026-06-01T08:00:00.000Z",
      updated_at: "2026-06-04T08:00:00.000Z",
      deleted_at: null,
    },
  ];
}

beforeEach(() => {
  seedState();
});

describe("academic endpoints", () => {
  it("rejects unauthenticated requests across all academic route groups", async () => {
    const classesResponse = await app.request("http://localhost/api/classes");
    const assignmentsResponse = await app.request("http://localhost/api/assignments");
    const examsResponse = await app.request("http://localhost/api/exams");

    expect(classesResponse.status).toBe(401);
    expect(assignmentsResponse.status).toBe(401);
    expect(examsResponse.status).toBe(401);
  });

  it("supports the full classes CRUD flow with stale update rejection and soft delete", async () => {
    const listResponse = await app.request(
      "http://localhost/api/classes?since=2026-06-02T00:00:00.000Z",
      {
        headers: {
          Authorization: "Bearer valid-token",
        },
      },
    );
    const listBody = await listResponse.json();

    expect(listResponse.status).toBe(200);
    expect(listBody.classes).toHaveLength(1);
    expect(listBody.classes[0].id).toBe("11111111-1111-4111-8111-111111111111");

    const createResponse = await app.request("http://localhost/api/classes", {
      method: "POST",
      headers: {
        Authorization: "Bearer valid-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: "77777777-7777-4777-8777-777777777777",
        subject: "Databases",
        day_of_week: "friday",
        start_time: "13:00",
        end_time: "14:00",
        created_at: "2026-06-05T08:00:00.000Z",
        updated_at: "2026-06-05T08:00:00.000Z",
      }),
    });
    const createBody = await createResponse.json();

    expect(createResponse.status).toBe(201);
    expect(createBody.class.user_id).toBe("user-1");
    expect(createBody.class.is_active).toBe(true);
    expect(createBody.class.deleted_at).toBeNull();

    const getResponse = await app.request(
      "http://localhost/api/classes/77777777-7777-4777-8777-777777777777",
      {
        headers: {
          Authorization: "Bearer valid-token",
        },
      },
    );
    const getBody = await getResponse.json();

    expect(getResponse.status).toBe(200);
    expect(getBody.class.subject).toBe("Databases");

    const updateResponse = await app.request(
      "http://localhost/api/classes/77777777-7777-4777-8777-777777777777",
      {
        method: "PATCH",
        headers: {
          Authorization: "Bearer valid-token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: "Advanced Databases",
          updated_at: "2026-06-06T08:00:00.000Z",
        }),
      },
    );
    const updateBody = await updateResponse.json();

    expect(updateResponse.status).toBe(200);
    expect(updateBody.class.subject).toBe("Advanced Databases");

    const staleResponse = await app.request(
      "http://localhost/api/classes/77777777-7777-4777-8777-777777777777",
      {
        method: "PATCH",
        headers: {
          Authorization: "Bearer valid-token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: "Old Databases",
          updated_at: "2026-06-05T07:59:00.000Z",
        }),
      },
    );
    const staleBody = await staleResponse.json();

    expect(staleResponse.status).toBe(200);
    expect(staleBody.class).toBeNull();

    const deleteResponse = await app.request(
      "http://localhost/api/classes/77777777-7777-4777-8777-777777777777",
      {
        method: "DELETE",
        headers: {
          Authorization: "Bearer valid-token",
        },
      },
    );
    const deleteBody = await deleteResponse.json();

    expect(deleteResponse.status).toBe(200);
    expect(deleteBody).toEqual({ ok: true });

    const deletedGetResponse = await app.request(
      "http://localhost/api/classes/77777777-7777-4777-8777-777777777777",
      {
        headers: {
          Authorization: "Bearer valid-token",
        },
      },
    );
    const deletedGetBody = await deletedGetResponse.json();

    expect(deletedGetResponse.status).toBe(200);
    expect(deletedGetBody.class).toBeNull();
  });

  it("returns 403 for foreign class ids and 404 for missing class mutations", async () => {
    const foreignGetResponse = await app.request(
      "http://localhost/api/classes/22222222-2222-4222-8222-222222222222",
      {
        headers: {
          Authorization: "Bearer valid-token",
        },
      },
    );
    const foreignGetBody = await foreignGetResponse.json();

    expect(foreignGetResponse.status).toBe(403);
    expect(foreignGetBody.error.code).toBe("FORBIDDEN");

    const missingPatchResponse = await app.request(
      "http://localhost/api/classes/99999999-9999-4999-8999-999999999999",
      {
        method: "PATCH",
        headers: {
          Authorization: "Bearer valid-token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: "Missing",
          updated_at: "2026-06-06T08:00:00.000Z",
        }),
      },
    );
    const missingPatchBody = await missingPatchResponse.json();

    expect(missingPatchResponse.status).toBe(404);
    expect(missingPatchBody.error.code).toBe("NOT_FOUND");
  });

  it("supports assignment filters, defaults, ownership checks, and stale updates", async () => {
    const listResponse = await app.request(
      "http://localhost/api/assignments?since=2026-06-02T00:00:00.000Z&status=pending",
      {
        headers: {
          Authorization: "Bearer valid-token",
        },
      },
    );
    const listBody = await listResponse.json();

    expect(listResponse.status).toBe(200);
    expect(listBody.assignments).toHaveLength(1);
    expect(listBody.assignments[0].id).toBe("33333333-3333-4333-8333-333333333333");

    const createResponse = await app.request("http://localhost/api/assignments", {
      method: "POST",
      headers: {
        Authorization: "Bearer valid-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: "88888888-8888-4888-8888-888888888888",
        title: "Essay Draft",
        due_date: "2026-06-15T12:00:00.000Z",
        created_at: "2026-06-05T08:00:00.000Z",
        updated_at: "2026-06-05T08:00:00.000Z",
      }),
    });
    const createBody = await createResponse.json();

    expect(createResponse.status).toBe(201);
    expect(createBody.assignment.user_id).toBe("user-1");
    expect(createBody.assignment.status).toBe("pending");
    expect(createBody.assignment.priority).toBe(1);

    const updateResponse = await app.request(
      "http://localhost/api/assignments/88888888-8888-4888-8888-888888888888",
      {
        method: "PATCH",
        headers: {
          Authorization: "Bearer valid-token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description: null,
          class_id: null,
          status: "completed",
          priority: 3,
          updated_at: "2026-06-06T08:00:00.000Z",
        }),
      },
    );
    const updateBody = await updateResponse.json();

    expect(updateResponse.status).toBe(200);
    expect(updateBody.assignment.status).toBe("completed");
    expect(updateBody.assignment.priority).toBe(3);

    const staleResponse = await app.request(
      "http://localhost/api/assignments/88888888-8888-4888-8888-888888888888",
      {
        method: "PATCH",
        headers: {
          Authorization: "Bearer valid-token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "Outdated Draft",
          updated_at: "2026-06-04T08:00:00.000Z",
        }),
      },
    );
    const staleBody = await staleResponse.json();

    expect(staleResponse.status).toBe(200);
    expect(staleBody.assignment).toBeNull();

    const foreignGetResponse = await app.request(
      "http://localhost/api/assignments/44444444-4444-4444-8444-444444444444",
      {
        headers: {
          Authorization: "Bearer valid-token",
        },
      },
    );
    const foreignGetBody = await foreignGetResponse.json();

    expect(foreignGetResponse.status).toBe(403);
    expect(foreignGetBody.error.code).toBe("FORBIDDEN");

    const deleteResponse = await app.request(
      "http://localhost/api/assignments/88888888-8888-4888-8888-888888888888",
      {
        method: "DELETE",
        headers: {
          Authorization: "Bearer valid-token",
        },
      },
    );
    const deleteBody = await deleteResponse.json();

    expect(deleteResponse.status).toBe(200);
    expect(deleteBody).toEqual({ ok: true });
  });

  it("supports exam CRUD flows and preserves 403 and 404 semantics", async () => {
    const createResponse = await app.request("http://localhost/api/exams", {
      method: "POST",
      headers: {
        Authorization: "Bearer valid-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        title: "Finals",
        exam_date: "2026-06-25T08:00:00.000Z",
        created_at: "2026-06-05T08:00:00.000Z",
        updated_at: "2026-06-05T08:00:00.000Z",
      }),
    });
    const createBody = await createResponse.json();

    expect(createResponse.status).toBe(201);
    expect(createBody.exam.user_id).toBe("user-1");
    expect(createBody.exam.deleted_at).toBeNull();

    const listResponse = await app.request(
      "http://localhost/api/exams?since=2026-06-02T00:00:00.000Z",
      {
        headers: {
          Authorization: "Bearer valid-token",
        },
      },
    );
    const listBody = await listResponse.json();

    expect(listResponse.status).toBe(200);
    expect(listBody.exams).toHaveLength(2);

    const updateResponse = await app.request(
      "http://localhost/api/exams/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      {
        method: "PATCH",
        headers: {
          Authorization: "Bearer valid-token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          location: null,
          updated_at: "2026-06-06T08:00:00.000Z",
        }),
      },
    );
    const updateBody = await updateResponse.json();

    expect(updateResponse.status).toBe(200);
    expect(updateBody.exam.location).toBeNull();

    const foreignDeleteResponse = await app.request(
      "http://localhost/api/exams/66666666-6666-4666-8666-666666666666",
      {
        method: "DELETE",
        headers: {
          Authorization: "Bearer valid-token",
        },
      },
    );
    const foreignDeleteBody = await foreignDeleteResponse.json();

    expect(foreignDeleteResponse.status).toBe(403);
    expect(foreignDeleteBody.error.code).toBe("FORBIDDEN");

    const missingDeleteResponse = await app.request(
      "http://localhost/api/exams/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      {
        method: "DELETE",
        headers: {
          Authorization: "Bearer valid-token",
        },
      },
    );
    const missingDeleteBody = await missingDeleteResponse.json();

    expect(missingDeleteResponse.status).toBe(404);
    expect(missingDeleteBody.error.code).toBe("NOT_FOUND");
  });
});
