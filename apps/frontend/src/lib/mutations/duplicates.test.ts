import { describe, expect, it } from "vitest";

import { findLikelyExpenseDuplicates } from "./duplicates";

describe("findLikelyExpenseDuplicates", () => {
  it("warns for a similar nearby expense", () => {
    const matches = findLikelyExpenseDuplicates(
      [{
        id: "expense-1",
        user_id: "user-1",
        budget_id: null,
        amount: 85,
        category: "food",
        description: "Lunch",
        spent_at: "2026-06-15T04:00:00.000Z",
        created_at: "2026-06-15T04:00:00.000Z",
        updated_at: "2026-06-15T04:00:00.000Z",
        deleted_at: null,
      }],
      { amount: 85, category: "food", description: "lunch", spentAt: "2026-06-15T05:00:00.000Z" },
    );
    expect(matches).toHaveLength(1);
  });
});
