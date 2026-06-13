import { describe, expect, it } from "vitest";
import { BrowserBackendApiError } from "@/lib/api/client-browser";
import {
  fieldErrorMessage,
  normalizeRecoverableError,
} from "@/lib/errors/recoverable";

describe("recoverable error normalization", () => {
  it("maps backend validation errors into safe field errors", () => {
    const normalized = normalizeRecoverableError(
      new BrowserBackendApiError("Bad request", {
        code: "VALIDATION_ERROR",
        details: {
          title: ["Title is required."],
          timezone: "Timezone is required.",
        },
        status: 400,
      }),
    );

    expect(normalized.message).toBe(
      "Please review the highlighted fields and try again.",
    );
    expect(fieldErrorMessage(normalized.fieldErrors, "title")).toBe(
      "Title is required.",
    );
    expect(fieldErrorMessage(normalized.fieldErrors, "timezone")).toBe(
      "Timezone is required.",
    );
    expect(normalized.retryable).toBe(false);
  });

  it("normalizes generic errors into retryable client-safe messages", () => {
    const normalized = normalizeRecoverableError(new Error("Temporary issue"));

    expect(normalized).toMatchObject({
      code: "CLIENT_ERROR",
      message: "Temporary issue",
      retryable: true,
      source: "client",
    });
  });
});
