import ExpensesClient from "@/app/(app)/expenses/ExpensesClient";
import { getBudgetStatus } from "@/lib/api/budget";
import { getExpenses } from "@/lib/api/expenses";

export default async function ExpensesPage() {
  const [expensesResult, budgetResult] = await Promise.allSettled([
    getExpenses(),
    getBudgetStatus(),
  ]);

  const expensesSnapshot =
    expensesResult.status === "fulfilled" ? expensesResult.value : null;
  const budget = budgetResult.status === "fulfilled" ? budgetResult.value : null;
  const categoryTotals =
    expensesSnapshot?.categoryTotals.filter((categoryTotal) =>
      ["food", "school", "transportation"].includes(categoryTotal.category),
    ) ?? [];

  return (
    <ExpensesClient
      groups={expensesSnapshot?.groups ?? []}
      categoryTotals={categoryTotals}
      budget={budget}
      expensesAvailable={expensesResult.status === "fulfilled"}
      budgetAvailable={budgetResult.status === "fulfilled"}
    />
  );
}
