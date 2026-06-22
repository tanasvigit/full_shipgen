import { useEffect, useState } from "react";

/** Keeps the branded boot loader visible for at least one full animation cycle. */
export const MIN_BOOT_LOADER_MS = 2400;

export function useMinBootDuration(minMs = MIN_BOOT_LOADER_MS) {
  const [elapsed, setElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setElapsed(true), minMs);
    return () => clearTimeout(timer);
  }, [minMs]);

  return elapsed;
}
