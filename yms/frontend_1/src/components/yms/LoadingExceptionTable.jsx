import React, { useState } from "react";
import { exceptionTypeLabel } from "../../services/loadingExceptionsApi";

function statusClass(status) {
  switch (status) {
    case "OPEN":
      return "text-amber-800 bg-amber-50 border-amber-200";
    case "IN_PROGRESS":
      return "text-blue-800 bg-blue-50 border-blue-200";
    case "RESOLVED":
      return "text-emerald-700 bg-emerald-50 border-emerald-200";
    default:
      return "text-slate-600 bg-slate-50 border-slate-200";
  }
}

const LoadingExceptionTable = ({
  rows,
  onAssign,
  onResolve,
  onClose,
  working = false,
  compact = false,
}) => {
  const [assignDraft, setAssignDraft] = useState({});

  if (!rows?.length) {
    return <div className="text-[11px] text-slate-500 py-3 text-center">No exceptions</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className={`w-full ${compact ? "text-[10px]" : "text-[11px]"}`} data-testid="loading-exceptions-table">
        <thead className="bg-slate-50 border-b border-slate-200 text-[9px] uppercase tracking-wider text-slate-500">
          <tr>
            {!compact && <th className="text-left font-semibold px-2 py-2">Vehicle</th>}
            <th className="text-left font-semibold px-2 py-2">Type</th>
            <th className="text-left font-semibold px-2 py-2">Status</th>
            <th className="text-left font-semibold px-2 py-2">Owner</th>
            <th className="text-left font-semibold px-2 py-2">Age</th>
            <th className="text-left font-semibold px-2 py-2 hidden md:table-cell">Created</th>
            <th className="text-left font-semibold px-2 py-2 hidden lg:table-cell">Last Update</th>
            {(onAssign || onResolve || onClose) && (
              <th className="text-right font-semibold px-2 py-2">Actions</th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((ex) => (
            <tr key={ex.id} className="border-b border-slate-100 last:border-0" data-testid={`exception-row-${ex.id}`}>
              {!compact && (
                <td className="px-2 py-2 font-mono-yms font-semibold text-slate-900 whitespace-nowrap">
                  {ex.plate || "—"}
                </td>
              )}
              <td className="px-2 py-2 text-slate-800 whitespace-nowrap">
                {ex.typeLabel || exceptionTypeLabel(ex.exceptionType)}
              </td>
              <td className="px-2 py-2">
                <span className={`inline-flex px-1.5 py-0.5 rounded-sm border text-[9px] font-bold uppercase ${statusClass(ex.status)}`}>
                  {ex.status?.replace("_", " ")}
                </span>
              </td>
              <td className="px-2 py-2 text-slate-700 whitespace-nowrap">{ex.assignedTo || "—"}</td>
              <td className="px-2 py-2 font-mono-yms text-slate-700">{ex.ageLabel}</td>
              <td className="px-2 py-2 text-slate-500 whitespace-nowrap hidden md:table-cell">
                {ex.createdAt
                  ? new Date(ex.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
                  : "—"}
              </td>
              <td className="px-2 py-2 text-slate-500 whitespace-nowrap hidden lg:table-cell">
                {ex.updatedAt
                  ? new Date(ex.updatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
                  : "—"}
              </td>
              {(onAssign || onResolve || onClose) && (
                <td className="px-2 py-2 text-right whitespace-nowrap">
                  <div className="inline-flex flex-col gap-1 items-end">
                    {ex.status === "OPEN" && onAssign && (
                      <div className="flex gap-1 items-center">
                        <input
                          className="w-20 text-[10px] border border-slate-200 rounded px-1 py-0.5"
                          placeholder="Owner"
                          value={assignDraft[ex.id] || ""}
                          onChange={(e) =>
                            setAssignDraft((d) => ({ ...d, [ex.id]: e.target.value }))
                          }
                        />
                        <button
                          type="button"
                          disabled={working || !assignDraft[ex.id]?.trim()}
                          onClick={() => onAssign(ex, assignDraft[ex.id]?.trim())}
                          className="text-[9px] font-semibold border border-slate-300 rounded px-1.5 py-0.5"
                        >
                          Assign
                        </button>
                      </div>
                    )}
                    {(ex.status === "OPEN" || ex.status === "IN_PROGRESS") && onResolve && (
                      <button
                        type="button"
                        disabled={working}
                        onClick={() => onResolve(ex)}
                        className="text-[9px] font-semibold border border-emerald-300 text-emerald-800 bg-emerald-50 rounded px-1.5 py-0.5"
                      >
                        Resolve
                      </button>
                    )}
                    {ex.status === "RESOLVED" && onClose && (
                      <button
                        type="button"
                        disabled={working}
                        onClick={() => onClose(ex)}
                        className="text-[9px] font-semibold border border-slate-300 rounded px-1.5 py-0.5"
                      >
                        Close
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LoadingExceptionTable;
