import type {
  Assignment as AssignmentRecord,
  Budget,
  BudgetRevision,
  ClassRecord,
  Exam as ExamRecord,
  Expense as ExpenseRecord,
  SyncEntityType,
  SyncOperation,
  SyncQueueItem,
} from "@unilife-ai/types";

import { calculateBudgetEndDate, inferExpenseCategory } from "@/lib/api/utils";
import { materializeExpenseOccurrenceDates } from "@/lib/finance/recurring-expenses";
import { db } from "@/lib/db/dexie";
import {
  deleteEntityNotifications,
  replaceEntityNotifications,
} from "@/lib/notifications/store";
import {
  getCurrentUserId,
  setCurrentUserId,
} from "@/lib/session/current-user";
import {
  buildBudgetStatusSnapshot,
  findActiveBudget,
  normalizeExpenseRecord,
} from "@/lib/selectors/finance";
import { normalizeAssignmentRecord } from "@/lib/selectors/assignments";
import { normalizeExamRecord } from "@/lib/selectors/exams";
import { createClient } from "@/lib/supabase/client";
import { notifySyncMutationQueued } from "@/lib/sync/mutation-signal";
import type {
  CreateAssignmentInput,
  CreateClassInput,
  CreateExamInput,
  LogExpenseInput,
  OnboardingBudgetInput,
  UpdateExamInput,
  UpdateClassInput,
} from "@/lib/types";

export type LocalMutationIntent =
  | "create"
  | "update"
  | "delete"
  | "delete_restore";

export type LocalMutationReceipt = {
  queueItemId: string;
  clientMutationId: string;
  logicalOperationId: string;
  acceptedAt: string;
  state: "queued";
};

type DeleteUndoEntityType = "assignment" | "class" | "exam" | "expense";

export type DeleteUndoOperation<T extends DeleteUndoEntityType = DeleteUndoEntityType> = {
  entityType: T;
  entityId: string;
  deletedAt: string;
  queueItemId: string;
  clientMutationId: string;
  logicalOperationId: string;
};

export async function getMutationUserId() {
  const existingUserId = getCurrentUserId();

  if (existingUserId) {
    return existingUserId;
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    throw new Error("The current user is not available in the browser session.");
  }

  setCurrentUserId(user.id);
  return user.id;
}

export function createQueueItem(input: {
  entityId: string;
  entityType: SyncEntityType;
  operation: SyncOperation;
  payload: Record<string, unknown>;
  userId: string;
  queueItemId?: string;
  clientMutationId?: string;
  logicalOperationId?: string;
  intent?: LocalMutationIntent;
  supersedesQueueItemId?: string | null;
}): SyncQueueItem {
  const createdAt = new Date().toISOString();

  return {
    created_at: createdAt,
    entity_id: input.entityId,
    entity_type: input.entityType,
    id: input.queueItemId ?? crypto.randomUUID(),
    last_attempted_at: null,
    mutation_meta: {
      acknowledged_at: createdAt,
      client_mutation_id: input.clientMutationId ?? crypto.randomUUID(),
      intent: input.intent ?? input.operation,
      logical_operation_id: input.logicalOperationId ?? crypto.randomUUID(),
      supersedes_queue_item_id: input.supersedesQueueItemId ?? null,
    },
    operation: input.operation,
    payload: input.payload,
    retry_count: 0,
    status: "pending",
    user_id: input.userId,
  };
}

function createMutationReceipt(queueItem: SyncQueueItem): LocalMutationReceipt {
  return {
    acceptedAt: queueItem.mutation_meta?.acknowledged_at ?? queueItem.created_at,
    clientMutationId: queueItem.mutation_meta?.client_mutation_id ?? queueItem.id,
    logicalOperationId:
      queueItem.mutation_meta?.logical_operation_id ?? queueItem.entity_id,
    queueItemId: queueItem.id,
    state: "queued",
  };
}

