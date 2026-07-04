import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  approveGateEntry,
  gateOutVehicle,
  markVehicleArrived,
  recordGateScan,
  rejectGateEntry,
  rejectGateExit,
  updateExitChecklist,
  verifyGateExit,
  type GateVehicleContext,
} from "@/src/services/gateService";

export function useGateMutations(gateId = "G1") {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["yard", "gate"] });
    await queryClient.invalidateQueries({ queryKey: ["yard", "appointments"] });
  };

  const markArrived = useMutation({
    mutationFn: (vehicleId: string) => markVehicleArrived(vehicleId, gateId),
    onSuccess: invalidate,
  });

  const approveEntry = useMutation({
    mutationFn: (ctx: GateVehicleContext) => approveGateEntry(ctx.vehicleId, { gateId: ctx.gateId || gateId }),
    onSuccess: invalidate,
  });

  const rejectEntry = useMutation({
    mutationFn: ({ vehicleId, reason }: { vehicleId: string; reason: string }) =>
      rejectGateEntry(vehicleId, reason, gateId),
    onSuccess: invalidate,
  });

  const toggleExitCheck = useMutation({
    mutationFn: ({ vehicleId, field, value }: { vehicleId: string; field: string; value: boolean }) =>
      updateExitChecklist(vehicleId, { [field]: value }, gateId),
  });

  const verifyExit = useMutation({
    mutationFn: (vehicleId: string) => verifyGateExit(vehicleId, gateId),
    onSuccess: invalidate,
  });

  const gateOut = useMutation({
    mutationFn: (vehicleId: string) => gateOutVehicle(vehicleId, gateId),
    onSuccess: invalidate,
  });

  const rejectExit = useMutation({
    mutationFn: ({ vehicleId, reason }: { vehicleId: string; reason: string }) =>
      rejectGateExit(vehicleId, reason, gateId),
    onSuccess: invalidate,
  });

  const scanBarcode = useMutation({
    mutationFn: ({ query, scanType }: { query: string; scanType?: string }) =>
      recordGateScan(query, { gateId, scanType }),
    onSuccess: invalidate,
  });

  const checklistBusy = toggleExitCheck.isPending;
  const actionBusy =
    markArrived.isPending ||
    approveEntry.isPending ||
    rejectEntry.isPending ||
    verifyExit.isPending ||
    gateOut.isPending ||
    rejectExit.isPending ||
    scanBarcode.isPending;

  const busy = actionBusy || checklistBusy;

  return {
    markArrived,
    approveEntry,
    rejectEntry,
    toggleExitCheck,
    verifyExit,
    gateOut,
    rejectExit,
    scanBarcode,
    busy,
    actionBusy,
    checklistBusy,
  };
}
