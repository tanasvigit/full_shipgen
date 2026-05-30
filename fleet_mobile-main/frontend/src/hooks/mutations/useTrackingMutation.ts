import { useMutation } from "@tanstack/react-query";
import { trackingService } from "@/src/services/trackingService";
import { captureError, logEvent } from "@/src/services/observability";

export function useTrackingMutation() {
  return useMutation({
    mutationFn: ({
      orderId,
      latitude,
      longitude,
    }: {
      orderId: string;
      latitude: number;
      longitude: number;
    }) => trackingService.uploadOrderLocation(orderId, latitude, longitude),
    onSuccess: (_data, variables) => {
      logEvent("tracking.upload.success", {
        orderId: variables.orderId,
        latitude: variables.latitude,
        longitude: variables.longitude,
      });
    },
    onError: (error, variables) => {
      captureError(error, {
        operation: "tracking.upload",
        orderId: variables.orderId,
      });
    },
  });
}
