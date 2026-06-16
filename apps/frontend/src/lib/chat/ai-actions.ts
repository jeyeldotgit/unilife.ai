"use client";

import type {
  AiActionHistory,
  AiProposal,
  AiProposedOperation,
  RecurrenceReference,
  SyncEntityType,
} from "@unilife-ai/types";

import { db } from "@/lib/db/dexie";
import {
  createAssignmentLocal,
  createClassLocal,
  createExamLocal,
  createQueueItem,
  deleteAssignmentLocal,
  deleteClassLocal,
  deleteExamLocal,
  deleteExpenseLocal,
  getMutationUserId,
  logExpenseLocal,
  updateAssignmentLocal,
  updateClassLocal,
  updateExamLocal,
} from "@/lib/mutations/local-data";
import { notifySyncMutationQueued } from "@/lib/sync/mutation-signal";
import type { DayOfWeek, ExpenseCategory, ScheduleColor } from "@/lib/types";

type AiDomainEntity = Exclude<SyncEntityType, "ai_action">;
type DomainRecord = Record<string, unknown> & {
  id: string;
  updated_at: string;
};

function getTableName(entityType: AiDomainEntity) {
  switch (entityType) {
    case "class":
      return "classes";
    case "assignment":
      return "assignments";
    case "exam":
      return "exams";
    case "expense":
      return "expenses";
    default:
      return null;
  }
}

async function getDomainRecord(entityType: AiDomainEntity, id: string) {
  const tableName = getTableName(entityType);
  if (!tableName) return null;
  return ((await db.table(tableName).get(id)) as DomainRecord | undefined) ?? null;
}

async function queueHistory(history: AiActionHistory, operation: "create" | "update") {
  const queueItem = createQueueItem({
    entityId: history.id,
    entityType: "ai_action",
    operation,
    payload: {
      proposal: history.proposal as unknown as Record<string, unknown>,
      status: history.status,
      processing_layer: history.processing_layer,
      created_at: history.created_at,
      updated_at: history.updated_at,
    },
    userId: history.user_id,
  });

  await db.transaction("rw", db.ai_actions, db.sync_queue, async () => {
    await db.ai_actions.put(history);
    await db.sync_queue.put(queueItem);
  });
  notifySyncMutationQueued();
}

export async function persistAiProposal(proposal: AiProposal) {
  const userId = await getMutationUserId();
  const existing = await db.ai_actions.get(proposal.id);
  const timestamp = new Date().toISOString();
  const history: AiActionHistory = {
    id: proposal.id,
    user_id: userId,
    proposal: { ...proposal, updated_at: timestamp },
    status: proposal.status,
    processing_layer: proposal.processing_layer,
    created_at: existing?.created_at ?? proposal.created_at,
    updated_at: timestamp,
  };
  await queueHistory(history, existing ? "update" : "create");
  return history;
}

export function buildLocalProposal(
  entityType: "assignment" | "class" | "exam" | "expense",
  proposed: Record<string, unknown>,
  confidence: number,
): AiProposal {
  const timestamp = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    processing_layer: "local",
    status: "proposed",
    operations: [
      {
        id: crypto.randomUUID(),
        operation: "create",
        entity_type: entityType,
        entity_id: null,
        before: null,
        proposed,
        uncertain_fields: confidence < 0.7 ? Object.keys(proposed) : [],
        confidence,
        status: "proposed",
        approved_payload: null,
        applied_revision: null,
        error: null,
      },
    ],
    created_at: timestamp,
    updated_at: timestamp,
  };
}

async function applyCreate(operation: AiProposedOperation) {
  const input = operation.approved_payload ?? operation.proposed;
  switch (operation.entity_type) {
    case "assignment":
      return createAssignmentLocal({
        title: String(input.title ?? ""),
        dueAt: String(input.due_date ?? ""),
        classId: typeof input.class_id === "string" ? input.class_id : null,
      });
    case "class": {
      const days: DayOfWeek[] = [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ];
      const dayOfWeek = String(input.day_of_week ?? "") as DayOfWeek;
      return createClassLocal({
        subject: String(input.subject ?? ""),
        dayOfWeek,
        dayIndex: days.indexOf(dayOfWeek),
        startTime: String(input.start_time ?? ""),
        endTime: String(input.end_time ?? ""),
        termId: typeof input.term_id === "string" ? input.term_id : null,
        room: typeof input.room === "string" ? input.room : null,
        instructor: typeof input.instructor === "string" ? input.instructor : null,
        color: typeof input.color === "string" ? (input.color as ScheduleColor) : undefined,
        recurrence:
          typeof input.recurrence === "object" && input.recurrence !== null
            ? (input.recurrence as RecurrenceReference)
            : null,
      });
    }
    case "exam":
      return createExamLocal({
        title: String(input.title ?? ""),
        examAt: String(input.exam_date ?? ""),
        classId: typeof input.class_id === "string" ? input.class_id : null,
        location: typeof input.location === "string" ? input.location : null,
      });
    case "expense":
      return logExpenseLocal({
        label: String(input.description ?? input.label ?? "Expense"),
        amount: Number(input.amount),
        category: input.category as ExpenseCategory,
        spentAt: typeof input.spent_at === "string" ? input.spent_at : undefined,
      });
    default:
      throw new Error(`Unsupported AI create operation for ${operation.entity_type}.`);
  }
}

