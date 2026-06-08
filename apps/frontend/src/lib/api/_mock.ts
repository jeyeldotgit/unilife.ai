import type { ApiRequestOptions } from "@/lib/types";

const MIN_DELAY_MS = 300;
const MAX_DELAY_MS = 500;

export type OfflineError = Error & {
  code: "OFFLINE";
};

function cloneData<T>(value: T) {
  return JSON.parse(JSON.stringify(value)) as T;
}

function createOfflineError() {
  const error = new Error(
    "This mock API is offline right now. Changes were not synced.",
  ) as OfflineError;

  error.code = "OFFLINE";

  return error;
}

function wait(durationMs: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, durationMs);
  });
}

function getDelayMs() {
  return Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS + 1)) + MIN_DELAY_MS;
}

export async function withMockLatency<T>(
  resolver: () => T,
  options?: ApiRequestOptions,
) {
  await wait(getDelayMs());

  if (options?.offline) {
    throw createOfflineError();
  }

  return cloneData(resolver());
}
