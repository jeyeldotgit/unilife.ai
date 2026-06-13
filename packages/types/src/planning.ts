export type PlanningClass = {
  subject: string;
  start_time: string;
  end_time: string;
};

export type PlanningDeadline = {
  id?: string;
  title: string;
  due_date: string;
  type: "assignment" | "exam";
  status: "pending" | "in_progress";
  subject?: string;
  priority?: number;
};

export type PlanningContext = {
  today: string;
  current_time: string;
  todays_classes: PlanningClass[];
  upcoming_deadlines: PlanningDeadline[];
  budget_remaining: number | null;
  budget_period_end_date: string | null;
  avg_daily_spend: number | null;
};

export type ScheduleInsightContext = Pick<
  PlanningContext,
  "today" | "current_time" | "todays_classes"
>;

export type RankedPlanningTask = PlanningDeadline & {
  urgency_days: number;
};

export type FreeTimePlan = {
  window_minutes: number;
  current_class_subject: string | null;
  next_class_subject: string | null;
  next_class_time: string | null;
  suggested_tasks: RankedPlanningTask[];
};

export type AllowanceForecast = {
  remaining: number;
  days_left_in_cycle: number;
  avg_daily_spend: number;
  projected_runout_days: number | null;
  projected_runout_date: string | null;
  recommended_daily_limit: number;
  will_last_cycle: boolean;
};

export type DailyBriefing = {
  class_count: number;
  deadline_count: number;
  budget_remaining: number | null;
  focus_task: RankedPlanningTask | null;
  message: string;
  source: "ai" | "deterministic";
};

export type ScheduleInsight = {
  class_count: number;
  next_class_subject: string | null;
  free_minutes_before_next_class: number | null;
  message: string;
  source: "ai" | "deterministic";
};
