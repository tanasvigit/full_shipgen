import React from "react";
import { Search } from "lucide-react";

export const EmptyState = ({ query, label = "records" }) => (
  <div data-testid="empty-state" className="px-4 py-12 text-center">
    <div className="inline-flex items-center justify-center w-12 h-12 rounded-md bg-slate-100 text-slate-400 mb-3">
      <Search className="w-6 h-6" />
    </div>
    <div className="font-display font-bold text-slate-900 text-sm">No {label} match &ldquo;{query}&rdquo;</div>
    <div className="text-[12px] text-slate-500 mt-1">Try a different search term or clear the filter.</div>
  </div>
);

export default EmptyState;
