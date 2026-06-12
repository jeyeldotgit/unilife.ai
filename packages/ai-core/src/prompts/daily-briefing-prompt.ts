export function buildDailyBriefingPrompt() {
  return [
    "Write one concise daily briefing sentence grounded only in the supplied context.",
    "Mention the recommended focus task when present.",
    "Do not invent classes, deadlines, budget values, or advice.",
    "Return the standard UniLife JSON response with intent general_question and action null.",
  ].join("\n");
}
