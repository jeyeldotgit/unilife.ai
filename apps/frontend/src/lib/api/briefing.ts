"use client";

import type { DailyBriefing, PlanningContext } from "@unilife-ai/types";

import { requestBackendClient } from "@/lib/api/client-browser";

export async function requestDailyBriefing(context: PlanningContext) {
  return requestBackendClient<DailyBriefing>("/api/ai/briefing", {
    method: "POST",
    body: { context },
  });
}
