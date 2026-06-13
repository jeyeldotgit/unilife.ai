export function buildScheduleInsightPrompt() {
  return [
    "Write one concise schedule insight grounded only in today's supplied class blocks and current time.",
    "Prioritize the current class, next class, or a useful free-time gap between classes.",
    "Do not mention assignments, exams, deadlines, budgets, or finances.",
    "Do not invent classes, times, free windows, or advice unsupported by the schedule.",
    "Return the standard UniLife JSON response with intent general_question and action null.",
  ].join("\n");
}
