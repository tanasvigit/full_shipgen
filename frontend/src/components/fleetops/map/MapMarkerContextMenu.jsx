import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";

/**
 * Map context menu for vehicle/driver markers (G078).
 */
export default function MapMarkerContextMenu({ marker, position, onClose, onOpenDetail }) {
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose?.();
    };
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  if (!marker || !position) return null;

  const entityKey = marker.entityKey || marker.kind;
  const rawId = String(marker.id || "").replace(/^(driver|vehicle)-/, "");

  const items = [];
  if (entityKey === "driver") {
    items.push(
      { label: "View driver", testId: "map-ctx-driver-view", action: () => onOpenDetail?.("driver", rawId) || navigate(`/fleet-ops/management/drivers?driver=${rawId}`) },
      { label: "Assign orders", testId: "map-ctx-driver-assign", action: () => navigate("/fleet-ops/operations/orders?without_driver=1") },
    );
  } else if (entityKey === "vehicle") {
    items.push(
      { label: "View vehicle", testId: "map-ctx-vehicle-view", action: () => onOpenDetail?.("vehicle", rawId) || navigate(`/fleet-ops/management/vehicles?vehicle=${rawId}`) },
      { label: "Live tracking", testId: "map-ctx-vehicle-tracking", action: () => navigate("/fleet-ops/connectivity/tracking") },
    );
  } else if (entityKey === "order") {
    items.push(
      { label: "View order", testId: "map-ctx-order-view", action: () => onOpenDetail?.("order", rawId) || navigate(`/fleet-ops/operations/orders?order=${rawId}`) },
    );
  }

  if (!items.length) return null;

  return createPortal(
    <div
      ref={ref}
      className="fixed z-[2000] min-w-[160px] bg-white border border-black/[0.1] rounded-md shadow-lg py-1 text-sm"
      style={{ left: position.x, top: position.y }}
      data-testid="map-marker-context-menu"
      role="menu"
    >
      <div className="px-3 py-1.5 text-[10px] font-mono uppercase text-[#6B7280] border-b border-black/[0.06]">
        {marker.label || entityKey}
      </div>
      {items.map((item) => (
        <button
          key={item.testId}
          type="button"
          role="menuitem"
          className="w-full text-left px-3 py-2 hover:bg-[#F5F6F8] text-[#0A0E1A]"
          data-testid={item.testId}
          onClick={() => {
            item.action();
            onClose?.();
          }}
        >
          {item.label}
        </button>
      ))}
    </div>,
    document.body,
  );
}
