import React, { createContext, useCallback, useContext, useState } from "react";

const UIContext = createContext(null);

export const UIProvider = ({ children }) => {
  const [vehicle, setVehicle] = useState(null);
  const [appointment, setAppointment] = useState(null);
  const [dock, setDock] = useState(null);
  const [loadingOp, setLoadingOp] = useState(null);
  const [equipment, setEquipment] = useState(null);
  const [labor, setLabor] = useState(null);
  const [detention, setDetention] = useState(null);
  const [exitVerification, setExitVerification] = useState(null);
  const [bookOpen, setBookOpen] = useState(false);
  const [bookPrefill, setBookPrefill] = useState(null);
  const [search, setSearch] = useState("");

  const openVehicle = useCallback((v) => setVehicle(v), []);
  const closeVehicle = useCallback(() => setVehicle(null), []);
  const openAppointment = useCallback((a) => setAppointment(a), []);
  const closeAppointment = useCallback(() => setAppointment(null), []);
  const openDock = useCallback((d) => setDock(d), []);
  const closeDock = useCallback(() => setDock(null), []);
  const openLoadingOp = useCallback((o) => setLoadingOp(o), []);
  const closeLoadingOp = useCallback(() => setLoadingOp(null), []);
  const openEquipment = useCallback((e) => setEquipment(e), []);
  const closeEquipment = useCallback(() => setEquipment(null), []);
  const openLabor = useCallback((t) => setLabor(t), []);
  const closeLabor = useCallback(() => setLabor(null), []);
  const openDetention = useCallback((d) => setDetention(d), []);
  const closeDetention = useCallback(() => setDetention(null), []);
  const openExitVerification = useCallback((v) => setExitVerification(v), []);
  const closeExitVerification = useCallback(() => setExitVerification(null), []);
  const openBookSlot = useCallback((prefill = null) => {
    setBookPrefill(prefill);
    setBookOpen(true);
  }, []);
  const closeBookSlot = useCallback(() => setBookOpen(false), []);
  const clearSearch = useCallback(() => setSearch(""), []);

  return (
    <UIContext.Provider
      value={{
        vehicle, openVehicle, closeVehicle,
        appointment, openAppointment, closeAppointment,
        dock, openDock, closeDock,
        loadingOp, openLoadingOp, closeLoadingOp,
        equipment, openEquipment, closeEquipment,
        labor, openLabor, closeLabor,
        detention, openDetention, closeDetention,
        exitVerification, openExitVerification, closeExitVerification,
        bookOpen, openBookSlot, closeBookSlot, bookPrefill,
        search, setSearch, clearSearch,
      }}
    >
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used within UIProvider");
  return ctx;
};
