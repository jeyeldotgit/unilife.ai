"use client";

import type {
  DailyBriefing,
  PlanningContext,
  ScheduleInsight,
  ScheduleInsightContext,
} from "@unilife-ai/types";

import { requestBackendClient } from "@/lib/api/client-browser";

export async function requestDailyBriefing(context: PlanningContext) {
  return requestBackendClient<DailyBriefing>("/api/ai/briefing", {
    method: "POST",
    body: { context },
  });
}

export async function requestScheduleInsight(context: ScheduleInsightContext) {
  return requestBackendClient<ScheduleInsight>("/api/ai/schedule-insight", {
    method: "POST",
    body: { context },
  });
}
