import type {
  Assignment,
  BudgetStatus,
  ChatAssignmentConfirmationMessage,
  ChatExpenseConfirmationMessage,
  ExpenseItem,
} from "@/lib/types";

import { formatDueDateTimeLabel } from "@/lib/api/utils";

export function buildAssignmentConfirmation(
  assignment: Assignment,
): ChatAssignmentConfirmationMessage {
  return {
    id: crypto.randomUUID(),
    role: "ai",
    kind: "assignment_confirmation",
    createdAt: new Date().toISOString(),
    payload: {
      assignmentId: assignment.id,
      title: assignment.title,
      dueLabel: formatDueDateTimeLabel(assignment.dueAt),
      subjectLabel: assignment.subject,
      classLinkLabel:
        assignment.subject === "No class" ? "No class linked" : assignment.subject,
      ctaLabel: "View Assignment",
      icon: "assignment",
    },
  };
}

export function buildExpenseConfirmation(
  expense: ExpenseItem,
  budgetStatus: BudgetStatus | null,
): ChatExpenseConfirmationMessage {
  return {
    id: crypto.randomUUID(),
    role: "ai",
    kind: "expense_confirmation",
    createdAt: new Date().toISOString(),
    payload: {
      expenseId: expense.id,
      label: expense.label,
      amountLabel: expense.amountLabel,
      categoryLabel: expense.categoryLabel,
      spentAtLabel: `${expense.dayLabel}, ${expense.timeLabel}`,
      budgetRemainingLabel: budgetStatus?.remainingLabel ?? "No active budget",
      budgetTotalLabel: budgetStatus?.totalLabel ?? "No active budget",
      progressPercent: budgetStatus?.progressPercent ?? 0,
      ctaLabel: "View Expenses",
      icon: "payments",
    },
  };
}
