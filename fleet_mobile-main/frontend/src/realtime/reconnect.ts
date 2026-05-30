const BASE_MS = 1_000;
const MAX_MS = 30_000;

export function nextReconnectDelayMs(attempt: number) {
  return Math.min(MAX_MS, BASE_MS * 2 ** Math.max(0, attempt));
}
