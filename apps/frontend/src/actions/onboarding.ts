"use server";

import { revalidatePath } from "next/cache";
import { createAssignment } from "@/lib/api/assignments";
import { saveBudgetCycle } from "@/lib/api/budget";
import { createClass } from "@/lib/api/schedule";
import type {
  OnboardingBudgetInput,
  OnboardingStarterAssignmentInput,
  OnboardingStarterClassInput,
} from "@/lib/types";

export type OnboardingActionResult = {
  ok: boolean;
  error?: string;
};

export type CompleteOnboardingInput = {
  starterClass?: OnboardingStarterClassInput | null;
  starterAssignment?: OnboardingStarterAssignmentInput | null;
};

const dayIndexMap: Record<OnboardingStarterClassInput["days"][number], number> = {
  monday: 0,
  tuesday: 1,
  wednesday: 2,
  thursday: 3,
  friday: 4,
  saturday: 5,
  sunday: 6,
};

function hasValidBudget(input: OnboardingBudgetInput) {
  return Number.isFinite(input.amount) && input.amount > 0;
}

function hasStarterClass(
  input: OnboardingStarterClassInput | null | undefined,
): input is OnboardingStarterClassInput {
  return Boolean(
    input &&
      input.subject.trim().length > 0 &&
      input.days.length > 0 &&
      input.startTime.trim().length > 0 &&
      input.endTime.trim().length > 0,
  );
}

function hasStarterAssignment(
  input: OnboardingStarterAssignmentInput | null | undefined,
): input is OnboardingStarterAssignmentInput {
  if (!input) {
    return false;
  }

  return (
    input.title.trim().length > 0 &&
    input.dueAt.trim().length > 0 &&
    Number.isFinite(new Date(input.dueAt).getTime())
  );
}

export async function saveOnboardingBudgetAction(
  input: OnboardingBudgetInput,
): Promise<OnboardingActionResult> {
  if (!hasValidBudget(input)) {
    return {
      ok: false,
      error: "Enter a valid allowance amount to continue.",
    };
  }

  try {
    await saveBudgetCycle(input);
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "We could not save your budget right now.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/expenses");
  revalidatePath("/onboarding");

  return { ok: true };
}

export async function completeOnboardingAction(
  input: CompleteOnboardingInput,
): Promise<OnboardingActionResult> {
  if (hasStarterClass(input.starterClass)) {
    const starterClass = input.starterClass;

    try {
      for (const dayOfWeek of starterClass.days) {
        await createClass({
          subject: starterClass.subject.trim(),
          dayOfWeek,
          dayIndex: dayIndexMap[dayOfWeek],
          startTime: starterClass.startTime,
          endTime: starterClass.endTime,
          room: starterClass.room?.trim() || null,
          instructor: starterClass.instructor?.trim() || null,
          color: starterClass.color,
        });
      }
    } catch (error) {
      return {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "We could not save your starter class right now.",
      };
    }
  }

  if (hasStarterAssignment(input.starterAssignment)) {
    const starterAssignment = input.starterAssignment;

    try {
      await createAssignment({
        title: starterAssignment.title.trim(),
        dueAt: starterAssignment.dueAt,
        classId: starterAssignment.classId ?? null,
        subject: starterAssignment.subject?.trim() || undefined,
        description: starterAssignment.description?.trim() || null,
      });
    } catch (error) {
      return {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "We could not save your starter assignment right now.",
      };
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/schedule");
  revalidatePath("/assignments");
  revalidatePath("/onboarding");

  return { ok: true };
}
