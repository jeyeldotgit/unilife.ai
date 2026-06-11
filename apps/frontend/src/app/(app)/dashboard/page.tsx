import DashboardClient from "@/app/(app)/dashboard/DashboardClient";
import { getAssignments } from "@/lib/api/assignments";
import { getBudgetStatus } from "@/lib/api/budget";
import { getExams } from "@/lib/api/exams";
import { getClasses } from "@/lib/api/schedule";

import { buildDashboardPageData } from "./page-data";

export default async function DashboardPage() {
  const [scheduleResult, assignmentsResult, examsResult, budgetResult] =
    await Promise.allSettled([
      getClasses(),
      getAssignments(),
      getExams(),
      getBudgetStatus(),
    ]);
  const pageData = buildDashboardPageData({
    scheduleResult,
    assignmentsResult,
    examsResult,
    budgetResult,
  });

  return (
    <DashboardClient
      {...pageData}
    />
  );
}
