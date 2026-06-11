"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteExpenseAction } from "@/actions/expenses";
import { PageHeader } from "@/components/layout/PageHeader";
import { BudgetProgressCard } from "@/components/ui/BudgetProgressCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import type {
  BudgetStatus,
  ExpenseCategoryTotal,
  ExpenseDayGroup,
} from "@/lib/types";

export interface ExpensesClientProps {
  groups: ExpenseDayGroup[];
  categoryTotals: ExpenseCategoryTotal[];
  budget: BudgetStatus | null;
  expensesAvailable: boolean;
  budgetAvailable: boolean;
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

function NoBudgetCard() {
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
        <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-[#d8e2ff] text-[#0058be]">
          <Icon name="account_balance_wallet" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-[#191c1d]">
            No budget set yet
          </h2>
          <p className="mt-1 text-sm font-medium text-[#424754]">
            You can still browse expenses now. Your allowance summary will appear
            after you create an active budget cycle.
          </p>
        </div>
      </div>
    </section>
  );
}

export default function ExpensesClient({
  groups: initialGroups,
  categoryTotals,
  budget,
  expensesAvailable,
  budgetAvailable,
}: ExpensesClientProps) {
  const router = useRouter();
  const [groups, setGroups] = useState<ExpenseDayGroup[]>(initialGroups);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setErrorMessage(null);
    setRemovingIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    window.setTimeout(() => {
      setGroups((prev) =>
        prev
          .map((group) => ({
            ...group,
            expenses: group.expenses.filter((expense) => expense.id !== id),
          }))
          .filter((group) => group.expenses.length > 0),
      );
    }, 300);

    void (async () => {
      const result = await deleteExpenseAction(id);

      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });

      if (!result.ok) {
        setGroups(initialGroups);
        setErrorMessage(result.error ?? "We couldn't delete that expense right now.");
      }

      router.refresh();
    })();
  };

  const renderRecentExpenses = () => {
    if (!expensesAvailable) {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="rounded-xl border border-[#ffddb8] bg-[#fff8f1] px-4 py-3 text-sm font-medium text-[#825100] shadow-sm">
            We couldn&apos;t load your latest expenses right now. You can still
            open this page and refresh when the data is ready.
          </div>
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
      <PageHeader
        className="sticky top-0 z-40 bg-white shadow-sm"
        title="Expenses"
        leading={
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#d8e2ff]">
            <img
              alt="User Profile Picture"
              className="h-full w-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDaRtE81Eze5Ia1an7hTYaHoBMDwwegPdtdcvZ0SiKkAUtFGEetDGDKNgwEV_d6pYVt-rC44qQSRQVMa8Fe3doKp3jyQb8AqzlgvesU7n_YGYlaH5xI1r1Wtmd90Q8TmmkK49MXiQsfCXsF2TwOBX2ocAtTUsGt1TMG7RWuijBaddPRLTCJZTHI5BKELnwhwX3GyKYMfTXspDcyTkaRAnwNVOcGbAiACg9gtn9mSLw8qrmz3mlsINT-DsLPjM7M3OAdNHS4kMqKqzA"
            />
          </div>
        }
        trailing={
          <button className="text-[#3B82F6] transition-opacity active:scale-95 hover:opacity-80">
            <Icon name="notifications" />
          </button>
        }
      />

      <main className="mx-auto max-w-2xl space-y-6 px-4 pt-4">
        {budgetAvailable && budget ? (
          <BudgetProgressCard variant="expenses" budget={budget} />
        ) : budgetAvailable ? (
          <NoBudgetCard />
        ) : (
          <BudgetFallbackCard />
        )}

        <section>
          <h3 className="mb-3 px-1 text-sm font-semibold text-[#424754]">
            Spending by Category
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {categoryTotals.map((category) =>
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

          {errorMessage ? (
            <div className="rounded-xl border border-[#ffdad6] bg-[#fff8f7] px-4 py-3 text-sm font-medium text-[#ba1a1a] shadow-sm">
              {errorMessage}
            </div>
          ) : null}

          {renderRecentExpenses()}
        </section>
      </main>

      <div className="fixed bottom-24 left-0 right-0 z-40 px-4 md:mx-auto md:max-w-md">
        <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#3B82F6] py-4 text-sm font-semibold text-white shadow-xl transition-transform active:scale-95">
          <Icon name="add" />
          Log Expense
        </button>
      </div>
    </div>
  );
}
