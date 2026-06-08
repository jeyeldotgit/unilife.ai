"use server";

import { revalidatePath } from "next/cache";
import { createClass } from "@/lib/api/schedule";
import type { CreateClassInput } from "@/lib/types";

export type ScheduleActionResult = {
  ok: boolean;
  error?: string;
};

function hasRequiredClassFields(input: CreateClassInput) {
  return (
    input.subject.trim().length > 0 &&
    input.dayOfWeek &&
    Number.isInteger(input.dayIndex) &&
    input.startTime.trim().length > 0 &&
    input.endTime.trim().length > 0
  );
}

export async function createScheduleClass(
  input: CreateClassInput,
): Promise<ScheduleActionResult> {
  if (!hasRequiredClassFields(input)) {
    return {
      ok: false,
      error: "Subject, day, start time, and end time are required.",
    };
  }

  if (input.endTime <= input.startTime) {
    return {
      ok: false,
      error: "End time must be later than start time.",
    };
  }

  try {
    await createClass({
      ...input,
      subject: input.subject.trim(),
      room: input.room?.trim() || null,
      instructor: input.instructor?.trim() || null,
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
      error: "We couldn't save the class right now.",
    };
  }

  revalidatePath("/schedule");
  revalidatePath("/dashboard");

  return { ok: true };
}
