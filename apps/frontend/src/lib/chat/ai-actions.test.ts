import { describe, expect, it } from "vitest";

import { buildLocalProposal } from "@/lib/chat/ai-actions";

describe("AI action proposals", () => {
  it("builds local writes as unapplied review proposals", () => {
    const proposal = buildLocalProposal(
      "assignment",
      {
        title: "Research Paper",
        due_date: "2099-06-20T15:59:00.000Z",
      },
      0.95,
    );

    expect(proposal).toMatchObject({
      processing_layer: "local",
      status: "proposed",
      operations: [
        {
          operation: "create",
          entity_type: "assignment",
          entity_id: null,
          before: null,
          status: "proposed",
          applied_revision: null,
          error: null,
        },
      ],
    });
  });

  it("marks low-confidence local fields as uncertain", () => {
    const proposal = buildLocalProposal("expense", { amount: 85, category: "food" }, 0.5);

    expect(proposal.operations[0].uncertain_fields).toEqual(["amount", "category"]);
  });
});
