import { describe, expect, it } from "vitest";

import { normalizeAssignmentRecord } from "@/lib/api/assignments";

describe("assignments adapter", () => {
  it("normalizes backend assignments into UI records", () => {
    const assignment = normalizeAssignmentRecord(
      {
        id: "assignment-1",
        user_id: "user-1",
        class_id: "class-1",
        title: "Research Paper",
        description: "Draft",
        due_date: "2099-06-05T23:59:00.000Z",
        status: "pending",
        priority: 3,
        created_at: "2026-06-01T00:00:00.000Z",
        updated_at: "2026-06-01T00:00:00.000Z",
        deleted_at: null,
      },
      {
        classSubjectById: new Map([["class-1", "Math 101"]]),
      },
    );

    expect(assignment).toMatchObject({
      id: "assignment-1",
      subject: "Math 101",
      title: "Research Paper",
      status: "pending",
      priority: 3,
    });
    expect(assignment.urgency.label).toContain("DUE IN");
    expect(assignment.reminders).toHaveLength(4);
  });
});
