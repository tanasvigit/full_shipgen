import React, { useEffect, useRef, useState } from "react";
import { ResponsiveContainer } from "recharts";

/**
 * Chart wrapper with explicit height and deferred mount until container has size.
 * Prevents Recharts width(-1)/height(-1) warnings.
 */
export const ChartBox = ({ height = 256, children, className = "" }) => {
  const ref = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const { width, height: h } = el.getBoundingClientRect();
      setReady(width > 0 && h > 0);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`w-full min-w-0 ${className}`}
      style={{ height, minHeight: height }}
    >
      {ready && (
        <ResponsiveContainer width="100%" height={height}>
          {children}
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default ChartBox;
