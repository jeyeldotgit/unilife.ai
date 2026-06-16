"use client";

import { useEffect, useState } from "react";
import type { AiProposal } from "@unilife-ai/types";

import { useCurrentUserId } from "@/hooks/use-current-user-id";
import { useLiveQueryValue } from "@/hooks/use-live-query";
import {
  applyAiProposal,
  getAiProposalWarnings,
  persistAiProposal,
} from "@/lib/chat/ai-actions";
import { db } from "@/lib/db/dexie";
import { toDateTimeLocalValue } from "@/lib/api/utils";

const ENTITY_LABELS = {
  assignment: "Assignment",
  class: "Class",
  exam: "Exam",
  expense: "Expense",
} as const;

const FIELD_LABELS: Record<string, string> = {
  amount: "Amount",
  category: "Category",
  class_id: "Link to class",
  day_of_week: "Day",
  description: "Description",
  due_date: "Due date and time",
  end_time: "End time",
  exam_date: "Exam date and time",
  instructor: "Instructor",
  location: "Location",
  priority: "Priority",
  room: "Room",
  start_time: "Start time",
  subject: "Subject name",
  title: "Title",
};

function getActionLabel(operation: { entity_type: string; operation: string }) {
  const entity = ENTITY_LABELS[operation.entity_type as keyof typeof ENTITY_LABELS] ?? operation.entity_type;
  const verb =
    operation.operation === "create"
      ? "Add"
      : operation.operation === "update"
        ? "Update"
        : "Remove";

  return `${verb} ${entity}`;
}

function normalizeFieldValue(key: string, value: unknown) {
  if (
    typeof value === "string" &&
    (key === "due_date" || key === "exam_date" || key === "spent_at")
  ) {
    return toDateTimeLocalValue(value);
  }

  return value === null || value === undefined ? "" : String(value);
}

function denormalizeFieldValue(key: string, value: string, original: unknown) {
  if (key === "due_date" || key === "exam_date" || key === "spent_at") {
    return value ? new Date(value).toISOString() : "";
  }

  if (typeof original === "number") {
    return Number(value);
  }

  if (original === null && value === "") {
    return null;
  }

  return value;
}