function maybeSetNullableString(
  key: string,
  value: string | null | undefined,
  target: Record<string, unknown>,
) {
  if (value === undefined) {
    return;
  }

  target[key] = value;
}

async function getClassSubjectById(userId: string) {
  const classes = await db.classes
    .where("user_id")
    .equals(userId)
    .and((record) => record.deleted_at === null)
    .toArray();

  return new Map(classes.map((record) => [record.id, record.subject] as const));
}

type DeleteUndoRecordMap = {
  assignment: AssignmentRecord;
  class: ClassRecord;
  exam: ExamRecord;
  expense: ExpenseRecord;
};

function getEntityTable(entityType: keyof DeleteUndoRecordMap) {
  if (entityType === "class") {
    return db.classes;
  }
  if (entityType === "assignment") {
    return db.assignments;
  }
  if (entityType === "exam") {
    return db.exams;
  }
  return db.expenses;
}

export async function beginDeleteUndoLocal<T extends keyof DeleteUndoRecordMap>(
  entityType: T,
  entityId: string,
): Promise<DeleteUndoOperation<T> | null> {
  const userId = await getMutationUserId();
  const rawTable = getEntityTable(entityType);
  const table = rawTable as {
    get: (id: string) => Promise<DeleteUndoRecordMap[T] | undefined>;
    put: (record: DeleteUndoRecordMap[T]) => Promise<unknown>;
  };
  const existingRecord = await table.get(entityId);

  if (!existingRecord || existingRecord.user_id !== userId || existingRecord.deleted_at) {
    return null;
  }

  const deletedAt = new Date().toISOString();
  const queueItemId = crypto.randomUUID();
  const clientMutationId = crypto.randomUUID();
  const logicalOperationId = crypto.randomUUID();
  const nextRecord =
    entityType === "class"
      ? {
          ...existingRecord,
          deleted_at: deletedAt,
          is_active: false,
          updated_at: deletedAt,
        }
      : {
          ...existingRecord,
          deleted_at: deletedAt,
          updated_at: deletedAt,
        };

  await db.transaction("rw", rawTable, db.notifications, async () => {
    await table.put(nextRecord as DeleteUndoRecordMap[T]);

    if (entityType === "class" || entityType === "assignment" || entityType === "exam") {
      await deleteEntityNotifications(entityType, entityId);
    }
  });

  return {
    clientMutationId,
    deletedAt,
    entityId,
    entityType,
    logicalOperationId,
    queueItemId,
  };
}

export async function finalizeDeleteUndoLocal(
  operation: DeleteUndoOperation,
): Promise<LocalMutationReceipt | null> {
  const userId = await getMutationUserId();
  const rawTable = getEntityTable(operation.entityType);
  const table = rawTable as {
    get: (
      id: string,
    ) => Promise<DeleteUndoRecordMap[typeof operation.entityType] | undefined>;
  };
  const existingRecord = await table.get(operation.entityId);

  if (!existingRecord || existingRecord.user_id !== userId) {
    return null;
  }

  if (existingRecord.deleted_at !== operation.deletedAt) {
    return null;
  }

  const queueItem = createQueueItem({
    clientMutationId: operation.clientMutationId,
    entityId: operation.entityId,
    entityType: operation.entityType,
    intent: "delete",
    logicalOperationId: operation.logicalOperationId,
    operation: "delete",
    payload: { deleted_at: operation.deletedAt },
    queueItemId: operation.queueItemId,
    userId,
  });

  await db.sync_queue.put(queueItem);
  notifySyncMutationQueued();
  return createMutationReceipt(queueItem);
}

