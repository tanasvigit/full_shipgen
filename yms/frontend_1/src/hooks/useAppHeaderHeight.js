import { useLayoutEffect, useRef } from "react";

/**
 * Publishes --yms-app-header-height on <html> from the fixed TopNav element.
 * TopBar sticky offset and main padding-top both consume this variable.
 */
export function useAppHeaderHeight(activeKey = "") {
  const headerRef = useRef(null);

  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const publish = () => {
      const h = el.getBoundingClientRect().height;
      document.documentElement.style.setProperty("--yms-app-header-height", `${h}px`);
    };

    publish();
    const ro = new ResizeObserver(publish);
    ro.observe(el);
    window.addEventListener("resize", publish);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", publish);
    };
  }, [activeKey]);

  return headerRef;
}

export default useAppHeaderHeight;
