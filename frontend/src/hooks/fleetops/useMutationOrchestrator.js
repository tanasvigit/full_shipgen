import { useCallback, useEffect, useState } from "react";
import { mutationOrchestrator } from "@/domain/fleetops/mutations/orchestrator";

/**
 * React binding for the domain mutation orchestrator (scoped queue + dedupe).
 */
export function useMutationOrchestrator(scope = "default") {
  const [pending, setPending] = useState(mutationOrchestrator.pendingCount > 0);

  useEffect(() => {
    return mutationOrchestrator.subscribe((count) => setPending(count > 0));
  }, []);

  const run = useCallback(
    (options) =>
      mutationOrchestrator.run({
        scope,
        ...options,
      }),
    [scope],
  );

  return { pending, run };
}