export async function undoDeleteUndoLocal(
  operation: DeleteUndoOperation,
): Promise<boolean> {
  const userId = await getMutationUserId();
  const rawTable = getEntityTable(operation.entityType);
  const table = rawTable as {
    get: (
      id: string,
    ) => Promise<DeleteUndoRecordMap[typeof operation.entityType] | undefined>;
    put: (
      record: DeleteUndoRecordMap[typeof operation.entityType],
    ) => Promise<unknown>;
  };
  const existingRecord = await table.get(operation.entityId);

  if (!existingRecord || existingRecord.user_id !== userId) {
    return false;
  }

  if (existingRecord.deleted_at !== operation.deletedAt) {
    return false;
  }

  const restoredRecord =
    operation.entityType === "class"
      ? {
          ...existingRecord,
          deleted_at: null,
          is_active: true,
          updated_at: new Date().toISOString(),
        }
      : {
          ...existingRecord,
          deleted_at: null,
          updated_at: new Date().toISOString(),
        };

  await db.transaction("rw", rawTable, db.notifications, db.sync_queue, async () => {
    await table.put(restoredRecord as DeleteUndoRecordMap[keyof DeleteUndoRecordMap]);

    if (operation.entityType === "class") {
      await replaceEntityNotifications("class", restoredRecord as ClassRecord);
    } else if (operation.entityType === "assignment") {
      await replaceEntityNotifications("assignment", restoredRecord as AssignmentRecord);
    } else if (operation.entityType === "exam") {
      await replaceEntityNotifications("exam", restoredRecord as ExamRecord);
    }

    await db.sync_queue.delete(operation.queueItemId);
  });

  return true;
}

export async function createClassLocal(input: CreateClassInput) {
  const userId = await getMutationUserId();
  const timestamp = new Date().toISOString();
  const record: ClassRecord = {
    color: input.color ?? null,
    created_at: timestamp,
    day_of_week: input.dayOfWeek,
    deleted_at: null,
    end_time: input.endTime,
    id: crypto.randomUUID(),
    instructor: input.instructor ?? null,
    is_active: true,
    recurrence: input.recurrence ?? null,
    room: input.room ?? null,
    start_time: input.startTime,
    subject: input.subject,
    updated_at: timestamp,
    user_id: userId,
  };
  const payload: Record<string, unknown> = {
    created_at: record.created_at,
    day_of_week: record.day_of_week,
    end_time: record.end_time,
    start_time: record.start_time,
    subject: record.subject,
    updated_at: record.updated_at,
  };

  if (record.room) {
    payload.room = record.room;
  }
  if (record.instructor) {
    payload.instructor = record.instructor;
  }
  if (record.color) {
    payload.color = record.color;
  }
  if (record.recurrence) {
    payload.recurrence = record.recurrence;
  }

  await db.transaction("rw", db.classes, db.notifications, db.sync_queue, async () => {
    await db.classes.put(record);
    await replaceEntityNotifications("class", record);
    await db.sync_queue.put(
      createQueueItem({
        entityId: record.id,
        entityType: "class",
        operation: "create",
        payload,
        userId,
      }),
    );
  });
  notifySyncMutationQueued();

  return record;
}

