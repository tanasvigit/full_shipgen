import { formatResourceGatingMessage } from "@/src/lib/resourceGating";
import { YmsApiError } from "@/src/lib/ymsApi";

export function formatYmsAlertMessage(err: unknown, fallback = "Please try again.") {
  if (err instanceof YmsApiError) {
    const gated = formatResourceGatingMessage(err.payload);
    if (gated) return gated;
    return err.message;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
