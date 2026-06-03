export type Exam = {
  id: string;
  user_id: string;
  class_id: string | null;
  title: string;
  description: string | null;
  exam_date: string; // ISO 8601
  location: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};