export async function updateClassLocal(id: string, input: UpdateClassInput) {
  const userId = await getMutationUserId();
  const existingRecord = await db.classes.get(id);

  if (!existingRecord || existingRecord.user_id !== userId || existingRecord.deleted_at) {
    return null;
  }

  const updatedRecord: ClassRecord = {
    ...existingRecord,
    color: input.color !== undefined ? input.color : existingRecord.color,
    day_of_week:
      input.dayOfWeek !== undefined ? input.dayOfWeek : existingRecord.day_of_week,
    end_time: input.endTime !== undefined ? input.endTime : existingRecord.end_time,
    instructor:
      input.instructor !== undefined ? input.instructor : existingRecord.instructor,
    is_active: input.isActive !== undefined ? input.isActive : existingRecord.is_active,
    recurrence:
      input.recurrence !== undefined ? input.recurrence : existingRecord.recurrence,
    room: input.room !== undefined ? input.room : existingRecord.room,
    start_time:
      input.startTime !== undefined ? input.startTime : existingRecord.start_time,
    subject: input.subject !== undefined ? input.subject : existingRecord.subject,
    updated_at: new Date().toISOString(),
  };
  const payload: Record<string, unknown> = {
    updated_at: updatedRecord.updated_at,
  };

  if (input.subject !== undefined) {
    payload.subject = input.subject;
  }
  if (input.dayOfWeek !== undefined) {
    payload.day_of_week = input.dayOfWeek;
  }
  if (input.startTime !== undefined) {
    payload.start_time = input.startTime;
  }
  if (input.endTime !== undefined) {
    payload.end_time = input.endTime;
  }
  if (input.isActive !== undefined) {
    payload.is_active = input.isActive;
  }
  if (input.recurrence !== undefined) {
    payload.recurrence = input.recurrence;
  }
  if (input.editScope !== undefined) {
    payload.edit_scope = input.editScope;
  }
  maybeSetNullableString("room", input.room, payload);
  maybeSetNullableString("instructor", input.instructor, payload);
  maybeSetNullableString("color", input.color, payload);

  await db.transaction("rw", db.classes, db.notifications, db.sync_queue, async () => {
    await db.classes.put(updatedRecord);
    await replaceEntityNotifications("class", updatedRecord);
    await db.sync_queue.put(
      createQueueItem({
        entityId: id,
        entityType: "class",
        operation: "update",
        payload,
        userId,
      }),
    );
  });
  notifySyncMutationQueued();

  return updatedRecord;
}

export async function deleteClassLocal(id: string) {
  const userId = await getMutationUserId();
  const existingRecord = await db.classes.get(id);

  if (!existingRecord || existingRecord.user_id !== userId || existingRecord.deleted_at) {
    return false;
  }

  const deletedAt = new Date().toISOString();

  await db.transaction("rw", db.classes, db.notifications, db.sync_queue, async () => {
    await db.classes.put({
      ...existingRecord,
      deleted_at: deletedAt,
      is_active: false,
      updated_at: deletedAt,
    });
    await deleteEntityNotifications("class", id);
    await db.sync_queue.put(
      createQueueItem({
        entityId: id,
        entityType: "class",
        operation: "delete",
        payload: { deleted_at: deletedAt },
        userId,
      }),
    );
  });
  notifySyncMutationQueued();

  return true;
}

export async function createAssignmentLocal(input: CreateAssignmentInput) {
  const userId = await getMutationUserId();
  const timestamp = new Date().toISOString();
  const record: AssignmentRecord = {
    class_id: input.classId ?? null,
    created_at: timestamp,
    deleted_at: null,
    description: input.description ?? null,
    due_date: input.dueAt,
    id: crypto.randomUUID(),
    priority: input.priority ?? 2,
    recurrence: input.recurrence ?? null,
    status: "pending",
    title: input.title,
    updated_at: timestamp,
    user_id: userId,
  };
  const payload: Record<string, unknown> = {
    created_at: record.created_at,
    due_date: record.due_date,
    priority: record.priority,
    status: record.status,
    title: record.title,
    updated_at: record.updated_at,
  };
  maybeSetNullableString("class_id", record.class_id, payload);
  if (record.description) {
    payload.description = record.description;
  }
  if (record.recurrence) {
    payload.recurrence = record.recurrence;
  }

  await db.transaction(
    "rw",
    db.assignments,
    db.notifications,
    db.sync_queue,
    async () => {
    await db.assignments.put(record);
    await replaceEntityNotifications("assignment", record);
    await db.sync_queue.put(
      createQueueItem({
        entityId: record.id,
        entityType: "assignment",
        operation: "create",
        payload,
        userId,
      }),
    );
    },
  );
  notifySyncMutationQueued();

  const classSubjectById = await getClassSubjectById(userId);
  return normalizeAssignmentRecord(record, {
    classSubjectById,
  });
}

