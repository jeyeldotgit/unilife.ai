"use client";

import { useEffect, useState } from "react";
import type { AiProposal } from "@unilife-ai/types";

import {
  applyAiProposal,
  getAiProposalWarnings,
  persistAiProposal,
} from "@/lib/chat/ai-actions";

export function ProposalReviewCard({
  proposal,
  onChange,
}: {
  proposal: AiProposal;
  onChange?: (proposal: AiProposal) => void;
}) {
  const [draft, setDraft] = useState(proposal);
  const [selected, setSelected] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(proposal.operations.map((operation) => [operation.id, true])),
  );
  const [warnings, setWarnings] = useState<Record<string, string[]>>({});
  const [busy, setBusy] = useState(false);

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
                : original === null && value === ""
                  ? null
                  : value,
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
        <p className="m-0 text-base font-semibold">Review AI action</p>
        <p className="mt-1 text-xs text-[#424754]">
          Nothing is saved until you approve it.
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
            {operation.operation} {operation.entity_type}
          </label>

          <div className="flex flex-col gap-2">
            {Object.entries(operation.proposed).map(([key, value]) => (
              <label className="text-xs font-medium text-[#424754]" key={key}>
                {key.replaceAll("_", " ")}
                {operation.uncertain_fields.includes(key) ? " (check this)" : ""}
                <input
                  className="mt-1 w-full rounded-lg border border-[#c2c6d6] px-2 py-2 text-sm text-[#191c1d]"
                  disabled={operation.status === "applied" || operation.status === "undone"}
                  onChange={(event) => updateField(operation.id, key, event.target.value)}
                  value={value === null ? "" : String(value)}
                />
              </label>
            ))}
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
            Reject
          </button>
          <button
            className="flex-1 rounded-xl bg-[#0058be] px-3 py-2 text-sm font-semibold text-white"
            disabled={busy || !Object.values(selected).some(Boolean)}
            onClick={() => void apply()}
            type="button"
          >
            {busy ? "Applying..." : "Apply selected"}
          </button>
        </div>
      ) : (
        <p className="m-0 text-sm font-semibold capitalize">Status: {draft.status}</p>
      )}
    </div>
  );
}
