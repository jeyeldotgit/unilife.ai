"use server";

import { revalidatePath } from "next/cache";
import { createExam, deleteExam, updateExam } from "@/lib/api/exams";
import type { CreateExamInput, Exam, UpdateExamInput } from "@/lib/types";

export type ExamsActionResult = {
  ok: boolean;
  error?: string;
  exam?: Exam;
  deletedId?: string;
};

function isValidIsoDateTime(value: string) {
  return value.trim().length > 0 && Number.isFinite(new Date(value).getTime());
}

function sanitizeNullableString(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

function hasRequiredExamFields(input: CreateExamInput) {
  return input.title.trim().length > 0 && isValidIsoDateTime(input.examAt);
}

function isValidExamUpdate(input: UpdateExamInput) {
  if (input.title !== undefined && input.title.trim().length === 0) {
    return false;
  }

  if (input.examAt !== undefined && !isValidIsoDateTime(input.examAt)) {
    return false;
  }

  return true;
}

export async function createExamAction(
  input: CreateExamInput,
): Promise<ExamsActionResult> {
  if (!hasRequiredExamFields(input)) {
    return {
      ok: false,
      error: "Exam title and a valid exam date are required.",
    };
  }

  try {
    const exam = await createExam({
      ...input,
      title: input.title.trim(),
      classId: input.classId ?? null,
      location: sanitizeNullableString(input.location),
      description: sanitizeNullableString(input.description),
    });

    revalidatePath("/exams");
    revalidatePath("/dashboard");

    return { ok: true, exam };
  } catch (error) {
    if (error instanceof Error) {
      return {
        ok: false,
        error: error.message,
      };
    }

    return {
      ok: false,
      error: "We couldn't save the exam right now.",
    };
  }
}

export async function updateExamAction(
  id: string,
  input: UpdateExamInput,
): Promise<ExamsActionResult> {
  if (id.trim().length === 0 || !isValidExamUpdate(input)) {
    return {
      ok: false,
      error: "Please provide a valid exam update.",
    };
  }

  try {
    const exam = await updateExam(id, {
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.examAt !== undefined ? { examAt: input.examAt } : {}),
      ...(input.classId !== undefined ? { classId: input.classId ?? null } : {}),
      ...(input.location !== undefined
        ? { location: sanitizeNullableString(input.location) }
        : {}),
      ...(input.description !== undefined
        ? { description: sanitizeNullableString(input.description) }
        : {}),
    });

    if (!exam) {
      return {
        ok: false,
        error: "That exam no longer exists.",
      };
    }

    revalidatePath("/exams");
    revalidatePath("/dashboard");

    return { ok: true, exam };
  } catch (error) {
    if (error instanceof Error) {
      return {
        ok: false,
        error: error.message,
      };
    }

    return {
      ok: false,
      error: "We couldn't update the exam right now.",
    };
  }
}

export async function deleteExamAction(id: string): Promise<ExamsActionResult> {
  if (id.trim().length === 0) {
    return {
      ok: false,
      error: "A valid exam is required.",
    };
  }

  try {
    const deleted = await deleteExam(id);

    if (!deleted) {
      return {
        ok: false,
        error: "That exam no longer exists.",
      };
    }

    revalidatePath("/exams");
    revalidatePath("/dashboard");

    return { ok: true, deletedId: id };
  } catch (error) {
    if (error instanceof Error) {
      return {
        ok: false,
        error: error.message,
      };
    }

    return {
      ok: false,
      error: "We couldn't delete the exam right now.",
    };
  }
}
