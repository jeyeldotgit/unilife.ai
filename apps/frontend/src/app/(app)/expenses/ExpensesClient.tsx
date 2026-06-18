"use client";

import { useEffect, useMemo, useState } from "react";
import type { BudgetPeriod, BudgetRevision, ExpenseCategory } from "@unilife-ai/types";
import { AuthenticatedPageHeader } from "@/components/profile/AuthenticatedPageHeader";
import { useProfile } from "@/components/profile/ProfileContext";
import { BudgetProgressCard } from "@/components/ui/BudgetProgressCard";
import { useDeleteUndoToast } from "@/components/ui/DeleteUndoToast";
import { EmptyState } from "@/components/ui/EmptyState";
import { MutationStatus } from "@/components/ui/MutationStatus";
import { RecoverableError } from "@/components/ui/RecoverableError";
import { Icon } from "@/components/ui/Icon";
import { DuplicateWarningSheet } from "@/components/ui/DuplicateWarningSheet";
import { useExpenses } from "@/hooks/use-expenses";
import { db } from "@/lib/db/dexie";
import { normalizeRecoverableError } from "@/lib/errors/recoverable";
import { resolveExpenseDateRange, type ExpenseDateFilter } from "@/lib/finance/date-ranges";
import {
  beginDeleteUndoLocal,
  finalizeDeleteUndoLocal,
  undoDeleteUndoLocal,
  logExpenseLocal,
  saveBudgetCycleLocal,
} from "@/lib/mutations/local-data";
import { findLikelyExpenseDuplicates } from "@/lib/mutations/duplicates";
import { getLocalDateKey } from "@/lib/api/utils";
import type {
  BudgetStatus,
  ExpenseCategoryTotal,
  ExpenseDayGroup,
} from "@/lib/types";

export interface ExpensesClientProps {
  groups?: ExpenseDayGroup[];
  categoryTotals?: ExpenseCategoryTotal[];
  budget?: BudgetStatus | null;
  expensesAvailable?: boolean;
  budgetAvailable?: boolean;
}

