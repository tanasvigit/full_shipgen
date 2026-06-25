import React, { createContext, useContext, useMemo } from "react";

const EmbeddedYardAccessContext = createContext({ grantAllModules: false });

/** When true, embedded Shipgen console admins may open any Yard page (matches sidebar access). */
export function EmbeddedYardAccessProvider({ grantAllModules = false, children }) {
  const value = useMemo(() => ({ grantAllModules: Boolean(grantAllModules) }), [grantAllModules]);
  return <EmbeddedYardAccessContext.Provider value={value}>{children}</EmbeddedYardAccessContext.Provider>;
}

export function useEmbeddedYardAccess() {
  return useContext(EmbeddedYardAccessContext);
}