export function ProposalReviewCard({
  proposal,
  onChange,
}: {
  proposal: AiProposal;
  onChange?: (proposal: AiProposal) => void;
}) {
  const userId = useCurrentUserId();
  const [draft, setDraft] = useState(proposal);
  const [selected, setSelected] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(proposal.operations.map((operation) => [operation.id, true])),
  );
  const [warnings, setWarnings] = useState<Record<string, string[]>>({});
  const [busy, setBusy] = useState(false);
  const classes = useLiveQueryValue(
    async () => {
      if (!userId) return [];
      return db.classes
        .where("user_id")
        .equals(userId)
        .and((record) => record.deleted_at === null)
        .toArray();
    },
    [],
    [userId],
  );

  useEffect(() => {
    void persistAiProposal(proposal);
    void getAiProposalWarnings(proposal).then(setWarnings);
  }, [proposal]);

  const updateField = (operationId: string, key: string, value: string) => {
    setDraft((current) => ({
      ...current,
      operations: current.operations.map((operation) => {
        if (operation.id !== operationId) return operation;
        const original = operation.proposed[key];
        return {
          ...operation,
          proposed: {
            ...operation.proposed,
            [key]:
              typeof original === "number"
                ? Number(value)
                : denormalizeFieldValue(key, value, original),
          },
        };
      }),
    }));
  };

  const apply = async () => {
    setBusy(true);
    const reviewed: AiProposal = {
      ...draft,
      status: "approved",
      operations: draft.operations.map((operation) =>
        operation.status === "applied" || operation.status === "undone"
          ? operation
          : {
              ...operation,
              status: selected[operation.id] ? "approved" : "rejected",
              approved_payload: selected[operation.id] ? operation.proposed : null,
            },
      ),
      updated_at: new Date().toISOString(),
    };
    const next = await applyAiProposal(reviewed);
    setDraft(next);
    onChange?.(next);
    setBusy(false);
  };

  const reject = async () => {
    const next: AiProposal = {
      ...draft,
      status: "rejected",
      operations: draft.operations.map((operation) => ({
        ...operation,
        status: operation.status === "applied" ? operation.status : "rejected",
      })),
      updated_at: new Date().toISOString(),
    };
    await persistAiProposal(next);
    setDraft(next);
    onChange?.(next);
  };

  return (
    <div className="flex min-w-[260px] flex-col gap-4">
      <div>
        <p className="m-0 text-base font-semibold">
          {draft.operations.length === 1
            ? getActionLabel(draft.operations[0])
            : "Review AI actions"}
        </p>
        <p className="mt-1 text-xs text-[#424754]">
          Check the details before saving.
        </p>
      </div>

      {draft.operations.map((operation) => (
        <section
          className="rounded-xl border border-[#c2c6d6] bg-white p-3"
          key={operation.id}
        >
          <label className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <input
              checked={selected[operation.id] ?? false}
              disabled={operation.status === "applied" || operation.status === "undone"}
              onChange={(event) =>
                setSelected((current) => ({
                  ...current,
                  [operation.id]: event.target.checked,
                }))
              }
              type="checkbox"
            />
            {getActionLabel(operation)}
          </label>

          <div className="flex flex-col gap-2">
            {Object.entries(operation.proposed)
              .filter(([key]) => key !== "id" && key !== "entity_id")
              .map(([key, value]) => {
                const uncertain = operation.uncertain_fields.includes(key);
                const disabled = operation.status === "applied" || operation.status === "undone";

                return (
                  <label className="text-xs font-medium text-[#424754]" key={key}>
                    <span className="flex items-center gap-1">
                      {FIELD_LABELS[key] ?? key.replaceAll("_", " ")}
                      {uncertain ? (
                        <span className="rounded-full bg-[#ffddb8] px-1.5 py-0.5 text-[10px] font-bold text-[#825100]">
                          ?
                        </span>
                      ) : null}
                    </span>
                    {key === "class_id" ? (
                      <select
                        className="mt-1 w-full rounded-lg border border-[#c2c6d6] px-2 py-2 text-sm text-[#191c1d]"
                        disabled={disabled}
                        onChange={(event) => updateField(operation.id, key, event.target.value)}
                        value={value === null ? "" : String(value)}
                      >
                        <option value="">No class linked</option>
                        {classes.value.map((classRecord) => (
                          <option key={classRecord.id} value={classRecord.id}>
                            {classRecord.subject}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        className={`mt-1 w-full rounded-lg border px-2 py-2 text-sm text-[#191c1d] ${
                          uncertain ? "border-[#ffb95f]" : "border-[#c2c6d6]"
                        }`}
                        disabled={disabled}
                        onChange={(event) => updateField(operation.id, key, event.target.value)}
                        type={
                          key === "due_date" || key === "exam_date" || key === "spent_at"
                            ? "datetime-local"
                            : key === "amount" || key === "priority"
                              ? "number"
                              : key.endsWith("_time")
                                ? "time"
                                : "text"
                        }
                        value={normalizeFieldValue(key, value)}
                      />
                    )}
                  </label>
                );
              })}
          </div>

          {(warnings[operation.id] ?? []).map((warning) => (
            <p className="mt-2 text-xs font-medium text-[#825100]" key={warning}>
              {warning}
            </p>
          ))}
          {operation.error ? (
            <p className="mt-2 text-xs font-medium text-[#ba1a1a]">{operation.error}</p>
          ) : null}
        </section>
      ))}

      {draft.status === "proposed" ||
      draft.status === "approved" ||
      draft.status === "failed" ||
      draft.status === "partially_approved" ? (
        <div className="flex gap-2">
          <button
            className="flex-1 rounded-xl border border-[#c2c6d6] px-3 py-2 text-sm font-semibold"
            disabled={busy}
            onClick={() => void reject()}
            type="button"
          >
            Cancel
          </button>
          <button
            className="flex-1 rounded-xl bg-[#0058be] px-3 py-2 text-sm font-semibold text-white"
            disabled={busy || !Object.values(selected).some(Boolean)}
            onClick={() => void apply()}
            type="button"
          >
            {busy ? "Saving..." : "Save"}
          </button>
        </div>
      ) : (
        <p className="m-0 text-sm font-semibold capitalize">Status: {draft.status}</p>
      )}
    </div>
  );
}
