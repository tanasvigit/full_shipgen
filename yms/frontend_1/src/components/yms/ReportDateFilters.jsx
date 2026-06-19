import React from "react";

const ReportDateFilters = ({ dateFrom, dateTo, onChange, children }) => (
  <div className="flex flex-wrap items-end gap-3">
    <label className="text-[11px]">
      <span className="block text-slate-500 font-semibold mb-1">From</span>
      <input
        type="date"
        value={dateFrom}
        onChange={(e) => onChange({ dateFrom: e.target.value, dateTo })}
        className="border border-slate-300 rounded-md px-2 py-1.5 text-[12px]"
      />
    </label>
    <label className="text-[11px]">
      <span className="block text-slate-500 font-semibold mb-1">To</span>
      <input
        type="date"
        value={dateTo}
        onChange={(e) => onChange({ dateFrom, dateTo: e.target.value })}
        className="border border-slate-300 rounded-md px-2 py-1.5 text-[12px]"
      />
    </label>
    {children}
  </div>
);

export default ReportDateFilters;
