import { getUpcomingDashboardDeadlines } from "@/lib/api/deadlines";
import type {
  Assignment,
  BudgetStatus,
  DashboardDeadlinePreview,
  Exam,
  ScheduleAgendaItem,
  ScheduleWeek,
} from "@/lib/types";

type DashboardPageData = {
  todayClasses: ScheduleAgendaItem[];
  upcomingDeadlines: DashboardDeadlinePreview[];
  budget: BudgetStatus | null;
  scheduleAvailable: boolean;
  deadlinesAvailable: boolean;
  deadlinesPartiallyAvailable: boolean;
  budgetAvailable: boolean;
};

function getTodayClasses(todayClasses: ScheduleAgendaItem[]) {
  return [...todayClasses].sort((left, right) => {
    return left.startTime.localeCompare(right.startTime);
  });
}

export function buildDashboardPageData({
  scheduleResult,
  assignmentsResult,
  examsResult,
  budgetResult,
}: {
  scheduleResult: PromiseSettledResult<ScheduleWeek>;
  assignmentsResult: PromiseSettledResult<Assignment[]>;
  examsResult: PromiseSettledResult<Exam[]>;
  budgetResult: PromiseSettledResult<BudgetStatus | null>;
}): DashboardPageData {
  const todayClasses =
    scheduleResult.status === "fulfilled"
      ? getTodayClasses(scheduleResult.value.todayClasses)
      : [];
  const assignmentDeadlines =
    assignmentsResult.status === "fulfilled" ? assignmentsResult.value : [];
  const examDeadlines = examsResult.status === "fulfilled" ? examsResult.value : [];
  const deadlinesAvailable =
    assignmentsResult.status === "fulfilled" || examsResult.status === "fulfilled";

  return {
    todayClasses,
    upcomingDeadlines: getUpcomingDashboardDeadlines(
      assignmentDeadlines,
      examDeadlines,
    ),
    budget: budgetResult.status === "fulfilled" ? budgetResult.value : null,
    scheduleAvailable: scheduleResult.status === "fulfilled",
    deadlinesAvailable,
    deadlinesPartiallyAvailable:
      deadlinesAvailable &&
      !(
        assignmentsResult.status === "fulfilled" &&
        examsResult.status === "fulfilled"
      ),
    budgetAvailable: budgetResult.status === "fulfilled",
  };
}
