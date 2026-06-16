import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Assignment,
  AcademicTerm,
  Budget,
  ClassRecord,
  Exam,
  Expense,
  AiActionHistory,
  RecurrenceReference,
  SyncItemResult,
} from "@unilife-ai/types";
import { z } from "zod";

import type { UpdateAssignmentInput } from "./assignments.service.js";
import { AssignmentsService } from "./assignments.service.js";
import type { UpdateBudgetInput } from "./budgets.service.js";
import { BudgetsService } from "./budgets.service.js";
import type { UpdateClassInput } from "./classes.service.js";
import { ClassesService } from "./classes.service.js";
import type { UpdateExamInput } from "./exams.service.js";
import { ExamsService } from "./exams.service.js";
import { ExpensesService } from "./expenses.service.js";
import { AssignmentsRepository } from "../repositories/assignments.repository.js";
import { BudgetsRepository } from "../repositories/budgets.repository.js";
import { ClassesRepository } from "../repositories/classes.repository.js";
import { ExamsRepository } from "../repositories/exams.repository.js";
import { ExpensesRepository } from "../repositories/expenses.repository.js";
import { RecurrenceRepository, type RecurrenceSyncEntity } from "../repositories/recurrence.repository.js";
import { AIActionsRepository } from "../repositories/ai-actions.repository.js";
import { AcademicTermsRepository } from "../repositories/academic-terms.repository.js";