function BudgetFallbackCard() {
  return (
    <section
      className="rounded-xl p-5 shadow-sm"
      style={{
        background: "rgba(255,255,255,0.7)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(229,231,235,0.5)",
      }}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-[#ffddb8] text-[#825100]">
          <Icon name="sync_problem" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-[#191c1d]">
            Budget unavailable
          </h2>
          <p className="mt-1 text-sm font-medium text-[#424754]">
            We couldn&apos;t load your budget summary right now, but the rest of
            the expenses page is still available.
          </p>
        </div>
      </div>
    </section>
  );
}

function NoBudgetCard({ onSetBudget }: { onSetBudget: () => void }) {
  return (
    <section
      className="rounded-xl p-5 shadow-sm"
      style={{
        background: "rgba(255,255,255,0.7)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(229,231,235,0.5)",
      }}
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#d8e2ff] text-[#0058be]">
          <Icon name="account_balance_wallet" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-[#191c1d]">
            No budget set yet
          </h2>
          <p className="mt-1 text-sm font-medium text-[#424754]">
            Your allowance summary will appear after you create a rolling budget.
          </p>
        </div>
        <button
          className="rounded-full bg-[#0058be] px-4 py-2 text-sm font-semibold text-white"
          onClick={onSetBudget}
          type="button"
        >
          Set up your budget
        </button>
      </div>
    </section>
  );
}

export default function ExpensesClient({
  groups: initialGroups = [],
  categoryTotals = [],
  budget = null,
  expensesAvailable,
  budgetAvailable,
}: ExpensesClientProps) {
  const { resolvedTimeZone } = useProfile();
  const [dateFilter, setDateFilter] = useState<ExpenseDateFilter>("month");
  const [customFrom, setCustomFrom] = useState(() => getLocalDateKey(new Date(), resolvedTimeZone));
  const [customTo, setCustomTo] = useState(() => getLocalDateKey(new Date(), resolvedTimeZone));
  const range = useMemo(
    () =>
      dateFilter === "custom" && customFrom > customTo
        ? resolveExpenseDateRange("all", resolvedTimeZone)
        : resolveExpenseDateRange(dateFilter, resolvedTimeZone, new Date(), { from: customFrom, to: customTo }),
    [customFrom, customTo, dateFilter, resolvedTimeZone],
  );
  const expensesState = useExpenses(range);
  const groups = initialGroups.length > 0 ? initialGroups : expensesState.snapshot.groups;
  const resolvedCategoryTotals =
    categoryTotals.length > 0
      ? categoryTotals
      : expensesState.snapshot.categoryTotals;
  const resolvedBudget = budget ?? expensesState.budgetStatus;
  const resolvedExpensesAvailable = expensesAvailable ?? expensesState.available;
  const resolvedBudgetAvailable = budgetAvailable ?? expensesState.budgetAvailable;
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mutationState, setMutationState] = useState<"idle" | "pending" | "queued" | "failed">(
    "idle",
  );
  const { showUndo } = useDeleteUndoToast();
  const [sheet, setSheet] = useState<"expense" | "budget" | "history" | "custom" | null>(null);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("food");
  const [spentAt, setSpentAt] = useState(new Date().toISOString().slice(0, 16));
  const [refundOriginalId, setRefundOriginalId] = useState<string | null>(null);
  const [recurring, setRecurring] = useState(false);
  const [budgetAmount, setBudgetAmount] = useState("");
  const [budgetPeriod, setBudgetPeriod] = useState<BudgetPeriod>("weekly");
  const [budgetStart, setBudgetStart] = useState(() => getLocalDateKey(new Date(), resolvedTimeZone));
  const [budgetFormDirty, setBudgetFormDirty] = useState(false);
  const [revisions, setRevisions] = useState<BudgetRevision[]>([]);
  const [duplicates, setDuplicates] = useState<ReturnType<typeof findLikelyExpenseDuplicates>>([]);
  const [pendingExpense, setPendingExpense] = useState<Parameters<typeof logExpenseLocal>[0] | null>(null);

  useEffect(() => {
    if (budgetFormDirty) return;

    const activeBudget = expensesState.activeBudget;
    if (activeBudget) {
      setBudgetAmount(String(activeBudget.amount));
      setBudgetPeriod(activeBudget.period);
      setBudgetStart(activeBudget.start_date);
      return;
    }

    setBudgetAmount("");
    setBudgetPeriod("weekly");
    setBudgetStart(getLocalDateKey(new Date(), resolvedTimeZone));
  }, [
    budgetFormDirty,
    expensesState.activeBudget?.amount,
    expensesState.activeBudget?.id,
    expensesState.activeBudget?.period,
    expensesState.activeBudget?.start_date,
    resolvedTimeZone,
  ]);

  const openBudgetSheet = () => {
    setBudgetFormDirty(false);
    setErrorMessage(null);
    setSheet("budget");
  };

  const submitExpense = async (force = false) => {
    const numericAmount = Number(amount);
    const input = {
      amount: refundOriginalId ? -Math.abs(numericAmount) : numericAmount,
      category,
      label: description,
      spentAt: new Date(spentAt).toISOString(),
      refundOfExpenseId: refundOriginalId,
      recurrence: recurring
        ? {
            series_id: crypto.randomUUID(),
            occurrence_id: null,
            original_start_at: new Date(spentAt).toISOString(),
            effective_start_at: new Date(spentAt).toISOString(),
            effective_end_at: new Date(spentAt).toISOString(),
            source_revision: 1,
            timezone: resolvedTimeZone,
            rule: {
              frequency: "weekly" as const,
              interval: 1,
              weekdays: [],
              timezone: resolvedTimeZone,
              starts_at: new Date(spentAt).toISOString(),
              ends_at: null,
            },
          }
        : null,
    };
    if (!force && !refundOriginalId) {
      const matches = findLikelyExpenseDuplicates(expensesState.expenses, {
        amount: input.amount,
        category,
        description,
        spentAt: input.spentAt,
      });
      if (matches.length) {
        setPendingExpense(input);
        setDuplicates(matches);
        return;
      }
    }
    try {
      setMutationState("pending");
      await logExpenseLocal(input);
      setSheet(null);
      setAmount("");
      setDescription("");
      setRefundOriginalId(null);
      setRecurring(false);
      setMutationState("queued");
    } catch (error) {
      setErrorMessage(normalizeRecoverableError(error).message);
      setMutationState("failed");
    }
  };

  const openRefund = (id: string, remaining: number, label: string) => {
    setRefundOriginalId(id);
    setAmount(String(remaining));
    setDescription(`Refund: ${label}`);
    setSheet("expense");
  };

  const openHistory = async () => {
    if (expensesState.activeBudget) {
      setRevisions(
        await db.budget_revisions
          .where("budget_id")
          .equals(expensesState.activeBudget.id)
          .reverse()
          .sortBy("changed_at"),
      );
    }
    setSheet("history");
  };

  const handleDelete = (id: string) => {
    setErrorMessage(null);
    setMutationState("pending");
    setRemovingIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    window.setTimeout(() => {
      setRemovingIds((prev) => new Set(prev));
    }, 300);

    void (async () => {
      try {
        const operation = await beginDeleteUndoLocal("expense", id);

        if (!operation) {
          setErrorMessage("We couldn't delete that expense right now.");
          setMutationState("failed");
          return;
        }

        setMutationState("queued");
        showUndo({
          id: operation.queueItemId,
          label: "Expense deleted",
          onExpire: async () => {
            await finalizeDeleteUndoLocal(operation);
            setMutationState("idle");
          },
          onUndo: async () => {
            await undoDeleteUndoLocal(operation);
            setMutationState("idle");
          },
        });
      } catch (error) {
        setErrorMessage(normalizeRecoverableError(error).message);
        setMutationState("failed");
      } finally {
        setRemovingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    })();
  };

  const renderRecentExpenses = () => {
    if (!resolvedExpensesAvailable) {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <RecoverableError
            tone="warning"
            title="Expenses unavailable"
            message="We couldn’t load your latest expenses right now. You can still open this page and refresh when the data is ready."
          />
          <EmptyState
            icon="payments"
            title="Expenses unavailable"
            description="Your recent spending could not be loaded, but the page is still available."
          />
        </div>
      );
    }

    if (groups.length === 0) {
      return (
        <EmptyState
          icon="payments"
          title="No recent expenses"
          description="Your latest logged spending will show up here once you add a new expense."
        />
      );
    }

    return groups.map((group) => (
      <div key={group.day} className="space-y-2">
        <p className="px-1 text-xs font-medium text-[#424754]">{group.day}</p>
        <div className="divide-y divide-[#c2c6d6]/20 overflow-hidden rounded-xl border border-[#c2c6d6]/30 bg-white shadow-sm">
          {group.expenses.map((expense) => (
            <div
              key={expense.id}
              className="flex items-center justify-between p-4 transition-all hover:bg-[#f3f4f5]"
              style={{
                opacity: removingIds.has(expense.id) ? 0 : 1,
                transform: removingIds.has(expense.id)
                  ? "translateX(20px)"
                  : "none",
                transition: "opacity 0.3s ease, transform 0.3s ease",
              }}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#edeeef]">
                  <Icon name={expense.icon} className="text-[#424754]" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{expense.label}</p>
                  <p className="text-xs font-medium text-[#424754]">
                    {expense.categoryLabel} - {expense.timeLabel}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-sm font-bold">{expense.amountLabel}</p>
                {!expense.refundOfExpenseId && expense.amount > 0 ? (
                  <button
                    type="button"
                    className="text-xs font-semibold text-[#0058be]"
                    onClick={() => {
                      const refunded = expensesState.expenses
                        .filter((record) => record.refund_of_expense_id === expense.id && !record.deleted_at)
                        .reduce((sum, record) => sum + record.amount, 0);
                      openRefund(expense.id, expense.amount + refunded, expense.label);
                    }}
                  >
                    Refund
                  </button>
                ) : null}
                <button
                  type="button"
                  aria-label="Delete"
                  onClick={() => handleDelete(expense.id)}
                  disabled={removingIds.has(expense.id)}
                  className="p-1 text-[#ba1a1a]/40 transition-colors hover:text-[#ba1a1a] disabled:cursor-not-allowed"
                >
                  <Icon name="delete" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    ));
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-32 font-sans text-[#191c1d]">
      <AuthenticatedPageHeader className="sticky top-0 z-40 bg-white shadow-sm" pageTitle="Expenses" />

      <main className="mx-auto max-w-2xl space-y-6 px-4 pt-4">
        {resolvedBudgetAvailable && resolvedBudget ? (
          <BudgetProgressCard
            variant="expenses"
            budget={resolvedBudget}
            onEdit={openBudgetSheet}
          />
        ) : resolvedBudgetAvailable ? (
          <NoBudgetCard onSetBudget={openBudgetSheet} />
        ) : (
          <BudgetFallbackCard />
        )}

        <section className="flex flex-wrap gap-2" aria-label="Expense date filters">
          {([
            ["today", "Today"],
            ["yesterday", "Yesterday"],
            ["week", "This Week"],
            ["month", "This Month"],
            ["all", "All"],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setDateFilter(value)}
              className={`rounded-full px-3 py-2 text-xs font-semibold ${dateFilter === value ? "bg-[#0058be] text-white" : "bg-white text-[#424754]"}`}
            >
              {label}
            </button>
          ))}
          <button type="button" onClick={() => setSheet("custom")} className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-[#424754]">
            Custom Range
          </button>
        </section>

        <section>
          <h3 className="mb-3 px-1 text-sm font-semibold text-[#424754]">
            Spending by Category
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {resolvedCategoryTotals.map((category) =>
              category.wide ? (
                <div
                  key={category.category}
                  className="col-span-2 flex items-center justify-between rounded-xl border border-[#c2c6d6]/30 bg-white p-4 shadow-sm transition-transform active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#6cf8bb] text-[#00714d]">
                      <Icon name={category.icon} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{category.label}</p>
                      <p className="text-xs font-medium text-[#424754]">
                        {category.amountLabel}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-[#191c1d]">
                    {category.percent}%
                  </span>
                </div>
              ) : (
                <div
                  key={category.category}
                  className="flex h-28 flex-col justify-between rounded-xl border border-[#c2c6d6]/30 bg-white p-4 shadow-sm transition-transform active:scale-[0.98]"
                >
                  <div className="flex justify-between">
                    <Icon
                      name={category.icon}
                      className={category.iconColor ?? "text-[#424754]"}
                    />
                    <span className="text-xs font-medium text-[#424754]">
                      {category.percent}%
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{category.label}</p>
                    <p className="text-xs font-medium text-[#424754]">
                      {category.amountLabel}
                    </p>
                  </div>
                </div>
              ),
            )}
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="mb-3 px-1 text-sm font-semibold text-[#424754]">
            Recent Expenses
          </h3>

          <MutationStatus
            state={mutationState}
            label={
              mutationState === "queued"
                ? "Expense hidden now. It will sync after the undo window ends."
                : undefined
            }
          />

          {errorMessage ? (
            <RecoverableError title="Expense action failed" message={errorMessage} />
          ) : null}

          {renderRecentExpenses()}
        </section>
      </main>

      <div className="fixed bottom-24 right-6 z-40">
        <button
          aria-label="Log Expense"
          onClick={() => setSheet("expense")}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[#0058be] text-white shadow-[0_8px_24px_rgba(0,88,190,0.35)] transition-transform active:scale-95"
          type="button"
        >
          <Icon name="add" />
        </button>
      </div>

      {sheet ? (
        <div className="fixed inset-0 z-[70] flex items-end bg-black/40">
          <button aria-label="Close sheet" className="absolute inset-0" onClick={() => setSheet(null)} />
          <section className="relative z-10 max-h-[85vh] w-full overflow-y-auto rounded-t-[28px] bg-white p-5">
            <div className="mx-auto mb-5 h-1.5 w-14 rounded-full bg-[#c2c6d6]" />
            {sheet === "custom" ? (
              <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); setDateFilter("custom"); setSheet(null); }}>
                <h2 className="text-xl font-bold">Custom range</h2>
                <label className="block text-sm font-semibold">Start date<input className="mt-1 w-full rounded-xl border p-3" type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} /></label>
                <label className="block text-sm font-semibold">End date<input className="mt-1 w-full rounded-xl border p-3" type="date" min={customFrom} value={customTo} onChange={(e) => setCustomTo(e.target.value)} /></label>
                <button disabled={customFrom > customTo} className="w-full rounded-xl bg-[#0058be] p-3 font-semibold text-white disabled:opacity-50">Apply range</button>
              </form>
            ) : sheet === "budget" ? (
              <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); if (expensesState.activeBudget && !window.confirm("You already have an active budget. Replace it?")) return; setMutationState("pending"); void saveBudgetCycleLocal({ amount: Number(budgetAmount), period: budgetPeriod, startDate: budgetStart, isRolling: true }).then(() => { setSheet(null); setBudgetFormDirty(false); setMutationState("queued"); }).catch((error) => { setErrorMessage(normalizeRecoverableError(error).message); setMutationState("failed"); }); }}>
                <div className="flex items-center justify-between"><h2 className="text-xl font-bold">Budget settings</h2><button type="button" onClick={() => void openHistory()} className="text-sm font-semibold text-[#0058be]">Revision history</button></div>
                <p className="text-sm font-medium text-[#424754]">Set the allowance amount for each rolling period. The end date is calculated automatically.</p>
                <label className="block text-sm font-semibold">Amount<input className="mt-1 w-full rounded-xl border p-3" required min="0.01" step="0.01" type="number" value={budgetAmount} onChange={(e) => { setBudgetFormDirty(true); setBudgetAmount(e.target.value); }} /></label>
                <label className="block text-sm font-semibold">Period<select className="mt-1 w-full rounded-xl border p-3" value={budgetPeriod} onChange={(e) => { setBudgetFormDirty(true); setBudgetPeriod(e.target.value as BudgetPeriod); }}>{["daily", "weekly", "biweekly", "monthly"].map((period) => <option key={period}>{period}</option>)}</select></label>
                <label className="block text-sm font-semibold">Starts on<input className="mt-1 w-full rounded-xl border p-3" type="date" value={budgetStart} onChange={(e) => { setBudgetFormDirty(true); setBudgetStart(e.target.value); }} /></label>
                <button className="w-full rounded-xl bg-[#0058be] p-3 font-semibold text-white">Save budget</button>
              </form>
            ) : sheet === "history" ? (
              <div className="space-y-3"><h2 className="text-xl font-bold">Budget revision history</h2>{revisions.length ? revisions.map((revision) => <article className="rounded-xl bg-[#f3f4f5] p-4 text-sm" key={revision.id}><p className="font-semibold">{new Date(revision.changed_at).toLocaleString()}</p><p>{revision.prior.amount} {revision.prior.period} to {revision.resulting.amount} {revision.resulting.period}</p></article>) : <p className="text-sm text-[#424754]">No budget changes recorded yet.</p>}</div>
            ) : (
              <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); void submitExpense(); }}>
                <h2 className="text-xl font-bold">{refundOriginalId ? "Record refund" : "Log expense"}</h2>
                <label className="block text-sm font-semibold">Amount<input className="mt-1 w-full rounded-xl border p-3" required min="0.01" step="0.01" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></label>
                <label className="block text-sm font-semibold">Description<input className="mt-1 w-full rounded-xl border p-3" required value={description} onChange={(e) => setDescription(e.target.value)} /></label>
                {!refundOriginalId ? <label className="block text-sm font-semibold">Category<select className="mt-1 w-full rounded-xl border p-3" value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)}>{["food", "transportation", "school", "entertainment", "miscellaneous"].map((value) => <option key={value}>{value}</option>)}</select></label> : null}
                <label className="block text-sm font-semibold">Spent at<input className="mt-1 w-full rounded-xl border p-3" type="datetime-local" value={spentAt} onChange={(e) => setSpentAt(e.target.value)} /></label>
                {!refundOriginalId ? <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} /> Repeat weekly</label> : null}
                <button className="w-full rounded-xl bg-[#0058be] p-3 font-semibold text-white">{refundOriginalId ? "Record refund" : "Save expense"}</button>
              </form>
            )}
          </section>
        </div>
      ) : null}

      <DuplicateWarningSheet
        open={duplicates.length > 0}
        candidates={duplicates}
        onCancel={() => { setDuplicates([]); setPendingExpense(null); }}
        onReview={() => setDuplicates([])}
        onConfirm={() => {
          if (pendingExpense) void logExpenseLocal(pendingExpense).then(() => setSheet(null));
          setDuplicates([]);
          setPendingExpense(null);
        }}
      />
    </div>
  );
}
