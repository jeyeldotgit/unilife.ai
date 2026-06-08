import DashboardClient from "@/app/(app)/dashboard/DashboardClient";
import { getAssignments } from "@/lib/api/assignments";
import { getBudgetStatus } from "@/lib/api/budget";
import { getClasses } from "@/lib/api/schedule";
import type { Assignment, ScheduleAgendaItem } from "@/lib/types";

type DashboardDeadlinePreview = {
  id: string;
  title: string;
  dueLabel: string;
  tone: "danger" | "neutral";
};

function formatUrgencyLabel(label: string) {
  const lowerLabel = label.toLowerCase();
  return lowerLabel.charAt(0).toUpperCase() + lowerLabel.slice(1);
}

function toDashboardDeadline(assignment: Assignment): DashboardDeadlinePreview {
  return {
    id: assignment.id,
    title: assignment.title,
    dueLabel: formatUrgencyLabel(assignment.urgency.label),
    tone:
      assignment.urgency.textColor === "#ba1a1a" ? "danger" : "neutral",
  };
}

function getUpcomingDeadlines(assignments: Assignment[]) {
  const now = Date.now();
  const windowEnd = now + 7 * 24 * 60 * 60 * 1000;

  return assignments
    .filter((assignment) => {
      if (assignment.status === "completed") {
        return false;
      }

      const dueAt = new Date(assignment.dueAt).getTime();
      return Number.isFinite(dueAt) && dueAt >= now && dueAt <= windowEnd;
    })
    .sort((left, right) => {
      return new Date(left.dueAt).getTime() - new Date(right.dueAt).getTime();
    })
    .map(toDashboardDeadline);
}

function getTodayClasses(todayClasses: ScheduleAgendaItem[]) {
  return [...todayClasses].sort((left, right) => {
    return left.startTime.localeCompare(right.startTime);
  });
}

export default async function DashboardPage() {
  const [scheduleResult, assignmentsResult, budgetResult] = await Promise.allSettled(
    [getClasses(), getAssignments(), getBudgetStatus()],
  );

  const todayClasses =
    scheduleResult.status === "fulfilled"
      ? getTodayClasses(scheduleResult.value.todayClasses)
      : [];
  const upcomingDeadlines =
    assignmentsResult.status === "fulfilled"
      ? getUpcomingDeadlines(assignmentsResult.value)
      : [];
  const budget = budgetResult.status === "fulfilled" ? budgetResult.value : null;

  return (
    <DashboardClient
      todayClasses={todayClasses}
      upcomingDeadlines={upcomingDeadlines}
      budget={budget}
      scheduleAvailable={scheduleResult.status === "fulfilled"}
      assignmentsAvailable={assignmentsResult.status === "fulfilled"}
      budgetAvailable={budgetResult.status === "fulfilled"}
    />
  );
}