const assignmentStatusSchema = z.enum(["pending", "in_progress", "completed"]);
const budgetPeriodSchema = z.enum(["daily", "weekly", "biweekly", "monthly"]);
const dayOfWeekSchema = z.enum([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);
const expenseCategorySchema = z.enum([
  "food",
  "transportation",
  "school",
  "entertainment",
  "miscellaneous",
]);
const isoDateTimeSchema = z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
  message: "Invalid ISO datetime.",
});
const isoDateSchema = z
  .string()
  .refine(
    (value) =>
      /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`)),
    {
      message: "Invalid ISO date.",
    },
  );
const timeOfDaySchema = z.string().regex(/^\d{2}:\d{2}$/, "Invalid time value.");
const nullableTrimmedString = (max: number) =>
  z.string().trim().min(1).max(max).nullable().optional();
const optionalTrimmedString = (max: number) => z.string().trim().min(1).max(max).optional();

const createClassPayloadSchema = z.object({
  term_id: z.string().uuid().nullable().optional(),
  subject: z.string().trim().min(1).max(255),
  room: optionalTrimmedString(255),
  instructor: optionalTrimmedString(255),
  day_of_week: dayOfWeekSchema,
  start_time: timeOfDaySchema,
  end_time: timeOfDaySchema,
  color: optionalTrimmedString(32),
  is_active: z.boolean().optional(),
  recurrence: z.record(z.string(), z.unknown()).nullable().optional(),
  created_at: isoDateTimeSchema,
  updated_at: isoDateTimeSchema,
});
const updateClassPayloadSchema = z.object({
  term_id: z.string().uuid().nullable().optional(),
  subject: z.string().trim().min(1).max(255).optional(),
  room: nullableTrimmedString(255),
  instructor: nullableTrimmedString(255),
  day_of_week: dayOfWeekSchema.optional(),
  start_time: timeOfDaySchema.optional(),
  end_time: timeOfDaySchema.optional(),
  color: nullableTrimmedString(32),
  is_active: z.boolean().optional(),
  recurrence: z.record(z.string(), z.unknown()).nullable().optional(),
  edit_scope: z.enum(["occurrence", "future", "series"]).optional(),
  updated_at: isoDateTimeSchema,
});
const createAssignmentPayloadSchema = z.object({
  title: z.string().trim().min(1).max(255),
  due_date: isoDateTimeSchema,
  class_id: z.string().uuid().nullable().optional(),
  description: optionalTrimmedString(2000),
  priority: z.number().int().min(1).max(3).optional(),
  status: assignmentStatusSchema.optional(),
  recurrence: z.record(z.string(), z.unknown()).nullable().optional(),
  created_at: isoDateTimeSchema,
  updated_at: isoDateTimeSchema,
});
const updateAssignmentPayloadSchema = z.object({
  title: z.string().trim().min(1).max(255).optional(),
  due_date: isoDateTimeSchema.optional(),
  class_id: z.string().uuid().nullable().optional(),
  description: nullableTrimmedString(2000),
  status: assignmentStatusSchema.optional(),
  priority: z.number().int().min(1).max(3).optional(),
  recurrence: z.record(z.string(), z.unknown()).nullable().optional(),
  edit_scope: z.enum(["occurrence", "future", "series"]).optional(),
  updated_at: isoDateTimeSchema,
});
const createExamPayloadSchema = z.object({
  title: z.string().trim().min(1).max(255),
  exam_date: isoDateTimeSchema,
  class_id: z.string().uuid().nullable().optional(),
  description: optionalTrimmedString(2000),
  location: optionalTrimmedString(255),
  created_at: isoDateTimeSchema,
  updated_at: isoDateTimeSchema,
});
const updateExamPayloadSchema = z.object({
  title: z.string().trim().min(1).max(255).optional(),
  exam_date: isoDateTimeSchema.optional(),
  class_id: z.string().uuid().nullable().optional(),
  description: nullableTrimmedString(2000),
  location: nullableTrimmedString(255),
  updated_at: isoDateTimeSchema,
});
const createExpensePayloadSchema = z.object({
  budget_id: z.string().uuid().nullable().optional(),
  refund_of_expense_id: z.string().uuid().nullable().optional(),
  amount: z.number().refine((value) => value !== 0),
  category: expenseCategorySchema,
  description: optionalTrimmedString(2000),
  spent_at: isoDateTimeSchema.optional(),
  recurrence: z.record(z.string(), z.unknown()).nullable().optional(),
  created_at: isoDateTimeSchema,
  updated_at: isoDateTimeSchema,
});
const createBudgetPayloadSchema = z.object({
  amount: z.number().positive(),
  period: budgetPeriodSchema,
  start_date: isoDateSchema,
  end_date: isoDateSchema,
  created_at: isoDateTimeSchema,
  updated_at: isoDateTimeSchema,
});
const updateBudgetPayloadSchema = z.object({
  amount: z.number().positive().optional(),
  period: budgetPeriodSchema.optional(),
  start_date: isoDateSchema.optional(),
  end_date: isoDateSchema.optional(),
  updated_at: isoDateTimeSchema,
  mutation_id: z.string().uuid(),
});
const aiActionPayloadSchema = z.object({
  proposal: z.record(z.string(), z.unknown()),
  status: z.string(),
  processing_layer: z.enum(["local", "gemini"]),
  created_at: isoDateTimeSchema,
  updated_at: isoDateTimeSchema,
});
const academicTermPayloadSchema = z.object({
  name: z.string().trim().min(1).max(255),
  status: z.enum(["active", "archived"]),
  created_at: isoDateTimeSchema.optional(),
  updated_at: isoDateTimeSchema,
  archived_at: isoDateTimeSchema.nullable().optional(),
  deleted_at: isoDateTimeSchema.nullable().optional(),
});

export type SyncEntityType =
  | "academic_term"
  | "class"
  | "assignment"
  | "exam"
  | "expense"
  | "budget"
  | "recurrence_series"
  | "recurrence_occurrence"
  | "recurrence_exception"
  | "ai_action";
export type SyncOperation = "create" | "update" | "delete";

export type SyncPushItem = {
  id: string;
  entity_type: SyncEntityType;
  entity_id: string;
  operation: SyncOperation;
  payload: Record<string, unknown>;
};

type SyncPushResult = {
  synced: string[];
  failed: string[];
  results: SyncItemResult[];
};

type SyncDependencies = {
  aiActionsRepository: Pick<AIActionsRepository, "upsert">;
  academicTermsRepository: Pick<AcademicTermsRepository, "upsert">;
  assignmentsRepository: Pick<
    AssignmentsRepository,
    "findByIdIncludingDeletedForUser" | "existsForOtherUserIncludingDeleted" | "upsert"
  >;
  assignmentsService: Pick<AssignmentsService, "updateAssignment" | "deleteAssignment">;
  budgetsRepository: Pick<BudgetsRepository, "findByIdForUser" | "existsForOtherUser" | "upsert">;
  budgetsService: Pick<BudgetsService, "updateBudget">;
  classesRepository: Pick<
    ClassesRepository,
    "findByIdIncludingDeletedForUser" | "existsForOtherUserIncludingDeleted" | "upsert"
  >;
  classesService: Pick<ClassesService, "updateClass" | "deleteClass">;
  examsRepository: Pick<
    ExamsRepository,
    "findByIdIncludingDeletedForUser" | "existsForOtherUserIncludingDeleted" | "upsert"
  >;
  examsService: Pick<ExamsService, "updateExam" | "deleteExam">;
  expensesRepository: Pick<
    ExpensesRepository,
    "findByIdIncludingDeletedForUser" | "existsForOtherUserIncludingDeleted" | "upsert"
  >;
  expensesService: Pick<ExpensesService, "createExpense" | "deleteExpense">;
  recurrenceRepository: Pick<RecurrenceRepository, "upsertForUser">;
};

function isOlderTimestamp(incomingUpdatedAt: string, currentUpdatedAt: string) {
  return Date.parse(incomingUpdatedAt) < Date.parse(currentUpdatedAt);
}

function normalizeOptionalString(value: string | undefined) {
  return value ?? null;
}

function normalizeRecurrenceReference(
  value: Record<string, unknown> | null | undefined,
): RecurrenceReference | null {
  if (!value) {
    return null;
  }

  return value as unknown as RecurrenceReference;
}

function toRecordPayload(payload: Record<string, unknown>) {
  return payload;
}

export class SyncService {
  private readonly dependencies: SyncDependencies;

  constructor(supabase: SupabaseClient, private readonly userId: string, dependencies?: Partial<SyncDependencies>) {
    this.dependencies = {
      aiActionsRepository:
        dependencies?.aiActionsRepository ?? new AIActionsRepository(supabase),
      academicTermsRepository:
        dependencies?.academicTermsRepository ?? new AcademicTermsRepository(supabase),
      classesService: dependencies?.classesService ?? new ClassesService(supabase, userId),
      assignmentsService:
        dependencies?.assignmentsService ?? new AssignmentsService(supabase, userId),
      examsService: dependencies?.examsService ?? new ExamsService(supabase, userId),
      expensesService: dependencies?.expensesService ?? new ExpensesService(supabase, userId),
      budgetsService: dependencies?.budgetsService ?? new BudgetsService(supabase, userId),
      classesRepository:
        dependencies?.classesRepository ?? new ClassesRepository(supabase),
      assignmentsRepository:
        dependencies?.assignmentsRepository ?? new AssignmentsRepository(supabase),
      examsRepository: dependencies?.examsRepository ?? new ExamsRepository(supabase),
      expensesRepository: dependencies?.expensesRepository ?? new ExpensesRepository(supabase),
      recurrenceRepository: dependencies?.recurrenceRepository ?? new RecurrenceRepository(supabase),
      budgetsRepository: dependencies?.budgetsRepository ?? new BudgetsRepository(supabase),
    };
  }

  async push(items: SyncPushItem[]): Promise<SyncPushResult> {
    const synced: string[] = [];
    const failed: string[] = [];
    const results: SyncItemResult[] = [];

    for (const item of items) {
      try {
        const winningSnapshot = await this.findNewerWinningSnapshot(item);
        if (winningSnapshot) {
          synced.push(item.id);
          results.push({
            id: item.id,
            status: "replaced",
            reason: "A newer remote revision replaced this local change.",
            winning_snapshot: winningSnapshot,
          });
          continue;
        }
        const success = await this.processItem(item);
        (success ? synced : failed).push(item.id);
        results.push({
          id: item.id,
          status: success ? "synced" : "failed",
          reason: success ? null : "The server could not apply this change.",
          winning_snapshot: null,
        });
      } catch {
        failed.push(item.id);
        results.push({
          id: item.id,
          status: "failed",
          reason: "The server could not apply this change.",
          winning_snapshot: null,
        });
      }
    }

    return { synced, failed, results };
  }

  private async findNewerWinningSnapshot(item: SyncPushItem) {
    const localTimestamp =
      typeof item.payload.updated_at === "string"
        ? item.payload.updated_at
        : typeof item.payload.deleted_at === "string"
          ? item.payload.deleted_at
          : null;
    if (!localTimestamp) {
      return null;
    }

    let current: { updated_at: string } | null = null;
    try {
      switch (item.entity_type) {
        case "class":
          current = await this.dependencies.classesRepository.findByIdIncludingDeletedForUser(
            item.entity_id,
            this.userId,
          );
          break;
        case "assignment":
          current = await this.dependencies.assignmentsRepository.findByIdIncludingDeletedForUser(
            item.entity_id,
            this.userId,
          );
          break;
        case "exam":
          current = await this.dependencies.examsRepository.findByIdIncludingDeletedForUser(
            item.entity_id,
            this.userId,
          );
          break;
        case "expense":
          current = await this.dependencies.expensesRepository.findByIdIncludingDeletedForUser(
            item.entity_id,
            this.userId,
          );
          break;
        case "budget":
          current = await this.dependencies.budgetsRepository.findByIdForUser(
            item.entity_id,
            this.userId,
          );
          break;
        default:
          return null;
      }
    } catch {
      return null;
    }

    return current && isOlderTimestamp(localTimestamp, current.updated_at)
      ? (current as unknown as Record<string, unknown>)
      : null;
  }

  private async processItem(item: SyncPushItem) {
    switch (item.entity_type) {
      case "class":
        return this.processClassItem(item);
      case "academic_term":
        return this.processAcademicTerm(item);
      case "assignment":
        return this.processAssignmentItem(item);
      case "exam":
        return this.processExamItem(item);
      case "expense":
        return this.processExpenseItem(item);
      case "budget":
        return this.processBudgetItem(item);
      case "recurrence_series":
      case "recurrence_occurrence":
      case "recurrence_exception":
        return this.processRecurrenceItem(item);
      case "ai_action":
        return this.processAiAction(item);
      default:
        return false;
    }
  }

  private async processRecurrenceItem(item: SyncPushItem) {
    if (item.operation !== "create" && item.operation !== "update") return false;
    return this.dependencies.recurrenceRepository.upsertForUser(
      item.entity_type as RecurrenceSyncEntity,
      this.userId,
      item.entity_id,
      item.payload,
    );
  }

  private async processClassItem(item: SyncPushItem) {
    switch (item.operation) {
      case "create":
        return this.createClass(item);
      case "update":
        return this.updateClass(item);
      case "delete":
        return this.deleteClass(item);
      default:
        return false;
    }
  }

  private async processAssignmentItem(item: SyncPushItem) {
    switch (item.operation) {
      case "create":
        return this.createAssignment(item);
      case "update":
        return this.updateAssignment(item);
      case "delete":
        return this.deleteAssignment(item);
      default:
        return false;
    }
  }

  private async processExamItem(item: SyncPushItem) {
    switch (item.operation) {
      case "create":
        return this.createExam(item);
      case "update":
        return this.updateExam(item);
      case "delete":
        return this.deleteExam(item);
      default:
        return false;
    }
  }

  private async processExpenseItem(item: SyncPushItem) {
    switch (item.operation) {
      case "create":
        return this.createExpense(item);
      case "delete":
        return this.deleteExpense(item);
      default:
        return false;
    }
  }

  private async processBudgetItem(item: SyncPushItem) {
    switch (item.operation) {
      case "create":
        return this.createBudget(item);
      case "update":
        return this.updateBudget(item);
      default:
        return false;
    }
  }

  private async processAiAction(item: SyncPushItem) {
    if (item.operation !== "create" && item.operation !== "update") {
      return false;
    }

    const parsed = aiActionPayloadSchema.safeParse(toRecordPayload(item.payload));
    if (!parsed.success) return false;

    await this.dependencies.aiActionsRepository.upsert({
      id: item.entity_id,
      user_id: this.userId,
      proposal: parsed.data.proposal as unknown as AiActionHistory["proposal"],
      status: parsed.data.status as AiActionHistory["status"],
      processing_layer: parsed.data.processing_layer,
      created_at: parsed.data.created_at,
      updated_at: parsed.data.updated_at,
    });
    return true;
  }

  private async processAcademicTerm(item: SyncPushItem) {
    if (item.operation !== "create" && item.operation !== "update") {
      return false;
    }
    const parsed = academicTermPayloadSchema.safeParse(toRecordPayload(item.payload));
    if (!parsed.success) return false;

    const timestamp = parsed.data.updated_at;
    const record: AcademicTerm = {
      id: item.entity_id,
      user_id: this.userId,
      name: parsed.data.name,
      status: parsed.data.status,
      created_at: parsed.data.created_at ?? timestamp,
      updated_at: timestamp,
      archived_at: parsed.data.archived_at ?? null,
      deleted_at: parsed.data.deleted_at ?? null,
    };
    await this.dependencies.academicTermsRepository.upsert(record);
    return true;
  }

  private async createClass(item: SyncPushItem) {
    const parsed = createClassPayloadSchema.safeParse(toRecordPayload(item.payload));
    if (!parsed.success) {
      return false;
    }

    const incoming = parsed.data;
    const existing = await this.dependencies.classesRepository.findByIdIncludingDeletedForUser(
      item.entity_id,
      this.userId,
    );

    if (existing && isOlderTimestamp(incoming.updated_at, existing.updated_at)) {
      return true;
    }
    if (
      !existing &&
      (await this.dependencies.classesRepository.existsForOtherUserIncludingDeleted(
        item.entity_id,
        this.userId,
      ))
    ) {
      return false;
    }

    const record: ClassRecord = {
      id: item.entity_id,
      user_id: this.userId,
      term_id: incoming.term_id ?? null,
      subject: incoming.subject,
      room: normalizeOptionalString(incoming.room),
      instructor: normalizeOptionalString(incoming.instructor),
      day_of_week: incoming.day_of_week,
      start_time: incoming.start_time,
      end_time: incoming.end_time,
      color: normalizeOptionalString(incoming.color),
      is_active: incoming.is_active ?? true,
      recurrence: normalizeRecurrenceReference(incoming.recurrence),
      created_at: incoming.created_at,
      updated_at: incoming.updated_at,
      deleted_at: null,
    };

    await this.dependencies.classesRepository.upsert(record);
    return true;
  }

  private async updateClass(item: SyncPushItem) {
    const parsed = updateClassPayloadSchema.safeParse(toRecordPayload(item.payload));
    if (!parsed.success) {
      return false;
    }

    const result = await this.dependencies.classesService.updateClass(
      item.entity_id,
      parsed.data as UpdateClassInput,
    );

    return result.status === "updated" || result.status === "stale";
  }

  private async deleteClass(item: SyncPushItem) {
    const result = await this.dependencies.classesService.deleteClass(item.entity_id);
    return result.status === "deleted";
  }

  private async createAssignment(item: SyncPushItem) {
    const parsed = createAssignmentPayloadSchema.safeParse(toRecordPayload(item.payload));
    if (!parsed.success) {
      return false;
    }

    const incoming = parsed.data;
    const existing =
      await this.dependencies.assignmentsRepository.findByIdIncludingDeletedForUser(
        item.entity_id,
        this.userId,
      );

    if (existing && isOlderTimestamp(incoming.updated_at, existing.updated_at)) {
      return true;
    }

    if (
      !existing &&
      (await this.dependencies.assignmentsRepository.existsForOtherUserIncludingDeleted(
        item.entity_id,
        this.userId,
      ))
    ) {
      return false;
    }

    const record: Assignment = {
      id: item.entity_id,
      user_id: this.userId,
      class_id: incoming.class_id ?? null,
      title: incoming.title,
      description: normalizeOptionalString(incoming.description),
      due_date: incoming.due_date,
      status: incoming.status ?? "pending",
      priority: incoming.priority ?? 1,
      recurrence: normalizeRecurrenceReference(incoming.recurrence),
      created_at: incoming.created_at,
      updated_at: incoming.updated_at,
      deleted_at: null,
    };

    await this.dependencies.assignmentsRepository.upsert(record);
    return true;
  }

  private async updateAssignment(item: SyncPushItem) {
    const parsed = updateAssignmentPayloadSchema.safeParse(toRecordPayload(item.payload));
    if (!parsed.success) {
      return false;
    }

    const result = await this.dependencies.assignmentsService.updateAssignment(
      item.entity_id,
      parsed.data as UpdateAssignmentInput,
    );

    return result.status === "updated" || result.status === "stale";
  }

  private async deleteAssignment(item: SyncPushItem) {
    const result = await this.dependencies.assignmentsService.deleteAssignment(item.entity_id);
    return result.status === "deleted";
  }

  private async createExam(item: SyncPushItem) {
    const parsed = createExamPayloadSchema.safeParse(toRecordPayload(item.payload));
    if (!parsed.success) {
      return false;
    }

    const incoming = parsed.data;
    const existing = await this.dependencies.examsRepository.findByIdIncludingDeletedForUser(
      item.entity_id,
      this.userId,
    );

    if (existing && isOlderTimestamp(incoming.updated_at, existing.updated_at)) {
      return true;
    }

    if (
      !existing &&
      (await this.dependencies.examsRepository.existsForOtherUserIncludingDeleted(
        item.entity_id,
        this.userId,
      ))
    ) {
      return false;
    }

    const record: Exam = {
      id: item.entity_id,
      user_id: this.userId,
      class_id: incoming.class_id ?? null,
      title: incoming.title,
      description: normalizeOptionalString(incoming.description),
      exam_date: incoming.exam_date,
      location: normalizeOptionalString(incoming.location),
      created_at: incoming.created_at,
      updated_at: incoming.updated_at,
      deleted_at: null,
    };

    await this.dependencies.examsRepository.upsert(record);
    return true;
  }

  private async updateExam(item: SyncPushItem) {
    const parsed = updateExamPayloadSchema.safeParse(toRecordPayload(item.payload));
    if (!parsed.success) {
      return false;
    }

    const result = await this.dependencies.examsService.updateExam(
      item.entity_id,
      parsed.data as UpdateExamInput,
    );

    return result.status === "updated" || result.status === "stale";
  }

  private async deleteExam(item: SyncPushItem) {
    const result = await this.dependencies.examsService.deleteExam(item.entity_id);
    return result.status === "deleted";
  }

  private async createExpense(item: SyncPushItem) {
    const parsed = createExpensePayloadSchema.safeParse(toRecordPayload(item.payload));
    if (!parsed.success) {
      return false;
    }

    const incoming = parsed.data;
    const existing = await this.dependencies.expensesRepository.findByIdIncludingDeletedForUser(
      item.entity_id,
      this.userId,
    );

    if (existing && isOlderTimestamp(incoming.updated_at, existing.updated_at)) {
      return true;
    }
    if (existing) {
      return true;
    }

    if (
      !existing &&
      (await this.dependencies.expensesRepository.existsForOtherUserIncludingDeleted(
        item.entity_id,
        this.userId,
      ))
    ) {
      return false;
    }

    await this.dependencies.expensesService.createExpense({
      id: item.entity_id,
      budget_id: incoming.budget_id ?? null,
      refund_of_expense_id: incoming.refund_of_expense_id ?? null,
      amount: incoming.amount,
      category: incoming.category,
      description: normalizeOptionalString(incoming.description) ?? undefined,
      spent_at: incoming.spent_at,
      recurrence: normalizeRecurrenceReference(incoming.recurrence),
      created_at: incoming.created_at,
      updated_at: incoming.updated_at,
    });
    return true;
  }

  private async deleteExpense(item: SyncPushItem) {
    const result = await this.dependencies.expensesService.deleteExpense(item.entity_id);
    return result.status === "deleted";
  }

  private async createBudget(item: SyncPushItem) {
    const parsed = createBudgetPayloadSchema.safeParse(toRecordPayload(item.payload));
    if (!parsed.success) {
      return false;
    }

    const incoming = parsed.data;
    const existing = await this.dependencies.budgetsRepository.findByIdForUser(
      item.entity_id,
      this.userId,
    );

    if (existing && isOlderTimestamp(incoming.updated_at, existing.updated_at)) {
      return true;
    }

    if (
      !existing &&
      (await this.dependencies.budgetsRepository.existsForOtherUser(item.entity_id, this.userId))
    ) {
      return false;
    }

    const record: Budget = {
      id: item.entity_id,
      user_id: this.userId,
      amount: incoming.amount,
      period: incoming.period,
      start_date: incoming.start_date,
      end_date: incoming.end_date,
      created_at: incoming.created_at,
      updated_at: incoming.updated_at,
    };

    await this.dependencies.budgetsRepository.upsert(record);
    return true;
  }

  private async updateBudget(item: SyncPushItem) {
    const parsed = updateBudgetPayloadSchema.safeParse(toRecordPayload(item.payload));
    if (!parsed.success) {
      return false;
    }

    const result = await this.dependencies.budgetsService.updateBudget(
      item.entity_id,
      parsed.data as UpdateBudgetInput,
    );

    return result.status === "updated" || result.status === "stale";
  }
}