export async function updateAssignmentLocal(
  id: string,
  input: Partial<{
    classId: string | null;
    description: string | null;
    dueAt: string;
    editScope: "occurrence" | "future" | "series";
    priority: number;
    recurrence: AssignmentRecord["recurrence"];
    status: AssignmentRecord["status"];
    title: string;
  }>,
) {
  const userId = await getMutationUserId();
  const existingRecord = await db.assignments.get(id);

  if (!existingRecord || existingRecord.user_id !== userId || existingRecord.deleted_at) {
    return null;
  }

  const updatedRecord: AssignmentRecord = {
    ...existingRecord,
    class_id: input.classId !== undefined ? input.classId : existingRecord.class_id,
    description:
      input.description !== undefined ? input.description : existingRecord.description,
    due_date: input.dueAt !== undefined ? input.dueAt : existingRecord.due_date,
    priority: input.priority !== undefined ? input.priority : existingRecord.priority,
    recurrence:
      input.recurrence !== undefined ? input.recurrence : existingRecord.recurrence,
    status: input.status !== undefined ? input.status : existingRecord.status,
    title: input.title !== undefined ? input.title : existingRecord.title,
    updated_at: new Date().toISOString(),
  };
  const payload: Record<string, unknown> = {
    updated_at: updatedRecord.updated_at,
  };

  if (input.title !== undefined) {
    payload.title = input.title;
  }
  if (input.dueAt !== undefined) {
    payload.due_date = input.dueAt;
  }
  if (input.priority !== undefined) {
    payload.priority = input.priority;
  }
  if (input.status !== undefined) {
    payload.status = input.status;
  }
  if (input.recurrence !== undefined) {
    payload.recurrence = input.recurrence;
  }
  if (input.editScope !== undefined) {
    payload.edit_scope = input.editScope;
  }
  maybeSetNullableString("class_id", input.classId, payload);
  maybeSetNullableString("description", input.description, payload);

  await db.transaction(
    "rw",
    db.assignments,
    db.notifications,
    db.sync_queue,
    async () => {
    await db.assignments.put(updatedRecord);
    await replaceEntityNotifications("assignment", updatedRecord);
    await db.sync_queue.put(
      createQueueItem({
        entityId: id,
        entityType: "assignment",
        operation: "update",
        payload,
        userId,
      }),
    );
    },
  );
  notifySyncMutationQueued();

  const classSubjectById = await getClassSubjectById(userId);
  return normalizeAssignmentRecord(updatedRecord, {
    classSubjectById,
  });
}

export async function deleteAssignmentLocal(id: string) {
  const userId = await getMutationUserId();
  const existingRecord = await db.assignments.get(id);

  if (!existingRecord || existingRecord.user_id !== userId || existingRecord.deleted_at) {
    return false;
  }

  const deletedAt = new Date().toISOString();

  await db.transaction(
    "rw",
    db.assignments,
    db.notifications,
    db.sync_queue,
    async () => {
    await db.assignments.put({
      ...existingRecord,
      deleted_at: deletedAt,
      updated_at: deletedAt,
    });
    await deleteEntityNotifications("assignment", id);
    await db.sync_queue.put(
      createQueueItem({
        entityId: id,
        entityType: "assignment",
        operation: "delete",
        payload: { deleted_at: deletedAt },
        userId,
      }),
    );
    },
  );
  notifySyncMutationQueued();

  return true;
}

export async function createExamLocal(input: CreateExamInput) {
  const userId = await getMutationUserId();
  const timestamp = new Date().toISOString();
  const record: ExamRecord = {
    class_id: input.classId ?? null,
    created_at: timestamp,
    deleted_at: null,
    description: input.description ?? null,
    exam_date: input.examAt,
    id: crypto.randomUUID(),
    location: input.location ?? null,
    title: input.title,
    updated_at: timestamp,
    user_id: userId,
  };
  const payload: Record<string, unknown> = {
    created_at: record.created_at,
    exam_date: record.exam_date,
    title: record.title,
    updated_at: record.updated_at,
  };
  maybeSetNullableString("class_id", record.class_id, payload);
  if (record.description) {
    payload.description = record.description;
  }
  if (record.location) {
    payload.location = record.location;
  }

  await db.transaction("rw", db.exams, db.notifications, db.sync_queue, async () => {
    await db.exams.put(record);
    await replaceEntityNotifications("exam", record);
    await db.sync_queue.put(
      createQueueItem({
        entityId: record.id,
        entityType: "exam",
        operation: "create",
        payload,
        userId,
      }),
    );
  });
  notifySyncMutationQueued();

  const classSubjectById = await getClassSubjectById(userId);
  return normalizeExamRecord(record, {
    classSubjectById,
  });
}

