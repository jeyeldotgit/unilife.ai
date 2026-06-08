"use server";

import { revalidatePath } from "next/cache";
import { createAssignment } from "@/lib/api/assignments";
import type { CreateAssignmentInput } from "@/lib/types";

export type AssignmentsActionResult = {
  ok: boolean;
  error?: string;
};

function hasRequiredAssignmentFields(input: CreateAssignmentInput) {
  const dueAtTime = new Date(input.dueAt).getTime();

  return (
    input.title.trim().length > 0 &&
    input.dueAt.trim().length > 0 &&
    Number.isFinite(dueAtTime)
  );
}

export async function createAssignmentAction(
  input: CreateAssignmentInput,
): Promise<AssignmentsActionResult> {
  if (!hasRequiredAssignmentFields(input)) {
    return {
      ok: false,
      error: "Assignment title and a valid due date are required.",
    };
  }

  try {
    await createAssignment({
      ...input,
      title: input.title.trim(),
      subject: input.subject?.trim() || undefined,
      classId: input.classId ?? null,
      description: input.description?.trim() || null,
    });
  } catch (error) {
    if (error instanceof Error) {
      return {
        ok: false,
        error: error.message,
      };
    }

    return {
      ok: false,
      error: "We couldn't save the assignment right now.",
    };
  }

  revalidatePath("/assignments");
  revalidatePath("/dashboard");

  return { ok: true };
}
