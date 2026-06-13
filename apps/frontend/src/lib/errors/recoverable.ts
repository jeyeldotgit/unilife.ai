import type { BackendApiErrorCode } from "@/lib/api/client-browser";

export type DuplicateCandidate = {
  id: string;
  label: string;
  reason: string;
  href?: string;
};

export type RecoverableErrorSource = "server" | "queue" | "network" | "client";

export type RecoverableAppError = {
  code: string;
  message: string;
  retryable: boolean;
  fieldErrors?: Record<string, string[]>;
  duplicateCandidates?: DuplicateCandidate[];
  source: RecoverableErrorSource;
};

const DEFAULT_MESSAGE = "Something went wrong. Please try again.";

const SERVER_CODE_COPY: Record<BackendApiErrorCode, string> = {
  UNAUTHENTICATED: "Please sign in again to continue.",
  FORBIDDEN: "You do not have permission to do that.",
  NOT_FOUND: "That item is no longer available.",
  VALIDATION_ERROR: "Please review the highlighted fields and try again.",
  CONFLICT: "We found a conflicting change. Review it and try again.",
  EXTERNAL_SERVICE_UNAVAILABLE:
    "That service is temporarily unavailable. Please try again.",
  INTERNAL_ERROR: DEFAULT_MESSAGE,
};

function parseFieldErrors(details: unknown) {
  if (!details || typeof details !== "object") {
    return undefined;
  }

  const nextEntries = Object.entries(details as Record<string, unknown>)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        const normalized = value.filter((item): item is string => typeof item === "string");
        return normalized.length > 0 ? [key, normalized] : null;
      }

      if (typeof value === "string") {
        return [key, [value]] as const;
      }

      return null;
    })
    .filter((entry): entry is [string, string[]] => entry !== null);

  return nextEntries.length > 0 ? Object.fromEntries(nextEntries) : undefined;
}

function isRetryableCode(code: BackendApiErrorCode) {
  return !["FORBIDDEN", "NOT_FOUND", "VALIDATION_ERROR"].includes(code);
}

function isBackendApiErrorCode(value: unknown): value is BackendApiErrorCode {
  return (
    value === "UNAUTHENTICATED" ||
    value === "FORBIDDEN" ||
    value === "NOT_FOUND" ||
    value === "VALIDATION_ERROR" ||
    value === "CONFLICT" ||
    value === "EXTERNAL_SERVICE_UNAVAILABLE" ||
    value === "INTERNAL_ERROR"
  );
}

function isBackendLikeError(
  error: unknown,
): error is Error & {
  code: BackendApiErrorCode;
  details?: unknown;
  status: number;
} {
  if (!(error instanceof Error) || typeof error !== "object" || error === null) {
    return false;
  }

  const candidate = error as {
    code?: unknown;
    details?: unknown;
    status?: unknown;
  };

  return (
    isBackendApiErrorCode(candidate.code) &&
    typeof candidate.status === "number"
  );
}

export function createRecoverableAppError(
  input: Partial<RecoverableAppError> & Pick<RecoverableAppError, "message">,
): RecoverableAppError {
  return {
    code: input.code ?? "UNKNOWN",
    message: input.message,
    retryable: input.retryable ?? true,
    source: input.source ?? "client",
    ...(input.fieldErrors ? { fieldErrors: input.fieldErrors } : {}),
    ...(input.duplicateCandidates
      ? { duplicateCandidates: input.duplicateCandidates }
      : {}),
  };
}

export function normalizeRecoverableError(error: unknown): RecoverableAppError {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    "message" in error &&
    "retryable" in error &&
    "source" in error
  ) {
    return error as RecoverableAppError;
  }

  if (isBackendLikeError(error)) {
    return {
      code: error.code,
      message: SERVER_CODE_COPY[error.code] ?? error.message ?? DEFAULT_MESSAGE,
      retryable: isRetryableCode(error.code),
      fieldErrors:
        error.code === "VALIDATION_ERROR" ? parseFieldErrors(error.details) : undefined,
      source: "server",
    };
  }

  if (error instanceof Error) {
    return {
      code: "CLIENT_ERROR",
      message: error.message || DEFAULT_MESSAGE,
      retryable: true,
      source: "client",
    };
  }

  return {
    code: "UNKNOWN",
    message: DEFAULT_MESSAGE,
    retryable: true,
    source: "client",
  };
}

export function fieldErrorMessage(
  fieldErrors: RecoverableAppError["fieldErrors"],
  key: string,
) {
  return fieldErrors?.[key]?.[0] ?? null;
}
