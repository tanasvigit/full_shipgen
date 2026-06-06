const BASE_MS = 1_000;
const MAX_MS = 60_000;
export const MAX_RETRIES = 8;

export function nextRetryDelayMs(retries: number) {
  const exp = Math.min(MAX_MS, BASE_MS * 2 ** Math.max(0, retries));
  const jitter = Math.floor(Math.random() * 250);
  return exp + jitter;
}

export function shouldDeadLetter(retries: number) {
  return retries >= MAX_RETRIES;
}

export function isRetryableError(error: unknown) {
  const status = (error as { status?: number })?.status;
  if (status && status >= 400 && status < 500 && status !== 408 && status !== 429) {
    return false;
  }
  return true;
}