export async function updateExamLocal(id: string, input: UpdateExamInput) {
  const userId = await getMutationUserId();
  const existingRecord = await db.exams.get(id);

  if (!existingRecord || existingRecord.user_id !== userId || existingRecord.deleted_at) {
    return null;
  }

  const updatedRecord: ExamRecord = {
    ...existingRecord,
    class_id: input.classId !== undefined ? input.classId : existingRecord.class_id,
    description:
      input.description !== undefined ? input.description : existingRecord.description,
    exam_date: input.examAt !== undefined ? input.examAt : existingRecord.exam_date,
    location: input.location !== undefined ? input.location : existingRecord.location,
    title: input.title !== undefined ? input.title : existingRecord.title,
    updated_at: new Date().toISOString(),
  };
  const payload: Record<string, unknown> = {
    updated_at: updatedRecord.updated_at,
  };

  if (input.title !== undefined) {
    payload.title = input.title;
  }
  if (input.examAt !== undefined) {
    payload.exam_date = input.examAt;
  }
  maybeSetNullableString("class_id", input.classId, payload);
  maybeSetNullableString("description", input.description, payload);
  maybeSetNullableString("location", input.location, payload);

  await db.transaction("rw", db.exams, db.notifications, db.sync_queue, async () => {
    await db.exams.put(updatedRecord);
    await replaceEntityNotifications("exam", updatedRecord);
    await db.sync_queue.put(
      createQueueItem({
        entityId: id,
        entityType: "exam",
        operation: "update",
        payload,
        userId,
      }),
    );
  });
  notifySyncMutationQueued();

  const classSubjectById = await getClassSubjectById(userId);
  return normalizeExamRecord(updatedRecord, {
    classSubjectById,
  });
}

export async function deleteExamLocal(id: string) {
  const userId = await getMutationUserId();
  const existingRecord = await db.exams.get(id);

  if (!existingRecord || existingRecord.user_id !== userId || existingRecord.deleted_at) {
    return false;
  }

  const deletedAt = new Date().toISOString();

  await db.transaction("rw", db.exams, db.notifications, db.sync_queue, async () => {
    await db.exams.put({
      ...existingRecord,
      deleted_at: deletedAt,
      updated_at: deletedAt,
    });
    await deleteEntityNotifications("exam", id);
    await db.sync_queue.put(
      createQueueItem({
        entityId: id,
        entityType: "exam",
        operation: "delete",
        payload: { deleted_at: deletedAt },
        userId,
      }),
    );
  });
  notifySyncMutationQueued();

  return true;
}