async function applyUpdate(operation: AiProposedOperation) {
  if (!operation.entity_id) throw new Error("Update operation is missing an entity ID.");
  const input = operation.approved_payload ?? operation.proposed;
  switch (operation.entity_type) {
    case "assignment":
      return updateAssignmentLocal(operation.entity_id, {
        title: typeof input.title === "string" ? input.title : undefined,
        dueAt: typeof input.due_date === "string" ? input.due_date : undefined,
        classId:
          typeof input.class_id === "string" || input.class_id === null
            ? input.class_id
            : undefined,
      });
    case "class":
      return updateClassLocal(operation.entity_id, {
        subject: typeof input.subject === "string" ? input.subject : undefined,
        dayOfWeek: input.day_of_week as DayOfWeek | undefined,
        startTime: typeof input.start_time === "string" ? input.start_time : undefined,
        endTime: typeof input.end_time === "string" ? input.end_time : undefined,
      });
    case "exam":
      return updateExamLocal(operation.entity_id, {
        title: typeof input.title === "string" ? input.title : undefined,
        examAt: typeof input.exam_date === "string" ? input.exam_date : undefined,
        location:
          typeof input.location === "string" || input.location === null
            ? input.location
            : undefined,
      });
    default:
      throw new Error(`Unsupported AI update operation for ${operation.entity_type}.`);
  }
}

async function applyDelete(operation: AiProposedOperation) {
  if (!operation.entity_id) throw new Error("Delete operation is missing an entity ID.");
  switch (operation.entity_type) {
    case "assignment":
      return deleteAssignmentLocal(operation.entity_id);
    case "class":
      return deleteClassLocal(operation.entity_id);
    case "exam":
      return deleteExamLocal(operation.entity_id);
    case "expense":
      return deleteExpenseLocal(operation.entity_id);
    default:
      throw new Error(`Unsupported AI delete operation for ${operation.entity_type}.`);
  }
}

export async function applyAiProposal(proposal: AiProposal) {
  const operations: AiProposedOperation[] = [];

  for (const operation of proposal.operations) {
    if (operation.status !== "approved" || operation.applied_revision) {
      operations.push(operation);
      continue;
    }

    try {
      const before = operation.entity_id
        ? await getDomainRecord(operation.entity_type, operation.entity_id)
        : null;
      const result =
        operation.operation === "create"
          ? await applyCreate(operation)
          : operation.operation === "update"
            ? await applyUpdate(operation)
            : await applyDelete(operation);
      if (!result) throw new Error("The operation could not be applied.");

      const entityId =
        operation.entity_id ??
        (typeof result === "object" && "id" in result ? String(result.id) : null);
      const applied = entityId
        ? await getDomainRecord(operation.entity_type, entityId)
        : null;
      operations.push({
        ...operation,
        entity_id: entityId,
        before,
        status: "applied",
        applied_revision: applied?.updated_at ?? null,
        error: null,
      });
    } catch (error) {
      operations.push({
        ...operation,
        status: "failed",
        error: error instanceof Error ? error.message : "The operation failed.",
      });
    }
  }

  const appliedCount = operations.filter((item) => item.status === "applied").length;
  const failedCount = operations.filter((item) => item.status === "failed").length;
  const next: AiProposal = {
    ...proposal,
    operations,
    status:
      failedCount > 0
        ? appliedCount > 0
          ? "partially_approved"
          : "failed"
        : appliedCount > 0
          ? "applied"
          : "rejected",
    updated_at: new Date().toISOString(),
  };
  await persistAiProposal(next);
  return next;
}

export async function listAiActionHistory() {
  const userId = await getMutationUserId();
  return db.ai_actions
    .where("user_id")
    .equals(userId)
    .reverse()
    .sortBy("created_at");
}

