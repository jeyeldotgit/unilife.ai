import { describe, expect, it } from "vitest";

import { inferExpenseCategory } from "@/lib/api/utils";

describe("inferExpenseCategory", () => {
  it("maps short-form transportation labels", () => {
    expect(inferExpenseCategory("transpo 120")).toBe("transportation");
    expect(inferExpenseCategory("grab home")).toBe("transportation");
  });
});
