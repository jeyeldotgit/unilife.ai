import type { RecurrenceReference, ScheduleConflict } from "./recurrence";

export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type ClassRecord = {
  id: string; // UUID (client-generated)
  user_id: string;
  term_id?: string | null;
  subject: string;
  room: string | null;
  instructor: string | null;
  day_of_week: DayOfWeek;
  start_time: string; // "HH:MM" 24-hour format
  end_time: string; // "HH:MM" 24-hour format
  color: string | null; // hex color for UI
  is_active: boolean;
  recurrence?: RecurrenceReference | null;
  conflict_warnings?: ScheduleConflict[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null; // soft delete
};
