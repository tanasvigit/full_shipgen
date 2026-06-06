import { useMutation } from "@tanstack/react-query";
import { useCompanyScope } from "@/src/hooks/useCompanyScope";
import { useAuth } from "@/src/contexts/AuthContext";
import { uploadPodWithStaging } from "@/src/pod/uploads";
import { captureError, logEvent } from "@/src/services/observability";

export type PodKind = "signature" | "photo" | "qr";

export function usePodMutation() {
  const { companyUuid } = useCompanyScope();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ kind, orderId, value }: { kind: PodKind; orderId: string; value: string }) => {
      if (!companyUuid || !user?.id) {
        throw new Error("Missing tenant context for POD upload.");
      }
      return uploadPodWithStaging({
        companyUuid,
        userId: user.id,
        orderId,
        kind,
        value,
      });
    },
    onSuccess: (_data, variables) => {
      logEvent("pod.upload.success", {
        kind: variables.kind,
        orderId: variables.orderId,
      });
    },
    onError: (error, variables) => {
      captureError(error, {
        operation: "pod.upload",
        kind: variables.kind,
        orderId: variables.orderId,
      });
    },
  });
}
