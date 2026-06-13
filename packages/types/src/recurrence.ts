import type { DayOfWeek } from "./class";

export type RecurrenceFrequency = "daily" | "weekly";
export type RecurrenceEditScope = "occurrence" | "future" | "series";
export type RecurrenceEntityType = "class" | "assignment" | "expense";
export type RecurrenceExceptionType = "modified" | "cancelled";

export type RecurrenceRule = {
  frequency: RecurrenceFrequency;
  interval: number;
  weekdays: DayOfWeek[];
  timezone: string;
  starts_at: string;
  ends_at: string | null;
};

export type RecurrenceSeries = {
  id: string;
  user_id: string;
  entity_type: RecurrenceEntityType;
  frequency: RecurrenceFrequency;
  interval: number;
  weekdays: DayOfWeek[];
  timezone: string;
  starts_at: string;
  ends_at: string | null;
  revision: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type RecurrenceOccurrence = {
  id: string;
  series_id: string;
  user_id: string;
  entity_type: RecurrenceEntityType;
  entity_id: string;
  original_start_at: string;
  effective_start_at: string;
  effective_end_at: string;
  source_revision: number;
  is_cancelled: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type RecurrenceException = {
  id: string;
  series_id: string;
  user_id: string;
  entity_type: RecurrenceEntityType;
  original_start_at: string;
  exception_type: RecurrenceExceptionType;
  override_start_at: string | null;
  override_end_at: string | null;
  override_payload: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type HolidayExclusion = {
  id: string;
  user_id: string;
  date: string;
  label: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type RecurrenceReference = {
  series_id: string | null;
  occurrence_id: string | null;
  original_start_at: string | null;
  effective_start_at: string | null;
  effective_end_at: string | null;
  source_revision: number | null;
  timezone: string | null;
  rule: RecurrenceRule | null;
  edit_scope?: RecurrenceEditScope;
};

export type ScheduleConflict = {
  id: string;
  entity_type: "class" | "assignment";
  entity_id: string;
  related_entity_type: "class" | "assignment";
  related_entity_id: string;
  starts_at: string;
  ends_at: string;
  related_starts_at: string;
  related_ends_at: string;
  title: string;
  related_title: string;
};
