import Dexie, { type Table } from "dexie";
import type {
  ClassRecord,
  Assignment,
  Exam,
  Expense,
  Budget,
  Notification,
  SyncQueueItem,
} from "@unilife-ai/types";

export class UniLifeDB extends Dexie {
  classes!: Table<ClassRecord, string>;
  assignments!: Table<Assignment, string>;
  exams!: Table<Exam, string>;
  expenses!: Table<Expense, string>;
  budgets!: Table<Budget, string>;
  notifications!: Table<Notification, string>;
  sync_queue!: Table<SyncQueueItem, string>;

  constructor() {
    super("unilife");

    this.version(1).stores({
      classes: "id, user_id, day_of_week, is_active, deleted_at",
      assignments: "id, user_id, class_id, due_date, status, deleted_at",
      exams: "id, user_id, class_id, exam_date, deleted_at",
      expenses: "id, user_id, budget_id, category, spent_at, deleted_at",
      budgets: "id, user_id, start_date, end_date",
      notifications:
        "id, user_id, entity_type, entity_id, scheduled_at, status",
      sync_queue: "id, user_id, entity_type, entity_id, status, created_at",
    });
  }
}

export const db = new UniLifeDB();
