"use client";

import type { PlanningContext } from "@unilife-ai/types";

import { db } from "@/lib/db/dexie";
import { getLocalDateKey } from "@/lib/api/utils";
import { findActiveBudget } from "@/lib/selectors/finance";
import { getCurrentUserId } from "@/lib/session/current-user";

const DAY_NAMES = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

function currentTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function inclusiveDays(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  return Math.max(1, Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1);
}

export async function getLocalPlanningContext(): Promise<PlanningContext | null> {
  const userId = getCurrentUserId();
  if (!userId) return null;

  const [classes, assignments, exams, budgets, expenses] = await Promise.all([
    db.classes.where("user_id").equals(userId).toArray(),
    db.assignments.where("user_id").equals(userId).toArray(),
    db.exams.where("user_id").equals(userId).toArray(),
    db.budgets.where("user_id").equals(userId).toArray(),
    db.expenses.where("user_id").equals(userId).toArray(),
  ]);
  const today = getLocalDateKey();
  const activeBudget = findActiveBudget(budgets, today);
  const cycleExpenses = activeBudget
    ? expenses.filter(
        (expense) =>
          expense.deleted_at === null &&
          expense.spent_at >= `${activeBudget.start_date}T00:00:00` &&
          expense.spent_at <= `${activeBudget.end_date}T23:59:59.999`,
      )
    : [];
  const spent = cycleExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const elapsedDays = activeBudget ? inclusiveDays(activeBudget.start_date, today) : 0;

  return {
    today,
    current_time: currentTime(),
    todays_classes: classes
      .filter(
        (record) =>
          record.deleted_at === null &&
          record.is_active &&
          record.day_of_week === DAY_NAMES[new Date().getDay()],
      )
      .map((record) => ({
        subject: record.subject,
        start_time: record.start_time,
        end_time: record.end_time,
      })),
    upcoming_deadlines: [
      ...assignments
        .filter(
          (record) =>
            record.deleted_at === null &&
            record.status !== "completed" &&
            Date.parse(record.due_date) >= Date.now(),
        )
        .map((record) => ({
          id: record.id,
          title: record.title,
          due_date: record.due_date,
          type: "assignment" as const,
          status: record.status === "in_progress" ? "in_progress" as const : "pending" as const,
          priority: record.priority,
        })),
      ...exams
        .filter(
          (record) =>
            record.deleted_at === null && Date.parse(record.exam_date) >= Date.now(),
        )
        .map((record) => ({
          id: record.id,
          title: record.title,
          due_date: record.exam_date,
          type: "exam" as const,
          status: "pending" as const,
        })),
    ],
    budget_remaining: activeBudget ? Math.max(0, activeBudget.amount - spent) : null,
    budget_period_end_date: activeBudget?.end_date ?? null,
    avg_daily_spend: activeBudget ? spent / elapsedDays : null,
  };
}
