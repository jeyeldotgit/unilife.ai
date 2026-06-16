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
  RecurrenceException,
  RecurrenceOccurrence,
  RecurrenceSeries,
} from "@unilife-ai/types";

import { requestBackendClient } from "@/lib/api/client-browser";
import { db, type SyncMetaEntity, type SyncMetaRecord } from "@/lib/db/dexie";

type EntityRecordMap = {
  ai_action: AiActionHistory;
  academic_term: AcademicTerm;
  assignment: Assignment;
  budget: Budget;
  budget_revision: BudgetRevision;
  class: ClassRecord;
  exam: Exam;
  expense: Expense;
  holiday_exclusion: HolidayExclusion;
  recurrence_exception: RecurrenceException;
  recurrence_occurrence: RecurrenceOccurrence;
  recurrence_series: RecurrenceSeries;
};

type HydrationResponseMap = {
  ai_action: { actions: AiActionHistory[] };
  academic_term: { terms: AcademicTerm[] };
  assignment: { assignments: Assignment[] };
  budget: { budgets: Budget[] };
  budget_revision: { revisions: BudgetRevision[] };
  class: { classes: ClassRecord[] };
  exam: { exams: Exam[] };
  expense: { expenses: Expense[]; total: number };
  holiday_exclusion: { holiday_exclusions: HolidayExclusion[] };
  recurrence_exception: { recurrence_exceptions: RecurrenceException[] };
  recurrence_occurrence: { recurrence_occurrences: RecurrenceOccurrence[] };
  recurrence_series: { recurrence_series: RecurrenceSeries[] };
};

type HydratableEntity = keyof EntityRecordMap;
type EntityRecord = EntityRecordMap[HydratableEntity];

type HydrationOptions = {
  forceFull?: boolean;
  userId: string;
};

const HYDRATION_ENTITIES: HydratableEntity[] = [
  "ai_action",
  "academic_term",
  "class",
  "assignment",
  "exam",
  "budget",
  "budget_revision",
  "expense",
  "recurrence_series",
  "recurrence_occurrence",
  "recurrence_exception",
  "holiday_exclusion",
];

const entityConfig: {
  [T in HydratableEntity]: {
    endpoint: string | null;
    extract: (response: HydrationResponseMap[T]) => EntityRecordMap[T][];
    table:
      | "classes"
      | "academic_terms"
      | "assignments"
      | "exams"
      | "budgets"
      | "budget_revisions"
      | "expenses"
      | "recurrence_series"
      | "recurrence_occurrences"
      | "recurrence_exceptions"
      | "holiday_exclusions"
      | "ai_actions";
  };
} = {
  ai_action: {
    endpoint: "/api/ai/actions",
    extract: (response) => response.actions,
    table: "ai_actions",
  },
  academic_term: {
    endpoint: "/api/academic-terms",
    extract: (response) => response.terms,
    table: "academic_terms",
  },
  class: {
    endpoint: "/api/classes",
    extract: (response) => response.classes,
    table: "classes",
  },
  assignment: {
    endpoint: "/api/assignments",
    extract: (response) => response.assignments,
    table: "assignments",
  },
  exam: {
    endpoint: "/api/exams",
    extract: (response) => response.exams,
    table: "exams",
  },
  budget: {
    endpoint: "/api/budgets",
    extract: (response) => response.budgets,
    table: "budgets",
  },
  budget_revision: {
    endpoint: "/api/budgets/revisions",
    extract: (response) => response.revisions,
    table: "budget_revisions",
  },
  expense: {
    endpoint: "/api/expenses",
    extract: (response) => response.expenses,
    table: "expenses",
  },
  recurrence_series: {
    endpoint: "/api/recurrence/series",
    extract: (response) => response.recurrence_series,
    table: "recurrence_series",
  },
  recurrence_occurrence: {
    endpoint: "/api/recurrence/occurrences",
    extract: (response) => response.recurrence_occurrences,
    table: "recurrence_occurrences",
  },
  recurrence_exception: {
    endpoint: "/api/recurrence/exceptions",
    extract: (response) => response.recurrence_exceptions,
    table: "recurrence_exceptions",
  },
  holiday_exclusion: {
    endpoint: null,
    extract: () => [],
    table: "holiday_exclusions",
  },
};

function getMetaId(userId: string, entityType: SyncMetaEntity) {
  return `${userId}:${entityType}`;
}

async function getMeta(userId: string, entityType: SyncMetaEntity) {
  return db.sync_meta.get(getMetaId(userId, entityType));
}

function getMaxUpdatedAt<T extends { updated_at?: string; changed_at?: string }>(records: T[]) {
  if (records.length === 0) {
    return null;
  }

  return records.reduce((latest, record) => {
    const timestamp = record.updated_at ?? record.changed_at ?? latest;
    return timestamp > latest ? timestamp : latest;
  }, records[0].updated_at ?? records[0].changed_at ?? new Date(0).toISOString());
}

