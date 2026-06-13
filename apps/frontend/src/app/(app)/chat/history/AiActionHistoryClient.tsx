"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { AiActionHistory } from "@unilife-ai/types";

import { AuthenticatedPageHeader } from "@/components/profile/AuthenticatedPageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { listAiActionHistory, undoAiAction } from "@/lib/chat/ai-actions";

function getEntityHref(entityType: string, entityId: string | null) {
  if (!entityId) return null;
  if (entityType === "class") return `/schedule?item=${entityId}`;
  if (entityType === "assignment") return `/assignments?item=${entityId}`;
  if (entityType === "exam") return `/exams?item=${entityId}`;
  if (entityType === "expense") return `/expenses?item=${entityId}`;
  return null;
}

export function AiActionHistoryClient() {
  const [history, setHistory] = useState<AiActionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = async () => {
    setHistory(await listAiActionHistory());
    setLoading(false);
  };

  useEffect(() => {
    void listAiActionHistory().then((records) => {
      setHistory(records);
      setLoading(false);
    });
  }, []);

  return (
    <div className="min-h-dvh bg-[#f8f9fa] pb-28">
      <AuthenticatedPageHeader pageTitle="AI Action History" />
      <main className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-5">
        <Link className="text-sm font-semibold text-[#0058be]" href="/chat">
          Back to Chat
        </Link>
        {loading ? <p className="text-sm text-[#424754]">Loading history...</p> : null}
        {!loading && history.length === 0 ? (
          <EmptyState
            icon="history"
            title="No AI actions yet"
            description="Reviewed AI actions will appear here."
          />
        ) : null}
        {history.map((item) => (
          <article
            className="rounded-2xl border border-[#c2c6d6] bg-white p-4 shadow-sm"
            key={item.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="m-0 text-base font-semibold capitalize">
                  {item.status.replaceAll("_", " ")}
                </p>
                <p className="mt-1 text-xs text-[#424754]">
                  {item.processing_layer} · {new Date(item.created_at).toLocaleString()}
                </p>
              </div>
              {item.status === "applied" || item.status === "partially_approved" ? (
                <button
                  className="rounded-xl border border-[#c2c6d6] px-3 py-2 text-sm font-semibold text-[#0058be]"
                  disabled={busyId === item.id}
                  onClick={async () => {
                    setBusyId(item.id);
                    await undoAiAction(item);
                    await refresh();
                    setBusyId(null);
                  }}
                  type="button"
                >
                  {busyId === item.id ? "Checking..." : "Undo"}
                </button>
              ) : null}
            </div>
            <div className="mt-4 flex flex-col gap-3">
              {item.proposal.operations.map((operation) => {
                const href = getEntityHref(operation.entity_type, operation.entity_id);
                return (
                  <section className="rounded-xl bg-[#f3f4f5] p-3" key={operation.id}>
                    <p className="m-0 text-sm font-semibold capitalize">
                      {operation.operation} {operation.entity_type} · {operation.status}
                    </p>
                    {href ? (
                      <Link className="mt-2 inline-block text-xs font-semibold text-[#0058be]" href={href}>
                        Open affected record
                      </Link>
                    ) : null}
                    {operation.error ? (
                      <p className="mt-2 text-xs font-medium text-[#ba1a1a]">{operation.error}</p>
                    ) : null}
                    {operation.before ? (
                      <details className="mt-2 text-xs text-[#424754]">
                        <summary className="cursor-pointer font-semibold">Previous snapshot</summary>
                        <pre className="mt-2 overflow-auto whitespace-pre-wrap">
                          {JSON.stringify(operation.before, null, 2)}
                        </pre>
                      </details>
                    ) : null}
                  </section>
                );
              })}
            </div>
          </article>
        ))}
      </main>
    </div>
  );
}
