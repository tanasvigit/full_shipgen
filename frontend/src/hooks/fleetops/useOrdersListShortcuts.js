import { useEffect } from "react";

/**
 * Dispatcher keyboard shortcuts on orders list.
 * n — new order · / — focus search · 1/2/3 — table/kanban/map · r — refresh
 */
export function useOrdersListShortcuts({ onNew, onRefresh, onViewChange, searchInputRef, enabled = true }) {
  useEffect(() => {
    if (!enabled) return undefined;

    const onKey = (e) => {
      if (e.target.matches("input, textarea, select, [contenteditable=true]")) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === "n") {
        e.preventDefault();
        onNew?.();
      }
      if (e.key === "/") {
        e.preventDefault();
        searchInputRef?.current?.focus();
      }
      if (e.key === "r") {
        e.preventDefault();
        onRefresh?.();
      }
      if (e.key === "1") onViewChange?.("table");
      if (e.key === "2") onViewChange?.("kanban");
      if (e.key === "3") onViewChange?.("map");
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled, onNew, onRefresh, onViewChange, searchInputRef]);
}
