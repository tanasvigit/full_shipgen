import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  completeLoadingAtDock,
  assignEquipmentToDock,
  assignLaborToDock,
  assignVehicleToDock,
  createDock,
  createLoadingException,
  pauseLoadingAtDock,
  releaseDockResources,
  releaseDock,
  resumeLoadingAtDock,
  startLoadingAtDock,
  updateDockStatus,
  type CreateDockInput,
  type LoadingExceptionInput,
} from "@/src/services/dockService";

export function useDockMutations() {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["yard", "docks"] });
    await queryClient.invalidateQueries({ queryKey: ["yard", "queue"] });
    await queryClient.invalidateQueries({ queryKey: ["yard", "docks", "resources"] });
    await queryClient.invalidateQueries({ queryKey: ["yard", "docks", "readiness"] });
  };

  const startLoading = useMutation({
    mutationFn: (vehicleId: string) => startLoadingAtDock(vehicleId),
    onSuccess: invalidate,
  });

  const completeLoading = useMutation({
    mutationFn: (vehicleId: string) => completeLoadingAtDock(vehicleId),
    onSuccess: invalidate,
  });

  const reportException = useMutation({
    mutationFn: (input: LoadingExceptionInput) => createLoadingException(input),
    onSuccess: invalidate,
  });

  const createDockEntry = useMutation({
    mutationFn: (input: CreateDockInput) => createDock(input),
    onSuccess: invalidate,
  });

  const patchDockStatus = useMutation({
    mutationFn: ({ dockId, status, notes }: { dockId: string; status: string; notes?: string }) =>
      updateDockStatus(dockId, status, notes),
    onSuccess: invalidate,
  });

  const pauseLoading = useMutation({
    mutationFn: (input: Parameters<typeof pauseLoadingAtDock>[0]) => pauseLoadingAtDock(input),
    onSuccess: invalidate,
  });

  const resumeLoading = useMutation({
    mutationFn: (input: Parameters<typeof resumeLoadingAtDock>[0]) => resumeLoadingAtDock(input),
    onSuccess: invalidate,
  });

  const assignLabor = useMutation({
    mutationFn: ({ dockId, laborId }: { dockId: string; laborId: string }) =>
      assignLaborToDock(dockId, laborId),
    onSuccess: invalidate,
  });

  const assignEquipment = useMutation({
    mutationFn: ({ dockId, equipmentId }: { dockId: string; equipmentId: string }) =>
      assignEquipmentToDock(dockId, equipmentId),
    onSuccess: invalidate,
  });

  const assignVehicle = useMutation({
    mutationFn: ({ dockId, queueEntryId }: { dockId: string; queueEntryId: string }) =>
      assignVehicleToDock(dockId, queueEntryId),
    onSuccess: invalidate,
  });

  const releaseResources = useMutation({
    mutationFn: (dockId: string) => releaseDockResources(dockId),
    onSuccess: invalidate,
  });

  const releaseDockEntry = useMutation({
    mutationFn: ({ dockId, row }: { dockId: string; row: Parameters<typeof releaseDock>[1] }) =>
      releaseDock(dockId, row),
    onSuccess: invalidate,
  });

  const busy =
    startLoading.isPending ||
    completeLoading.isPending ||
    reportException.isPending ||
    createDockEntry.isPending ||
    patchDockStatus.isPending ||
    pauseLoading.isPending ||
    resumeLoading.isPending ||
    assignLabor.isPending ||
    assignEquipment.isPending ||
    assignVehicle.isPending ||
    releaseResources.isPending ||
    releaseDockEntry.isPending;

  return {
    startLoading,
    completeLoading,
    reportException,
    createDockEntry,
    patchDockStatus,
    pauseLoading,
    resumeLoading,
    assignLabor,
    assignEquipment,
    assignVehicle,
    releaseResources,
    releaseDockEntry,
    busy,
  };
}
