"use server";

import { revalidatePath } from "next/cache";
import { deleteExpense, logExpense } from "@/lib/api/expenses";
import type { LogExpenseInput } from "@/lib/types";

export type ExpensesActionResult = {
  ok: boolean;
  error?: string;
};

function hasRequiredExpenseFields(input: LogExpenseInput) {
  return (
    input.label.trim().length > 0 &&
    Number.isFinite(input.amount) &&
    input.amount > 0
  );
}

export async function logExpenseAction(
  input: LogExpenseInput,
): Promise<ExpensesActionResult> {
  if (!hasRequiredExpenseFields(input)) {
    return {
      ok: false,
      error: "Expense label and a valid amount are required.",
    };
  }

  try {
    await logExpense({
      ...input,
      label: input.label.trim(),
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
      error: "We couldn't log the expense right now.",
    };
  }

  revalidatePath("/expenses");
  revalidatePath("/dashboard");

  return { ok: true };
}

export async function deleteExpenseAction(
  id: string,
): Promise<ExpensesActionResult> {
  if (id.trim().length === 0) {
    return {
      ok: false,
      error: "A valid expense is required.",
    };
  }

  try {
    const removedExpense = await deleteExpense(id);

    if (!removedExpense) {
      return {
        ok: false,
        error: "That expense no longer exists.",
      };
    }
  } catch (error) {
    if (error instanceof Error) {
      return {
        ok: false,
        error: error.message,
      };
    }

    return {
      ok: false,
      error: "We couldn't delete the expense right now.",
    };
  }

  revalidatePath("/expenses");
  revalidatePath("/dashboard");

  return { ok: true };
}