async function upsertMeta(record: SyncMetaRecord) {
  await db.sync_meta.put(record);
}

async function getProtectedEntityIds(userId: string, entityType: HydratableEntity) {
  if (entityType === "budget_revision") {
    return new Set<string>();
  }

  const queueItems = await db.sync_queue
    .where("user_id")
    .equals(userId)
    .and(
      (item) =>
        item.entity_type === entityType &&
        (item.status === "pending" || item.status === "syncing" || item.status === "failed"),
    )
    .toArray();

  return new Set(queueItems.map((item) => item.entity_id));
}

async function reconcileFullHydration<T extends HydratableEntity>(
  entityType: T,
  tableName: (typeof entityConfig)[T]["table"],
  userId: string,
  records: EntityRecordMap[T][],
) {
  const protectedEntityIds = await getProtectedEntityIds(userId, entityType);
  const serverIds = new Set(records.map((record) => record.id));
  const table = db.table(tableName);
  const localRecords = (await table
    .where("user_id")
    .equals(userId)
    .toArray()) as EntityRecord[];
  const staleIds = localRecords
    .filter((record) => !serverIds.has(record.id) && !protectedEntityIds.has(record.id))
    .map((record) => record.id);

  if (staleIds.length > 0) {
    await table.bulkDelete(staleIds);
  }
}

function normalizeClassKeyPart(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function getClassDuplicateKey(record: ClassRecord) {
  return [
    record.user_id,
    record.term_id ?? "",
    normalizeClassKeyPart(record.subject),
    record.day_of_week,
    record.start_time,
    record.end_time,
    normalizeClassKeyPart(record.room),
    normalizeClassKeyPart(record.instructor),
  ].join("|");
}

async function pruneDuplicateClasses(userId: string) {
  const protectedEntityIds = await getProtectedEntityIds(userId, "class");
  const records = await db.classes
    .where("user_id")
    .equals(userId)
    .and((record) => record.deleted_at === null && record.is_active)
    .toArray();
  const groups = new Map<string, ClassRecord[]>();

  for (const record of records) {
    const key = getClassDuplicateKey(record);
    groups.set(key, [...(groups.get(key) ?? []), record]);
  }

  const duplicateIds: string[] = [];
  for (const group of groups.values()) {
    if (group.length < 2) continue;

    const keep =
      group.find((record) => protectedEntityIds.has(record.id)) ??
      group
        .slice()
        .sort((left, right) => right.updated_at.localeCompare(left.updated_at))[0];

    duplicateIds.push(
      ...group
        .filter((record) => record.id !== keep.id && !protectedEntityIds.has(record.id))
        .map((record) => record.id),
    );
  }

  if (duplicateIds.length > 0) {
    await db.classes.bulkDelete(duplicateIds);
  }
}

async function hydrateEntity<T extends HydratableEntity>(
  entityType: T,
  options: HydrationOptions,
) {
  const config = entityConfig[entityType];
  const currentMeta = options.forceFull
    ? null
    : await getMeta(options.userId, entityType);
  const records = config.endpoint
    ? config.extract(
        await requestBackendClient<HydrationResponseMap[T]>(config.endpoint, {
          query: currentMeta?.last_hydrated_at
            ? { since: currentMeta.last_hydrated_at }
            : undefined,
        }),
      )
    : [];

  if (records.length > 0) {
    await db.table(config.table).bulkPut(records);
  }

  if (options.forceFull) {
    await reconcileFullHydration(entityType, config.table, options.userId, records);
    if (entityType === "class") {
      await pruneDuplicateClasses(options.userId);
    }
  }

  const lastHydratedAt = getMaxUpdatedAt(records) ?? new Date().toISOString();
  const nextMeta: SyncMetaRecord = {
    id: getMetaId(options.userId, entityType),
    user_id: options.userId,
    entity_type: entityType,
    last_hydrated_at: lastHydratedAt,
    last_successful_sync_at: currentMeta?.last_successful_sync_at ?? null,
  };

  await upsertMeta(nextMeta);
}

export async function hydrateAllEntities(options: HydrationOptions) {
  for (const entityType of HYDRATION_ENTITIES) {
    await hydrateEntity(entityType, options);
  }
}

export async function markHydrationSuccess(userId: string) {
  const existingMetaRecords = await Promise.all(
    HYDRATION_ENTITIES.map((entityType) => getMeta(userId, entityType)),
  );
  const timestamp = new Date().toISOString();

  for (let index = 0; index < HYDRATION_ENTITIES.length; index += 1) {
    const entityType = HYDRATION_ENTITIES[index];
    const currentMeta = existingMetaRecords[index];

    await upsertMeta({
      id: getMetaId(userId, entityType),
      user_id: userId,
      entity_type: entityType,
      last_hydrated_at: currentMeta?.last_hydrated_at ?? null,
      last_successful_sync_at: timestamp,
    });
  }
}
