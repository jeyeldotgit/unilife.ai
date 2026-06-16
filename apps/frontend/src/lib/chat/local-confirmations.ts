import type {
  Assignment,
  BudgetStatus,
  ChatAssignmentConfirmationMessage,
  ChatClassConfirmationMessage,
  ChatExpenseConfirmationMessage,
  ChatExamConfirmationMessage,
  Exam,
  ExpenseItem,
  DayOfWeek,
} from "@/lib/types";

import { formatDateTime } from "@unilife-ai/shared";
import { getDayLabel } from "@/lib/api/utils";

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
      dueLabel: formatDateTime(assignment.dueAt),
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

export function buildClassConfirmation(
  classItem: {
    id: string;
    subject: string;
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    room?: string | null;
  },
): ChatClassConfirmationMessage {
  return {
    id: crypto.randomUUID(),
    role: "ai",
    kind: "class_confirmation",
    createdAt: new Date().toISOString(),
    payload: {
      classId: classItem.id,
      subject: classItem.subject,
      meetingLabel: `${getDayLabel(classItem.dayOfWeek)} - ${classItem.startTime}-${classItem.endTime}`,
      locationLabel: classItem.room?.trim() ? classItem.room : "No room set",
      ctaLabel: "View Schedule",
      icon: "calendar_add_on",
    },
  };
}

export function buildExamConfirmation(
  exam: Exam,
): ChatExamConfirmationMessage {
  return {
    id: crypto.randomUUID(),
    role: "ai",
    kind: "exam_confirmation",
    createdAt: new Date().toISOString(),
    payload: {
      examId: exam.id,
      title: exam.title,
      subjectLabel: exam.subject,
      examDateTimeLabel: formatDateTime(exam.examAt),
      locationLabel: exam.location ?? "No location",
      ctaLabel: "View Exams",
      icon: "quiz",
    },
  };
}
