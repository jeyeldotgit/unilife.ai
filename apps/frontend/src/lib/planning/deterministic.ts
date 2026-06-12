import type {
  AllowanceForecast,
  DailyBriefing,
  FreeTimePlan,
  PlanningContext,
  PlanningDeadline,
  RankedPlanningTask,
} from "@unilife-ai/types";

const DAY_MS = 24 * 60 * 60 * 1000;

function toMinutes(value: string) {
  const match = /^(\d{2}):(\d{2})(?::\d{2})?$/.exec(value);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours <= 23 && minutes <= 59 ? hours * 60 + minutes : null;
}

function toLocalMidnight(value: string) {
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function diffDays(start: string, end: string) {
  const startDate = toLocalMidnight(start);
  const endDate = toLocalMidnight(end);
  if (!startDate || !endDate) return null;
  return Math.floor((endDate.getTime() - startDate.getTime()) / DAY_MS);
}

function addDays(dateString: string, days: number) {
  const date = toLocalMidnight(dateString);
  if (!date) return null;
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

export function rankPlanningDeadlines(
  deadlines: PlanningDeadline[],
  today: string,
): RankedPlanningTask[] {
  return deadlines
    .filter((deadline) => Number.isFinite(Date.parse(deadline.due_date)))
    .sort((left, right) => {
      const dueDifference = Date.parse(left.due_date) - Date.parse(right.due_date);
      if (dueDifference !== 0) return dueDifference;
      const priorityDifference = (right.priority ?? 0) - (left.priority ?? 0);
      if (priorityDifference !== 0) return priorityDifference;
      return Number(right.status === "in_progress") - Number(left.status === "in_progress");
    })
    .map((deadline) => ({
      ...deadline,
      urgency_days: Math.max(0, diffDays(today, deadline.due_date) ?? 0),
    }));
}

export function buildFreeTimePlan(context: PlanningContext): FreeTimePlan | null {
  const currentMinutes = toMinutes(context.current_time);
  if (currentMinutes === null) return null;

  const classes = context.todays_classes
    .map((item) => ({
      ...item,
      startMinutes: toMinutes(item.start_time),
      endMinutes: toMinutes(item.end_time),
    }))
    .filter(
      (item): item is typeof item & { startMinutes: number; endMinutes: number } =>
        item.startMinutes !== null && item.endMinutes !== null,
    )
    .sort((left, right) => left.startMinutes - right.startMinutes);
  const currentClass =
    classes.find(
      (item) => item.startMinutes <= currentMinutes && item.endMinutes > currentMinutes,
    ) ?? null;
  const nextClass = classes.find((item) => item.startMinutes > currentMinutes) ?? null;

  return {
    window_minutes: Math.max(
      0,
      (nextClass?.startMinutes ?? 24 * 60) - (currentClass?.endMinutes ?? currentMinutes),
    ),
    current_class_subject: currentClass?.subject ?? null,
    next_class_subject: nextClass?.subject ?? null,
    next_class_time: nextClass?.start_time.slice(0, 5) ?? null,
    suggested_tasks: rankPlanningDeadlines(context.upcoming_deadlines, context.today).slice(0, 5),
  };
}

export function buildAllowanceForecast(
  context: PlanningContext,
): AllowanceForecast | null {
  if (
    context.budget_remaining === null ||
    context.budget_period_end_date === null ||
    context.avg_daily_spend === null
  ) {
    return null;
  }

  const remainingDays = diffDays(context.today, context.budget_period_end_date);
  if (remainingDays === null) return null;
  const daysLeft = Math.max(1, remainingDays + 1);
  const runoutDays =
    context.avg_daily_spend > 0
      ? Math.max(0, Math.floor(context.budget_remaining / context.avg_daily_spend))
      : null;

  return {
    remaining: context.budget_remaining,
    days_left_in_cycle: daysLeft,
    avg_daily_spend: context.avg_daily_spend,
    projected_runout_days: runoutDays,
    projected_runout_date: runoutDays === null ? null : addDays(context.today, runoutDays),
    recommended_daily_limit: context.budget_remaining / daysLeft,
    will_last_cycle: runoutDays === null || runoutDays >= daysLeft,
  };
}

export function buildDailyBriefing(context: PlanningContext): DailyBriefing {
  const focusTask = rankPlanningDeadlines(context.upcoming_deadlines, context.today)[0] ?? null;
  const classCount = context.todays_classes.length;
  const message = focusTask
    ? `Focus on ${focusTask.title} next. It is your most urgent upcoming ${focusTask.type}.`
    : classCount > 0
      ? `You have ${classCount} class${classCount === 1 ? "" : "es"} today and no upcoming deadlines.`
      : "Your schedule is clear and there are no upcoming deadlines.";

  return {
    class_count: classCount,
    deadline_count: context.upcoming_deadlines.length,
    budget_remaining: context.budget_remaining,
    focus_task: focusTask,
    message,
    source: "deterministic",
  };
}