export async function getAiProposalWarnings(proposal: AiProposal) {
  const warnings: Record<string, string[]> = {};
  for (const operation of proposal.operations) {
    const input = operation.approved_payload ?? operation.proposed;
    const messages: string[] = [];
    if (operation.operation === "create" && operation.entity_type === "assignment") {
      const records = await db.assignments.toArray();
      if (
        records.some(
          (record) =>
            record.deleted_at === null &&
            record.title.trim().toLowerCase() === String(input.title ?? "").trim().toLowerCase() &&
            record.due_date === input.due_date,
        )
      ) {
        messages.push("A likely duplicate assignment has the same title and due date.");
      }
    }
    if (operation.operation === "create" && operation.entity_type === "class") {
      const records = await db.classes.toArray();
      if (
        records.some(
          (record) =>
            record.deleted_at === null &&
            record.day_of_week === input.day_of_week &&
            record.start_time === input.start_time &&
            record.end_time === input.end_time &&
            record.subject.trim().toLowerCase() === String(input.subject ?? "").trim().toLowerCase(),
        )
      ) {
        messages.push("A likely duplicate class has the same subject and meeting time.");
      }
      if (
        records.some(
          (record) =>
            record.deleted_at === null &&
            record.day_of_week === input.day_of_week &&
            String(input.start_time ?? "") < record.end_time &&
            record.start_time < String(input.end_time ?? ""),
        )
      ) {
        messages.push("This class overlaps another saved class.");
      }
    }
    if (operation.operation === "create" && operation.entity_type === "exam") {
      const records = await db.exams.toArray();
      if (
        records.some(
          (record) =>
            record.deleted_at === null &&
            record.exam_date === input.exam_date &&
            record.title.trim().toLowerCase() === String(input.title ?? "").trim().toLowerCase(),
        )
      ) {
        messages.push("A likely duplicate exam has the same title and date.");
      }
    }
    if (operation.operation === "create" && operation.entity_type === "expense") {
      const records = await db.expenses.toArray();
      const proposedTime = Date.parse(String(input.spent_at ?? proposal.created_at));
      if (
        records.some(
          (record) =>
            record.deleted_at === null &&
            Number(record.amount) === Number(input.amount) &&
            record.category === input.category &&
            Math.abs(Date.parse(record.spent_at) - proposedTime) <= 60 * 60 * 1000,
        )
      ) {
        messages.push("A likely duplicate expense has the same amount and category nearby.");
      }
    }
    warnings[operation.id] = messages;
  }
  return warnings;
}

async function restoreDeletedRecord(operation: AiProposedOperation) {
  if (!operation.before || !operation.entity_id) return false;
  const userId = await getMutationUserId();
  const tableName = getTableName(operation.entity_type);
  if (!tableName) return false;
  const timestamp = new Date().toISOString();
  const restored = {
    ...operation.before,
    id: operation.entity_id,
    user_id: userId,
    deleted_at: null,
    updated_at: timestamp,
  };
  const payload: Record<string, unknown> = { ...restored };
  delete payload.id;
  delete payload.user_id;
  delete payload.deleted_at;
  const queueItem = createQueueItem({
    entityId: operation.entity_id,
    entityType: operation.entity_type,
    operation: "create",
    payload,
    userId,
  });
  await db.transaction("rw", db.table(tableName), db.sync_queue, async () => {
    await db.table(tableName).put(restored);
    await db.sync_queue.put(queueItem);
  });
  notifySyncMutationQueued();
  return true;
}

async function undoOperation(operation: AiProposedOperation) {
  if (!operation.entity_id || !operation.applied_revision) return false;
  const current = await getDomainRecord(operation.entity_type, operation.entity_id);
  if (!current || current.updated_at !== operation.applied_revision) return false;

  if (operation.operation === "create") {
    return applyDelete(operation);
  }
  if (operation.operation === "delete") {
    return restoreDeletedRecord(operation);
  }
  if (!operation.before) return false;
  return Boolean(
    await applyUpdate({
      ...operation,
      approved_payload: operation.before,
    }),
  );
}

export async function undoAiAction(history: AiActionHistory) {
  const operations: AiProposedOperation[] = [];
  for (const operation of history.proposal.operations) {
    if (operation.status !== "applied") {
      operations.push(operation);
      continue;
    }
    const undone = await undoOperation(operation);
    operations.push({
      ...operation,
      status: undone ? "undone" : operation.status,
      error: undone ? null : "Undo is unavailable because the record changed later.",
    });
  }
  const fullyUndone = operations
    .filter((item) => item.applied_revision)
    .every((item) => item.status === "undone");
  const proposal: AiProposal = {
    ...history.proposal,
    operations,
    status: fullyUndone ? "undone" : history.proposal.status,
    updated_at: new Date().toISOString(),
  };
  return persistAiProposal(proposal);
}
