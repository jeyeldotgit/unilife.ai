import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requestBackend: vi.fn(),
}));

vi.mock("@/lib/api/client", () => ({
  requestBackend: mocks.requestBackend,
}));

describe("exams adapter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-10T08:00:00.000Z"));
    mocks.requestBackend.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("normalizes backend exams into UI records", async () => {
    const { normalizeExamRecord } = await import("@/lib/api/exams");

    const exam = normalizeExamRecord(
      {
        id: "exam-1",
        user_id: "user-1",
        class_id: "class-1",
        title: "Calculus Midterm",
        description: "Focus on chapters 1-4",
        exam_date: "2026-06-12T09:00:00.000Z",
        location: "Room 204",
        created_at: "2026-06-01T00:00:00.000Z",
        updated_at: "2026-06-01T00:00:00.000Z",
        deleted_at: null,
      },
      {
        classSubjectById: new Map([["class-1", "Calculus 101"]]),
      },
    );

    expect(exam).toMatchObject({
      id: "exam-1",
      title: "Calculus Midterm",
      subject: "Calculus 101",
      classId: "class-1",
      location: "Room 204",
      description: "Focus on chapters 1-4",
      countdownLabel: "In 2 days",
    });
    expect(exam.urgency.label).toBe("IN 2 DAYS");
  });

  it("lists exam records and normalizes them with class context", async () => {
    mocks.requestBackend.mockResolvedValue({
      exams: [
        {
          id: "exam-1",
          user_id: "user-1",
          class_id: "class-1",
          title: "Physics Finals",
          description: null,
          exam_date: "2026-06-11T13:30:00.000Z",
          location: null,
          created_at: "2026-06-01T00:00:00.000Z",
          updated_at: "2026-06-01T00:00:00.000Z",
          deleted_at: null,
        },
      ],
    });

    const { getExams } = await import("@/lib/api/exams");
    const exams = await getExams({
      classSubjectById: new Map([["class-1", "Physics 102"]]),
    });

    expect(mocks.requestBackend).toHaveBeenCalledWith("/api/exams");
    expect(exams[0]).toMatchObject({
      id: "exam-1",
      subject: "Physics 102",
      countdownLabel: "Tomorrow",
    });
  });

  it("creates exams with the backend request shape", async () => {
    mocks.requestBackend.mockResolvedValue({
      exam: {
        id: "exam-1",
        user_id: "user-1",
        class_id: "class-1",
        title: "Chemistry Quiz",
        description: "Bring a calculator",
        exam_date: "2026-06-15T10:00:00.000Z",
        location: "Science Hall",
        created_at: "2026-06-10T08:00:00.000Z",
        updated_at: "2026-06-10T08:00:00.000Z",
        deleted_at: null,
      },
    });

    const { createExam } = await import("@/lib/api/exams");
    const exam = await createExam({
      title: "Chemistry Quiz",
      examAt: "2026-06-15T10:00:00.000Z",
      classId: "class-1",
      location: "Science Hall",
      description: "Bring a calculator",
    });

    expect(mocks.requestBackend).toHaveBeenCalledWith(
      "/api/exams",
      expect.objectContaining({
        method: "POST",
        body: expect.objectContaining({
          id: expect.any(String),
          title: "Chemistry Quiz",
          exam_date: "2026-06-15T10:00:00.000Z",
          class_id: "class-1",
          location: "Science Hall",
          description: "Bring a calculator",
          created_at: expect.any(String),
          updated_at: expect.any(String),
        }),
      }),
    );
    expect(exam).toMatchObject({
      id: "exam-1",
      title: "Chemistry Quiz",
    });
  });

  it("updates exams with nullable fields", async () => {
    mocks.requestBackend.mockResolvedValue({
      exam: {
        id: "exam-1",
        user_id: "user-1",
        class_id: null,
        title: "History Oral Exam",
        description: null,
        exam_date: "2026-06-18T07:00:00.000Z",
        location: null,
        created_at: "2026-06-01T00:00:00.000Z",
        updated_at: "2026-06-10T08:00:00.000Z",
        deleted_at: null,
      },
    });

    const { updateExam } = await import("@/lib/api/exams");
    await updateExam("exam-1", {
      examAt: "2026-06-18T07:00:00.000Z",
      classId: null,
      location: null,
      description: null,
    });

    expect(mocks.requestBackend).toHaveBeenCalledWith(
      "/api/exams/exam-1",
      expect.objectContaining({
        method: "PATCH",
        body: expect.objectContaining({
          exam_date: "2026-06-18T07:00:00.000Z",
          class_id: null,
          location: null,
          description: null,
          updated_at: expect.any(String),
        }),
      }),
    );
  });

  it("deletes exams by id", async () => {
    mocks.requestBackend.mockResolvedValue({ ok: true });

    const { deleteExam } = await import("@/lib/api/exams");

    await expect(deleteExam("exam-1")).resolves.toBe(true);
    expect(mocks.requestBackend).toHaveBeenCalledWith(
      "/api/exams/exam-1",
      expect.objectContaining({
        method: "DELETE",
      }),
    );
  });
});
