import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { parseApiError } from "@/lib/errors";
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
    const submitForm = formRef.current?.submit || formRef.current?.validate;
    if (!submitForm) return;
    setBusy(true);
    setError(null);
    try {
      const values = await submitForm.call(formRef.current);
      const result = await onSubmit(values);
      toast.success(successMessage);
      onSuccess?.(result);
      setOpen(false);
    } catch (err) {
      if (err && typeof err === "object" && !err.message && Object.keys(err).length) {
        setError("Please fix validation errors highlighted in the form.");
      } else {
        setError(parseApiError(err));
        toast.error(parseApiError(err));
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
