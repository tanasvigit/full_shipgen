import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

const FleetopsDetailDirtyContext = createContext(null);

/** Sync guard — Radix may dismiss the sheet before React commits detailEditOpen. */
const detailEditGuardRef = { current: false };

export function isDetailEditGuarded() {
  return detailEditGuardRef.current;
}

export function FleetopsDetailDirtyProvider({ children }) {
  const [flags, setFlags] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [detailEditOpen, setDetailEditOpenState] = useState(false);

  const setDirty = useCallback((key, isDirty) => {
    setFlags((prev) => {
      if (!isDirty) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: true };
    });
  }, []);

  const isDirty = useMemo(() => Object.keys(flags).length > 0, [flags]);

  const requestClose = useCallback(
    (action) => {
      if (!isDirty) {
        action?.();
        return true;
      }
      setPendingAction(() => action);
      setConfirmOpen(true);
      return false;
    },
    [isDirty],
  );

  const discardAndProceed = useCallback(() => {
    setFlags({});
    setConfirmOpen(false);
    const fn = pendingAction;
    setPendingAction(null);
    fn?.();
  }, [pendingAction]);

  const cancelClose = useCallback(() => {
    setConfirmOpen(false);
    setPendingAction(null);
  }, []);

  const setDetailEditOpen = useCallback((open) => {
    const next = Boolean(open);
    detailEditGuardRef.current = next;
    setDetailEditOpenState(next);
  }, []);

  const beginDetailEdit = useCallback(() => {
    detailEditGuardRef.current = true;
    setDetailEditOpenState(true);
  }, []);

  const endDetailEdit = useCallback(() => {
    detailEditGuardRef.current = false;
    setDetailEditOpenState(false);
  }, []);

  const value = useMemo(
    () => ({
      isDirty,
      setDirty,
      requestClose,
      confirmOpen,
      discardAndProceed,
      cancelClose,
      detailEditOpen,
      setDetailEditOpen,
      beginDetailEdit,
      endDetailEdit,
      isDetailEditGuarded,
    }),
    [
      isDirty,
      setDirty,
      requestClose,
      confirmOpen,
      discardAndProceed,
      cancelClose,
      detailEditOpen,
      setDetailEditOpen,
      beginDetailEdit,
      endDetailEdit,
    ],
  );

  return (
    <FleetopsDetailDirtyContext.Provider value={value}>{children}</FleetopsDetailDirtyContext.Provider>
  );
}

export function useFleetopsDetailDirty() {
  const ctx = useContext(FleetopsDetailDirtyContext);
  if (!ctx) {
    return {
      isDirty: false,
      setDirty: () => {},
      requestClose: (action) => {
        action?.();
        return true;
      },
      confirmOpen: false,
      discardAndProceed: () => {},
      cancelClose: () => {},
      detailEditOpen: false,
      setDetailEditOpen: () => {},
      beginDetailEdit: () => {},
      endDetailEdit: () => {},
      isDetailEditGuarded: () => false,
    };
  }
  return ctx;
}
