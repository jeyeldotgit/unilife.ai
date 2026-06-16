import type { AiProposal } from "./ai-action";

export type ScheduleImportSourceType = "image" | "pdf" | "ics";

export type ScheduleImportStatus =
  | "parsing"
  | "ready_for_review"
  | "confirmed"
  | "partially_applied"
  | "failed";

export type ScheduleImportEntry = {
  id: string;
  selected: boolean;
  subject: string | null;
  room: string | null;
  instructor: string | null;
  recurrence: Record<string, unknown> | null;
  day_of_week: string | null;
  start_time: string | null;
  end_time: string | null;
  confidence: number | null;
  uncertain_fields: string[];
  duplicate_candidates: string[];
  conflict_candidates: string[];
  course_code?: string | null;
  section?: string | null;
  source_row?: string | null;
  parse_warnings?: string[];
};

export type ScheduleImportProposal = {
  id: string;
  source_type: ScheduleImportSourceType;
  source_fingerprint: string;
  timezone: string;
  raw_ocr_text_preview?: string | null;
  parser_version?: string | null;
  term_id?: string | null;
  entries: ScheduleImportEntry[];
  status: ScheduleImportStatus;
};

export type ScheduleImportHistory = {
  id: string;
  user_id: string;
  source_type: ScheduleImportSourceType;
  source_fingerprint: string;
  source_name: string;
  source_path: string | null;
  source_deleted_at: string | null;
  extracted_text_deleted_at: string | null;
  timezone: string;
  raw_ocr_text_preview: string | null;
  parser_version: string | null;
  term_id: string | null;
  proposal: ScheduleImportProposal;
  ai_proposal: AiProposal | null;
  approved_entry_ids: string[];
  status: ScheduleImportStatus;
  error: string | null;
  created_at: string;
  updated_at: string;
  confirmed_at: string | null;
};
