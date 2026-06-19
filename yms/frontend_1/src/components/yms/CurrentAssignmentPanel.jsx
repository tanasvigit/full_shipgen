import React from "react";
import { Warehouse, Truck, Calendar, Clock, ListOrdered } from "lucide-react";
import StatusPill from "./StatusPill";
import { buildAssignmentContext } from "../../utils/assignmentContext";

/**
 * Unified current-assignment block (Dock · Vehicle · Queue · Appointment · Since · Status).
 */
export const CurrentAssignmentPanel = ({ source, refs = {}, testId }) => {
  const ctx = buildAssignmentContext(source, refs);

  return (
    <div data-testid={testId}>
      <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-2">
        Current Assignment
      </div>
      <div className="bg-indigo-50/50 border border-indigo-100 rounded-md p-3 text-[12px] space-y-1.5">
        {ctx.hasAssignment ? (
          <>
            {ctx.dockId && (
              <div className="text-indigo-800 flex items-center gap-1">
                <Warehouse className="w-3.5 h-3.5 shrink-0" /> Dock: {ctx.dockLabel}
              </div>
            )}
            {ctx.vehicleId && (
              <div className="text-indigo-800 flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 shrink-0" /> Vehicle: {ctx.vehicleLabel}
              </div>
            )}
            {ctx.queueEntryId && (
              <div className="text-slate-600 flex items-center gap-1">
                <ListOrdered className="w-3.5 h-3.5 shrink-0" /> Queue: {ctx.queueLabel}
              </div>
            )}
            {ctx.appointmentId && (
              <div className="text-slate-600 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 shrink-0" /> Appointment: {ctx.appointmentLabel}
              </div>
            )}
            <div className="text-slate-600 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 shrink-0" /> Assigned since: {ctx.assignedSinceLabel}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[10px] uppercase font-semibold text-slate-500">Status</span>
              <StatusPill status={ctx.status} />
            </div>
          </>
        ) : (
          <div className="text-slate-500">No active assignment</div>
        )}
      </div>
    </div>
  );
};

export default CurrentAssignmentPanel;
