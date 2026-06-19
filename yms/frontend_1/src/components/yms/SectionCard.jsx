import React from "react";

export const SectionCard = ({ title, subtitle, action, children, className = "", padding = "p-4", testId }) => (
  <div data-testid={testId} className={`bg-white border border-slate-200 rounded-md ${className}`}>
    {(title || action) && (
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div>
          {title && <div className="font-display font-bold text-sm text-slate-900 tracking-tight">{title}</div>}
          {subtitle && <div className="text-[11px] text-slate-500 mt-0.5">{subtitle}</div>}
        </div>
        {action}
      </div>
    )}
    <div className={padding}>{children}</div>
  </div>
);

export default SectionCard;
