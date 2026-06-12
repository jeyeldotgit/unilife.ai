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

function toUtcMidnight(value: string) {
  const date = new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function diffCalendarDays(startDate: string, endDate: string) {
  const start = toUtcMidnight(startDate);
  const end = toUtcMidnight(endDate);

  if (!start || !end) return null;

  return Math.floor((end.getTime() - start.getTime()) / DAY_MS);
}

function diffCalendarDaysInclusive(startDate: string, endDate: string) {
  const difference = diffCalendarDays(startDate, endDate);
  return difference === null ? null : Math.max(1, difference + 1);
}

function addDays(dateString: string, days: number) {
  const date = toUtcMidnight(dateString);

  if (!date) return null;

  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function rankDeadlines(
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
      urgency_days: Math.max(0, diffCalendarDays(today, deadline.due_date) ?? 0),
    }));
}

export function buildFreeTimePlan(context: PlanningContext): FreeTimePlan | undefined {
  const currentMinutes = toMinutes(context.current_time);
  if (currentMinutes === null) return undefined;

  const classes = context.todays_classes
    .map((classItem) => ({
      ...classItem,
      startMinutes: toMinutes(classItem.start_time),
      endMinutes: toMinutes(classItem.end_time),
    }))
    .filter(
      (classItem): classItem is typeof classItem & {
        startMinutes: number;
        endMinutes: number;
      } => classItem.startMinutes !== null && classItem.endMinutes !== null,
    )
    .sort((left, right) => left.startMinutes - right.startMinutes);
  const currentClass =
    classes.find(
      (classItem) =>
        classItem.startMinutes <= currentMinutes && classItem.endMinutes > currentMinutes,
    ) ?? null;
  const nextClass =
    classes.find((classItem) => classItem.startMinutes > currentMinutes) ?? null;
  const windowStart = currentClass?.endMinutes ?? currentMinutes;
  const windowEnd = nextClass?.startMinutes ?? 24 * 60;

  return {
    window_minutes: Math.max(0, windowEnd - windowStart),
    current_class_subject: currentClass?.subject ?? null,
    next_class_subject: nextClass?.subject ?? null,
    next_class_time: nextClass?.start_time.slice(0, 5) ?? null,
    suggested_tasks: rankDeadlines(context.upcoming_deadlines, context.today).slice(0, 5),
  };
}

export function buildAllowanceForecast(
  context: PlanningContext,
): AllowanceForecast | undefined {
  if (
    context.budget_remaining === null ||
    context.budget_period_end_date === null ||
    context.avg_daily_spend === null
  ) {
    return undefined;
  }

  const daysLeft = diffCalendarDaysInclusive(
    context.today,
    context.budget_period_end_date,
  );
  if (daysLeft === null) return undefined;

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

export function buildDeterministicBriefing(context: PlanningContext): DailyBriefing {
  const focusTask = rankDeadlines(context.upcoming_deadlines, context.today)[0] ?? null;
  const classCount = context.todays_classes.length;
  const deadlineCount = context.upcoming_deadlines.length;
  const message = focusTask
    ? `Focus on ${focusTask.title} next. It is your most urgent upcoming ${focusTask.type}.`
    : classCount > 0
      ? `You have ${classCount} class${classCount === 1 ? "" : "es"} today and no upcoming deadlines.`
      : "Your schedule is clear and there are no upcoming deadlines.";

  return {
    class_count: classCount,
    deadline_count: deadlineCount,
    budget_remaining: context.budget_remaining,
    focus_task: focusTask,
    message,
    source: "deterministic",
  };
}

export function detectPlanningIntent(message: string) {
  const normalized = message.toLowerCase();

  if (
    /\b(allowance|budget|money|spend|spending|gastos|pera)\b/.test(normalized) &&
    /\b(last|forecast|run out|survive|enough|abot|kasya)\b/.test(normalized)
  ) {
    return "allowance_forecast" as const;
  }

  if (
    /\b(what should i do|what next|free time|available time|do right now|gagawin ko|anong gagawin)\b/.test(
      normalized,
    )
  ) {
    return "free_time_finder" as const;
  }

  return null;
}
