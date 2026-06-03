export type AssignmentStatus = "pending" | "in_progress" | "completed";

export type Assignment = {
  id: string;
  user_id: string;
  class_id: string | null; // optional link to a class
  title: string;
  description: string | null;
  due_date: string; // ISO 8601
  status: AssignmentStatus;
  priority: number; // 1 (low) to 3 (high)
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};
