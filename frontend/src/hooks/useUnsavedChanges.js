import { useEffect } from "react";

/** Warn before browser unload when form is dirty. */
export function useUnsavedChangesGuard(isDirty, message = "You have unsaved changes.") {
  useEffect(() => {
    if (!isDirty) return undefined;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = message;
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty, message]);
}
