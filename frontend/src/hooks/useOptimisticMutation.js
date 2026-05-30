import { useCallback, useState } from "react";
import { toast } from "sonner";
import { parseFleetopsApiError } from "@/lib/fleetops/parseApiErrors";

/**
 * Optimistic update with rollback on failure.
 */
export function useOptimisticMutation() {
  const [pending, setPending] = useState(false);

  const run = useCallback(async ({ apply, commit, rollback, successMessage, errorMessage }) => {
    setPending(true);
    let snapshot;
    try {
      if (apply) snapshot = apply();
      const result = await commit();
      if (successMessage) toast.success(successMessage);
      return result;
    } catch (err) {
      if (rollback && snapshot !== undefined) rollback(snapshot);
      toast.error(errorMessage || parseFleetopsApiError(err));
      throw err;
    } finally {
      setPending(false);
    }
  }, []);

  return { pending, run };
}
