import Dexie, { type Table } from "dexie";
import type {
  Assignment,
  AcademicTerm,
  AiActionHistory,
  Budget,
  BudgetRevision,
  ClassRecord,
  Exam,
  Expense,
  HolidayExclusion,
  Notification,
  NotificationSettings,
  RecurrenceException,
  RecurrenceOccurrence,
  RecurrenceSeries,
  SyncQueueItem,
  SyncRecoverySnapshot,
} from "@unilife-ai/types";

export type SyncMetaEntity =
  | "academic_term"
  | "class"
  | "assignment"
  | "exam"
  | "expense"
  | "budget"
  | "budget_revision"
  | "recurrence_series"
  | "recurrence_occurrence"
  | "recurrence_exception"
  | "holiday_exclusion"
  | "ai_action";

export type SyncMetaRecord = {
  id: string;
  user_id: string;
  entity_type: SyncMetaEntity;
  last_hydrated_at: string | null;
  last_successful_sync_at: string | null;
};

export class UniLifeDB extends Dexie {
  classes!: Table<ClassRecord, string>;
  academic_terms!: Table<AcademicTerm, string>;
  assignments!: Table<Assignment, string>;
  exams!: Table<Exam, string>;
  expenses!: Table<Expense, string>;
  budgets!: Table<Budget, string>;
  budget_revisions!: Table<BudgetRevision, string>;
  recurrence_series!: Table<RecurrenceSeries, string>;
  recurrence_occurrences!: Table<RecurrenceOccurrence, string>;
  recurrence_exceptions!: Table<RecurrenceException, string>;
  holiday_exclusions!: Table<HolidayExclusion, string>;
  notifications!: Table<Notification, string>;
  notification_settings!: Table<NotificationSettings, string>;
  sync_queue!: Table<SyncQueueItem, string>;
  sync_recovery!: Table<SyncRecoverySnapshot, string>;
  sync_meta!: Table<SyncMetaRecord, string>;
  ai_actions!: Table<AiActionHistory, string>;

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

    this.version(2).stores({
      classes: "id, user_id, day_of_week, is_active, deleted_at, updated_at",
      assignments:
        "id, user_id, class_id, due_date, status, deleted_at, updated_at",
      exams: "id, user_id, class_id, exam_date, deleted_at, updated_at",
      expenses:
        "id, user_id, budget_id, category, spent_at, deleted_at, updated_at",
      budgets: "id, user_id, start_date, end_date, updated_at",
      notifications:
        "id, user_id, entity_type, entity_id, scheduled_at, status",
      sync_queue:
        "id, user_id, entity_type, entity_id, status, created_at, [user_id+status+created_at]",
      sync_meta: "id, user_id, entity_type",
    });

    this.version(3).stores({
      classes: "id, user_id, day_of_week, is_active, deleted_at, updated_at",
      assignments:
        "id, user_id, class_id, due_date, status, deleted_at, updated_at",
      exams: "id, user_id, class_id, exam_date, deleted_at, updated_at",
      expenses:
        "id, user_id, budget_id, category, spent_at, deleted_at, updated_at",
      budgets: "id, user_id, start_date, end_date, updated_at",
      notifications:
        "id, user_id, entity_type, entity_id, scheduled_at, status",
      sync_queue:
        "id, user_id, entity_type, entity_id, status, created_at, [user_id+status+created_at], [entity_type+entity_id+status]",
      sync_meta: "id, user_id, entity_type",
    });

    this.version(4).stores({
      classes: "id, user_id, day_of_week, is_active, deleted_at, updated_at",
      assignments:
        "id, user_id, class_id, due_date, status, deleted_at, updated_at",
      exams: "id, user_id, class_id, exam_date, deleted_at, updated_at",
      expenses:
        "id, user_id, budget_id, category, spent_at, deleted_at, updated_at",
      budgets: "id, user_id, start_date, end_date, updated_at",
      recurrence_series: "id, user_id, entity_type, updated_at, deleted_at",
      recurrence_occurrences:
        "id, user_id, series_id, entity_id, effective_start_at, updated_at, deleted_at",
      recurrence_exceptions:
        "id, user_id, series_id, original_start_at, updated_at, deleted_at",
      holiday_exclusions: "id, user_id, date, updated_at, deleted_at",
      notifications:
        "id, user_id, entity_type, entity_id, scheduled_at, status",
      sync_queue:
        "id, user_id, entity_type, entity_id, status, created_at, [user_id+status+created_at], [entity_type+entity_id+status]",
      sync_meta: "id, user_id, entity_type",
    });

