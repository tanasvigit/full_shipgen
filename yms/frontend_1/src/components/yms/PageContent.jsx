import React from "react";
import { cn } from "@/lib/utils";
import { PAGE_PADDING } from "@/lib/responsiveClasses";

/**
 * Shared page body wrapper — consistent padding below TopBar.
 * Renders in normal document flow (never under fixed/sticky chrome).
 */
export function PageContent({ children, className, testId = "page-content" }) {
  return (
    <div data-testid={testId} className={cn(PAGE_PADDING, className)}>
      {children}
    </div>
  );
}

export default PageContent;
