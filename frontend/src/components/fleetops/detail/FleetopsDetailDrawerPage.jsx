import DetailDrawerHeader from "@/components/fleetops/detail/DetailDrawerHeader";
import DetailDrawerTabs from "@/components/fleetops/detail/DetailDrawerTabs";

/** Shared padding for drawer bodies without tabs (matches Orders overview sections). */
export const FLEETOPS_DETAIL_BODY_CLASS = "px-4 pb-6 space-y-4";

/** Optional strip below header (health banners, alerts). */
export const FLEETOPS_DETAIL_BANNER_CLASS = "px-4 pb-2";

/**
 * Standard FleetOps embedded detail drawer page — same structure as Orders detail.
 * Header → optional banner → optional prependTabs → tabs OR body → optional footer (dialogs).
 */
export default function FleetopsDetailDrawerPage({
  testId,
  headerProps,
  header,
  banner,
  prependTabs,
  tabs,
  body,
  footer,
  bodyClassName = FLEETOPS_DETAIL_BODY_CLASS,
  prependTabsClassName = "px-4 pb-2 space-y-4",
}) {
  const headerNode = header ?? (headerProps ? <DetailDrawerHeader {...headerProps} /> : null);

  return (
    <div data-testid={testId}>
      {headerNode}
      {banner ? <div className={FLEETOPS_DETAIL_BANNER_CLASS}>{banner}</div> : null}
      {prependTabs ? <div className={prependTabsClassName}>{prependTabs}</div> : null}
      {tabs ? <DetailDrawerTabs {...tabs} /> : null}
      {!tabs && body ? <div className={bodyClassName}>{body}</div> : null}
      {footer}
    </div>
  );
}
