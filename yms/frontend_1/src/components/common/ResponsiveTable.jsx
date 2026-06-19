import React from "react";

/**
 * Horizontal scroll wrapper for data tables on tablet/mobile.
 * Use on all raw <table> layouts to prevent clipped columns.
 */
export function ResponsiveTable({ children, className = "", testId }) {
  return (
    <div
      data-testid={testId}
      className={`overflow-x-auto -mx-px thin-scroll ${className}`}
    >
      {children}
    </div>
  );
}

export default ResponsiveTable;
