export const SYNC_RETRY_LIMIT = 3;

export const AI_CONFIDENCE_THRESHOLD = 0.7;

export const NOTIFICATION_OFFSETS = {
  class: [30], // minutes before
  assignment: [7 * 1440, 3 * 1440, 1440, 180], // minutes before
  exam: [14 * 1440, 7 * 1440, 3 * 1440, 1440], // minutes before
} as const;

export const EXPENSE_CATEGORIES = [
  "food",
  "transportation",
  "school",
  "entertainment",
  "miscellaneous",
] as const;
