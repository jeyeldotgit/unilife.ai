import type { Context } from "hono";
import { ZodError } from "zod";

export type HttpErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "EXTERNAL_SERVICE_UNAVAILABLE"
  | "INTERNAL_ERROR";

type HttpErrorOptions = {
  details?: unknown;
  message: string;
  status: number;
};

export class HttpError extends Error {
  readonly code: HttpErrorCode;
  readonly details?: unknown;
  readonly status: number;

  constructor(code: HttpErrorCode, { details, message, status }: HttpErrorOptions) {
    super(message);
    this.name = "HttpError";
    this.code = code;
    this.details = details;
    this.status = status;
  }
}

function buildErrorResponse(error: HttpError) {
  return {
    error: {
      code: error.code,
      ...(error.details !== undefined ? { details: error.details } : {}),
      message: error.message,
    },
  };
}

function toHttpError(error: unknown) {
  if (error instanceof HttpError) {
    return error;
  }

  if (error instanceof ZodError) {
    return validationError("Request validation failed.", error.flatten());
  }

  if (error instanceof Error) {
    return internalError(error.message);
  }

  return internalError("An unexpected error occurred.");
}

export function unauthenticated(message = "Authentication is required.", details?: unknown) {
  return new HttpError("UNAUTHENTICATED", { details, message, status: 401 });
}

export function forbidden(message = "You do not have access to this resource.", details?: unknown) {
  return new HttpError("FORBIDDEN", { details, message, status: 403 });
}

export function notFound(message = "The requested resource was not found.", details?: unknown) {
  return new HttpError("NOT_FOUND", { details, message, status: 404 });
}

export function validationError(message = "Request validation failed.", details?: unknown) {
  return new HttpError("VALIDATION_ERROR", { details, message, status: 400 });
}

export function conflict(message = "The request could not be completed.", details?: unknown) {
  return new HttpError("CONFLICT", { details, message, status: 409 });
}

export function externalServiceUnavailable(
  message = "An upstream service is unavailable.",
  details?: unknown,
) {
  return new HttpError("EXTERNAL_SERVICE_UNAVAILABLE", {
    details,
    message,
    status: 503,
  });
}

export function internalError(message = "An unexpected error occurred.", details?: unknown) {
  return new HttpError("INTERNAL_ERROR", { details, message, status: 500 });
}

export function handleHttpError(error: unknown, c: Context) {
  const httpError = toHttpError(error);

  return c.json(buildErrorResponse(httpError), httpError.status as never);
}
