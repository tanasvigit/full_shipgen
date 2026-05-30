import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { parseFleetopsApiError } from "@/lib/fleetops/parseApiErrors";
import { useFleetopsDetailDirty } from "@/hooks/fleetops/useFleetopsDetailDirty";

/**
 * Shared submit handler for FleetOps entity modals.
 * @param {{ formRef: React.RefObject, onSubmit: (values: object) => Promise<unknown>, onSuccess?: (result: unknown) => void, successMessage?: string, suspendDrawer?: boolean }} config
 */
export function useFleetopsFormDialog({
  formRef,
  onSubmit,
  onSuccess,
  successMessage = "Saved",
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  suspendDrawer = false,
}) {
  const { beginDetailEdit, endDetailEdit } = useFleetopsDetailDirty();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined && controlledOnOpenChange !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpenRaw = isControlled ? controlledOnOpenChange : setInternalOpen;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const setOpen = useCallback(
    (next) => {
      if (suspendDrawer) {
        if (next) beginDetailEdit();
        else endDetailEdit();
      }
      setOpenRaw(next);
    },
    [suspendDrawer, beginDetailEdit, endDetailEdit, setOpenRaw],
  );

  const openEdit = useCallback(() => {
    if (suspendDrawer) beginDetailEdit();
    setOpenRaw(true);
  }, [setOpenRaw, suspendDrawer, beginDetailEdit]);

  async function handleSubmit() {
    if (!formRef.current?.submit) return;
    setBusy(true);
    setError(null);
    try {
      const values = await formRef.current.submit();
      const result = await onSubmit(values);
      toast.success(successMessage);
      onSuccess?.(result);
      setOpen(false);
    } catch (err) {
      if (err && typeof err === "object" && !err.message && Object.keys(err).length) {
        setError("Please fix validation errors highlighted in the form.");
      } else {
        setError(parseFleetopsApiError(err));
        toast.error(parseFleetopsApiError(err));
      }
    } finally {
      setBusy(false);
    }
  }

  return { open, setOpen, openEdit, busy, error, handleSubmit };
}

export function useFormRef() {
  return useRef(null);
}
