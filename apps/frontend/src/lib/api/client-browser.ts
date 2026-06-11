import { createClient } from "@/lib/supabase/client";

export type BackendApiErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "EXTERNAL_SERVICE_UNAVAILABLE"
  | "INTERNAL_ERROR";

type BackendErrorEnvelope = {
  error?: {
    code?: BackendApiErrorCode;
    details?: unknown;
    message?: string;
  };
};

type RequestBackendOptions = {
  body?: BodyInit | Record<string, unknown>;
  headers?: HeadersInit;
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  query?: Record<string, string | number | boolean | null | undefined>;
};

export class BrowserBackendApiError extends Error {
  readonly status: number;
  readonly code: BackendApiErrorCode;
  readonly details?: unknown;

  constructor(
    message: string,
    options: {
      code?: BackendApiErrorCode;
      details?: unknown;
      status: number;
    },
  ) {
    super(message);
    this.name = "BrowserBackendApiError";
    this.status = options.status;
    this.code = options.code ?? "INTERNAL_ERROR";
    this.details = options.details;
  }
}

function getBackendBaseUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.trim();

  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_BACKEND_URL is not configured.");
  }

  return baseUrl.replace(/\/+$/, "");
}

export function buildBrowserBackendUrl(
  path: string,
  query?: RequestBackendOptions["query"],
) {
  const url = new URL(`${getBackendBaseUrl()}${path}`);

  if (!query) {
    return url.toString();
  }

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }

    url.searchParams.set(key, String(value));
  }

  return url.toString();
}

async function getAccessToken() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new BrowserBackendApiError("Authentication is required.", {
      code: "UNAUTHENTICATED",
      status: 401,
    });
  }

  return session.access_token;
}

async function parseJsonResponse(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    return null;
  }

  return (await response.json()) as unknown;
}

function normalizeBackendError(response: Response, payload: unknown) {
  const envelope = payload as BackendErrorEnvelope | null;
  const message =
    envelope?.error?.message ??
    `Backend request failed with status ${response.status}.`;

  return new BrowserBackendApiError(message, {
    code: envelope?.error?.code,
    details: envelope?.error?.details,
    status: response.status,
  });
}

export async function requestBackendClient<T>(
  path: string,
  options: RequestBackendOptions = {},
) {
  const token = await getAccessToken();
  const headers = new Headers(options.headers);

  headers.set("Authorization", `Bearer ${token}`);

  let body: BodyInit | undefined;
  if (options.body !== undefined) {
    if (
      typeof options.body === "string" ||
      options.body instanceof Blob ||
      options.body instanceof FormData ||
      options.body instanceof URLSearchParams ||
      options.body instanceof ArrayBuffer
    ) {
      body = options.body;
    } else {
      headers.set("Content-Type", "application/json");
      body = JSON.stringify(options.body);
    }
  }

  const response = await fetch(buildBrowserBackendUrl(path, options.query), {
    method: options.method ?? "GET",
    headers,
    body,
    cache: "no-store",
  });

  const payload = await parseJsonResponse(response);

  if (!response.ok) {
    throw normalizeBackendError(response, payload);
  }

  return payload as T;
}
