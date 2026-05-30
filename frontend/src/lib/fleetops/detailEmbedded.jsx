import { PageLoader } from "@/components/loaders";
import DetailEditModalPortal from "@/components/fleetops/detail/DetailEditModalPortal";

/** Mount edit dialog outside drawer DOM when embedded (avoids Radix nested-dialog dismiss). */
export function wrapDetailEditDialog(embedded, open, dialog) {
  if (!embedded) return dialog;
  return <DetailEditModalPortal open={open}>{dialog}</DetailEditModalPortal>;
}

export function resolveDetailEntityId(entityIdProp, routeId) {
  return entityIdProp || routeId;
}

export function DetailLoadingState({ embedded, message, testId }) {
  if (embedded) {
    return <PageLoader loading skeleton="detail" message={message} testId={testId} />;
  }
  return <div className="p-8 text-[#374151]">{message}</div>;
}
