import type {
  Assignment,
  DashboardDeadlinePreview,
  Exam,
} from "@/lib/types";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function formatUrgencyLabel(label: string) {
  const lowerLabel = label.toLowerCase();
  return lowerLabel.charAt(0).toUpperCase() + lowerLabel.slice(1);
}

function toAssignmentDeadline(assignment: Assignment): DashboardDeadlinePreview {
  return {
    id: assignment.id,
    title: assignment.title,
    dueLabel: formatUrgencyLabel(assignment.urgency.label),
    tone:
      assignment.urgency.textColor === "#ba1a1a" ? "danger" : "neutral",
    kind: "assignment",
    href: "/assignments",
  };
}

function toExamDeadline(exam: Exam): DashboardDeadlinePreview {
  return {
    id: exam.id,
    title: exam.title,
    dueLabel: exam.countdownLabel,
    tone: exam.urgency.tone === "danger" ? "danger" : "neutral",
    kind: "exam",
    href: "/exams",
  };
}

export function getUpcomingDashboardDeadlines(
  assignments: Assignment[],
  exams: Exam[],
) {
  const now = Date.now();
  const windowEnd = now + SEVEN_DAYS_MS;

  const assignmentDeadlines = assignments
    .filter((assignment) => {
      if (assignment.status === "completed") {
        return false;
      }

      const dueAt = new Date(assignment.dueAt).getTime();
      return Number.isFinite(dueAt) && dueAt >= now && dueAt <= windowEnd;
    })
    .map((assignment) => ({
      preview: toAssignmentDeadline(assignment),
      at: new Date(assignment.dueAt).getTime(),
    }));

  const examDeadlines = exams
    .filter((exam) => {
      const examAt = new Date(exam.examAt).getTime();
      return Number.isFinite(examAt) && examAt >= now && examAt <= windowEnd;
    })
    .map((exam) => ({
      preview: toExamDeadline(exam),
      at: new Date(exam.examAt).getTime(),
    }));

  return [...assignmentDeadlines, ...examDeadlines]
    .sort((left, right) => left.at - right.at)
    .map((entry) => entry.preview);
}

export function getChatUpcomingDeadlines(
  assignments: Assignment[],
  exams: Exam[],
) {
  const now = Date.now();

  const assignmentDeadlines = assignments
    .filter((assignment) => assignment.status !== "completed")
    .map((assignment) => ({
      title: assignment.title,
      due_date: assignment.dueAt,
      type: "assignment" as const,
      status:
        assignment.status === "in_progress" ? "in_progress" : "pending",
    }));

  const examDeadlines = exams
    .filter((exam) => new Date(exam.examAt).getTime() >= now)
    .map((exam) => ({
      title: exam.title,
      due_date: exam.examAt,
      type: "exam" as const,
      status: "pending" as const,
    }));

  return [...assignmentDeadlines, ...examDeadlines].sort((left, right) => {
    return (
      new Date(left.due_date).getTime() - new Date(right.due_date).getTime()
    );
  });
}
