import { createPortal } from "react-dom";
import { ensureFleetopsEditPortal } from "@/components/fleetops/detail/fleetopsEditPortal";

/**
 * Renders edit/create modals outside the detail drawer DOM tree (avoids Radix nested-dialog dismiss).
 */
export default function DetailEditModalPortal({ open, children }) {
  if (!open) return null;
  const target = ensureFleetopsEditPortal();
  if (!target) return null;
  return createPortal(children, target);
}