export async function logExpenseLocal(input: LogExpenseInput) {
  const userId = await getMutationUserId();
  const budgets = await db.budgets.where("user_id").equals(userId).toArray();
  const activeBudget = findActiveBudget(budgets);
  const original = input.refundOfExpenseId
    ? await db.expenses.get(input.refundOfExpenseId)
    : null;
  if (input.amount < 0) {
    if (!original || original.user_id !== userId || original.deleted_at || original.amount <= 0 || original.refund_of_expense_id) {
      throw new Error("Choose an active original expense for this refund.");
    }
    const refunds = await db.expenses
      .where("refund_of_expense_id")
      .equals(original.id)
      .and((record) => record.deleted_at === null)
      .toArray();
    const remaining = original.amount + refunds.reduce((sum, refund) => sum + refund.amount, 0);
    if (Math.abs(input.amount) > remaining) throw new Error("Refund exceeds the remaining refundable amount.");
  } else if (input.refundOfExpenseId) {
    throw new Error("Positive expenses cannot be linked as refunds.");
  }
  const timestamp = new Date().toISOString();
  const record: ExpenseRecord = {
    amount: input.amount,
    budget_id: original?.budget_id ?? activeBudget?.id ?? null,
    refund_of_expense_id: input.refundOfExpenseId ?? null,
    category: original?.category ?? input.category ?? inferExpenseCategory(input.label),
    created_at: timestamp,
    deleted_at: null,
    description: input.label.trim(),
    id: crypto.randomUUID(),
    spent_at: input.spentAt ?? timestamp,
    recurrence: input.recurrence ?? null,
    updated_at: timestamp,
    user_id: userId,
  };
  const payload: Record<string, unknown> = {
    amount: record.amount,
    category: record.category,
    created_at: record.created_at,
    spent_at: record.spent_at,
    updated_at: record.updated_at,
  };
  maybeSetNullableString("budget_id", record.budget_id, payload);
  maybeSetNullableString("refund_of_expense_id", record.refund_of_expense_id, payload);
  if (record.recurrence) payload.recurrence = record.recurrence;
  if (record.description) {
    payload.description = record.description;
  }

  const records = [record];
  if (record.recurrence?.rule && record.recurrence.series_id) {
    for (const occurrenceAt of materializeExpenseOccurrenceDates(record.recurrence.rule).slice(1)) {
      records.push({
        ...record,
        id: crypto.randomUUID(),
        spent_at: occurrenceAt,
        created_at: timestamp,
        updated_at: timestamp,
        recurrence: {
          ...record.recurrence,
          occurrence_id: crypto.randomUUID(),
          original_start_at: occurrenceAt,
          effective_start_at: occurrenceAt,
          effective_end_at: occurrenceAt,
        },
      });
    }
  }

  await db.transaction("rw", db.expenses, db.sync_queue, async () => {
    for (const expenseRecord of records) {
      await db.expenses.put(expenseRecord);
      await db.sync_queue.put(
        createQueueItem({
          entityId: expenseRecord.id,
          entityType: "expense",
          operation: "create",
          payload: {
            ...payload,
            spent_at: expenseRecord.spent_at,
            recurrence: expenseRecord.recurrence ?? null,
          },
          userId,
        }),
      );
    }
  });
  notifySyncMutationQueued();

  return normalizeExpenseRecord(record);
}

export async function deleteExpenseLocal(id: string) {
  const userId = await getMutationUserId();
  const existingRecord = await db.expenses.get(id);

  if (!existingRecord || existingRecord.user_id !== userId || existingRecord.deleted_at) {
    return false;
  }

  const deletedAt = new Date().toISOString();

  await db.transaction("rw", db.expenses, db.sync_queue, async () => {
    await db.expenses.put({
      ...existingRecord,
      deleted_at: deletedAt,
      updated_at: deletedAt,
    });
    await db.sync_queue.put(
      createQueueItem({
        entityId: id,
        entityType: "expense",
        operation: "delete",
        payload: { deleted_at: deletedAt },
        userId,
      }),
    );
  });
  notifySyncMutationQueued();

  return true;
}

async function createBudgetLocal(input: OnboardingBudgetInput) {
  const userId = await getMutationUserId();
  const createdAt = new Date().toISOString();
  const startDate = input.startDate ?? new Date().toISOString().slice(0, 10);
  const record: Budget = {
    amount: input.amount,
    created_at: createdAt,
    end_date: input.endDate ?? calculateBudgetEndDate(startDate, input.period),
    id: crypto.randomUUID(),
    period: input.period,
    start_date: startDate,
    updated_at: createdAt,
    user_id: userId,
  };
  const payload: Record<string, unknown> = {
    amount: record.amount,
    created_at: record.created_at,
    end_date: record.end_date,
    period: record.period,
    start_date: record.start_date,
    updated_at: record.updated_at,
  };

  await db.transaction("rw", db.budgets, db.sync_queue, async () => {
    await db.budgets.put(record);
    await db.sync_queue.put(
      createQueueItem({
        entityId: record.id,
        entityType: "budget",
        operation: "create",
        payload,
        userId,
      }),
    );
  });
  notifySyncMutationQueued();

  return record;
}