    this.version(5).stores({
      classes: "id, user_id, day_of_week, is_active, deleted_at, updated_at",
      assignments:
        "id, user_id, class_id, due_date, status, deleted_at, updated_at",
      exams: "id, user_id, class_id, exam_date, deleted_at, updated_at",
      expenses:
        "id, user_id, budget_id, category, spent_at, deleted_at, updated_at",
      budgets: "id, user_id, start_date, end_date, updated_at",
      recurrence_series: "id, user_id, entity_type, updated_at, deleted_at",
      recurrence_occurrences:
        "id, user_id, series_id, entity_id, effective_start_at, updated_at, deleted_at",
      recurrence_exceptions:
        "id, user_id, series_id, original_start_at, updated_at, deleted_at",
      holiday_exclusions: "id, user_id, date, updated_at, deleted_at",
      notifications:
        "id, user_id, entity_type, entity_id, scheduled_at, status",
      sync_queue:
        "id, user_id, entity_type, entity_id, status, created_at, [user_id+status+created_at], [entity_type+entity_id+status]",
      sync_meta: "id, user_id, entity_type",
      ai_actions: "id, user_id, status, processing_layer, created_at, updated_at",
    });

    this.version(6).stores({
      classes: "id, user_id, day_of_week, is_active, deleted_at, updated_at",
      assignments: "id, user_id, class_id, due_date, status, deleted_at, updated_at",
      exams: "id, user_id, class_id, exam_date, deleted_at, updated_at",
      expenses: "id, user_id, budget_id, refund_of_expense_id, category, spent_at, deleted_at, updated_at",
      budgets: "id, user_id, start_date, end_date, updated_at",
      budget_revisions: "id, user_id, budget_id, mutation_id, changed_at",
      recurrence_series: "id, user_id, entity_type, updated_at, deleted_at",
      recurrence_occurrences: "id, user_id, series_id, entity_id, effective_start_at, updated_at, deleted_at",
      recurrence_exceptions: "id, user_id, series_id, original_start_at, updated_at, deleted_at",
      holiday_exclusions: "id, user_id, date, updated_at, deleted_at",
      notifications: "id, user_id, entity_type, entity_id, scheduled_at, status",
      sync_queue: "id, user_id, entity_type, entity_id, status, created_at, [user_id+status+created_at], [entity_type+entity_id+status]",
      sync_meta: "id, user_id, entity_type",
      ai_actions: "id, user_id, status, processing_layer, created_at, updated_at",
    });

    this.version(7).stores({
      classes: "id, user_id, day_of_week, is_active, deleted_at, updated_at",
      assignments: "id, user_id, class_id, due_date, status, deleted_at, updated_at",
      exams: "id, user_id, class_id, exam_date, deleted_at, updated_at",
      expenses: "id, user_id, budget_id, refund_of_expense_id, category, spent_at, deleted_at, updated_at",
      budgets: "id, user_id, start_date, end_date, updated_at",
      budget_revisions: "id, user_id, budget_id, mutation_id, changed_at",
      recurrence_series: "id, user_id, entity_type, updated_at, deleted_at",
      recurrence_occurrences: "id, user_id, series_id, entity_id, effective_start_at, updated_at, deleted_at",
      recurrence_exceptions: "id, user_id, series_id, original_start_at, updated_at, deleted_at",
      holiday_exclusions: "id, user_id, date, updated_at, deleted_at",
      notifications: "id, user_id, category, logical_item_id, entity_type, entity_id, scheduled_at, status",
      notification_settings: "user_id, updated_at",
      sync_queue: "id, user_id, entity_type, entity_id, status, created_at, [user_id+status+created_at], [entity_type+entity_id+status]",
      sync_recovery: "id, user_id, queue_item_id, entity_type, entity_id, created_at, restored_at",
      sync_meta: "id, user_id, entity_type",
      ai_actions: "id, user_id, status, processing_layer, created_at, updated_at",
    });

    this.version(8).stores({
      academic_terms: "id, user_id, status, updated_at, deleted_at",
      classes: "id, user_id, term_id, day_of_week, is_active, deleted_at, updated_at",
      assignments: "id, user_id, class_id, due_date, status, deleted_at, updated_at",
      exams: "id, user_id, class_id, exam_date, deleted_at, updated_at",
      expenses: "id, user_id, budget_id, refund_of_expense_id, category, spent_at, deleted_at, updated_at",
      budgets: "id, user_id, start_date, end_date, updated_at",
      budget_revisions: "id, user_id, budget_id, mutation_id, changed_at",
      recurrence_series: "id, user_id, entity_type, updated_at, deleted_at",
      recurrence_occurrences: "id, user_id, series_id, entity_id, effective_start_at, updated_at, deleted_at",
      recurrence_exceptions: "id, user_id, series_id, original_start_at, updated_at, deleted_at",
      holiday_exclusions: "id, user_id, date, updated_at, deleted_at",
      notifications: "id, user_id, category, logical_item_id, entity_type, entity_id, scheduled_at, status",
      notification_settings: "user_id, updated_at",
      sync_queue: "id, user_id, entity_type, entity_id, status, created_at, [user_id+status+created_at], [entity_type+entity_id+status]",
      sync_recovery: "id, user_id, queue_item_id, entity_type, entity_id, created_at, restored_at",
      sync_meta: "id, user_id, entity_type",
      ai_actions: "id, user_id, status, processing_layer, created_at, updated_at",
    });
  }
}

export const db = new UniLifeDB();
