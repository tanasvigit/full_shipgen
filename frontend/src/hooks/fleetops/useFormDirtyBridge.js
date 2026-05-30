import { useEffect, useRef } from "react";
import { useFleetopsDetailDirty } from "@/hooks/fleetops/useFleetopsDetailDirty";

/**
 * Bridges react-hook-form dirty state to drawer close protection.
 */
export function useFormDirtyBridge(formRef, dialogOpen, key = "form-edit") {
  const { setDirty } = useFleetopsDetailDirty();
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!dialogOpen) {
      setDirty(key, false);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return undefined;
    }

    const tick = () => {
      const dirty = formRef.current?.isDirty?.() ?? false;
      setDirty(key, dirty);
    };

    tick();
    intervalRef.current = setInterval(tick, 400);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setDirty(key, false);
    };
  }, [dialogOpen, formRef, key, setDirty]);
}
