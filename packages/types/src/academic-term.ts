export type AcademicTermStatus = "active" | "archived";

export type AcademicTerm = {
  id: string;
  user_id: string;
  name: string;
  status: AcademicTermStatus;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  deleted_at: string | null;
};