async function updateBudgetLocal(id: string, input: OnboardingBudgetInput) {
  const userId = await getMutationUserId();
  const existingRecord = await db.budgets.get(id);

  if (!existingRecord || existingRecord.user_id !== userId) {
    return null;
  }

  const updatedRecord: Budget = {
    ...existingRecord,
    amount: input.amount,
    start_date: input.startDate ?? existingRecord.start_date,
    end_date:
      input.endDate ??
      calculateBudgetEndDate(input.startDate ?? existingRecord.start_date, input.period),
    period: input.period,
    updated_at: new Date().toISOString(),
  };
  const payload: Record<string, unknown> = {
    amount: updatedRecord.amount,
    end_date: updatedRecord.end_date,
    period: updatedRecord.period,
    start_date: updatedRecord.start_date,
    updated_at: updatedRecord.updated_at,
  };
  const mutationId = crypto.randomUUID();
  payload.mutation_id = mutationId;
  const revision: BudgetRevision = {
    id: crypto.randomUUID(),
    user_id: userId,
    budget_id: id,
    prior: {
      amount: existingRecord.amount,
      period: existingRecord.period,
      start_date: existingRecord.start_date,
      end_date: existingRecord.end_date,
    },
    resulting: {
      amount: updatedRecord.amount,
      period: updatedRecord.period,
      start_date: updatedRecord.start_date,
      end_date: updatedRecord.end_date,
    },
    changed_at: updatedRecord.updated_at,
    mutation_id: mutationId,
  };

  await db.transaction("rw", db.budgets, db.budget_revisions, db.sync_queue, async () => {
    await db.budgets.put(updatedRecord);
    await db.budget_revisions.put(revision);
    await db.sync_queue.put(
      createQueueItem({
        entityId: id,
        entityType: "budget",
        operation: "update",
        payload,
        userId,
      }),
    );
  });
  notifySyncMutationQueued();

  return updatedRecord;
}

export async function saveBudgetCycleLocal(input: OnboardingBudgetInput) {
  const userId = await getMutationUserId();
  const budgets = await db.budgets.where("user_id").equals(userId).toArray();
  const activeBudget = findActiveBudget(budgets);
  const budget = activeBudget
    ? await updateBudgetLocal(activeBudget.id, input)
    : await createBudgetLocal(input);

  if (!budget) {
    throw new Error("We couldn't update the active budget.");
  }

  const expenses = await db.expenses
    .where("user_id")
    .equals(userId)
    .and(
      (record) =>
        record.deleted_at === null &&
        record.spent_at >= `${budget.start_date}T00:00:00` &&
        record.spent_at <= `${budget.end_date}T23:59:59.999`,
    )
    .toArray();

  return buildBudgetStatusSnapshot(budget, expenses);
}

export async function getBudgetStatusLocal() {
  const userId = await getMutationUserId();
  const budgets = await db.budgets.where("user_id").equals(userId).toArray();
  const activeBudget = findActiveBudget(budgets);

  if (!activeBudget) {
    return null;
  }

  const expenses = await db.expenses
    .where("user_id")
    .equals(userId)
    .and(
      (record) =>
        record.deleted_at === null &&
        record.spent_at >= `${activeBudget.start_date}T00:00:00` &&
        record.spent_at <= `${activeBudget.end_date}T23:59:59.999`,
    )
    .toArray();

  return buildBudgetStatusSnapshot(activeBudget, expenses);
}
