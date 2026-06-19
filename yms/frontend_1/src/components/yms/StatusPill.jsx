import React from "react";
import { lifecycleDisplayLabel } from "../../constants/lifecycleStatuses";

const MAP = {
  // Vehicle statuses
  DRAFT: { bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-300", label: "Draft" },
  SCHEDULED: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", label: "Scheduled" },
  EN_ROUTE: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", label: "En Route" },
  APPROACHING: { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200", label: "Approaching" },
  CHECKED_IN: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", label: "Checked In" },
  WAITING: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", label: "Waiting" },
  READY_TO_CALL: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", label: "Ready to Call" },
  CALLED: { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200", label: "Staging" },
  EXIT_HOLDING: { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200", label: "Exit Holding" },
  EXIT_VERIFIED: { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200", label: "Exit Verified" },
  REPORTING_TO_DOCK: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", label: "Staging" },
  STAGING: { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200", label: "Staging" },
  DOCK_ASSIGNED: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", label: "Dock Assigned" },
  RESOURCE_PENDING: { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200", label: "Resource Pending" },
  READY_FOR_LOADING: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", label: "Ready for Loading" },
  LOADING: { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200", label: "Loading" },
  UNLOADING: { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200", label: "Unloading" },
  EXITED: { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200", label: "Exited" },
  // Dock
  AVAILABLE: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", label: "Available" },
  OCCUPIED: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", label: "Occupied" },
  DELAYED: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", label: "Delayed" },
  MAINTENANCE: { bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-300", label: "Maintenance" },
  // Equipment / Labor
  IN_USE: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", label: "In Use" },
  IDLE: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", label: "Idle" },
  ASSIGNED: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", label: "Assigned" },
  CHARGING: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", label: "Charging" },
  OUT_OF_SERVICE: { bg: "bg-slate-200", text: "text-slate-700", border: "border-slate-300", label: "Out of Service" },
  ON_DUTY: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", label: "On Duty" },
  OFF_DUTY: { bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-300", label: "Off Duty" },
  BREAK: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", label: "Break" },
  UNAVAILABLE: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", label: "Unavailable" },
  FULL: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", label: "Full" },
  BLOCKED: { bg: "bg-red-100", text: "text-red-800", border: "border-red-300", label: "Blocked" },
  BUSY: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", label: "Busy" },
  ACTIVE: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", label: "Active" },
  WARNING: { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200", label: "Warning" },
  NORMAL: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", label: "Normal" },
  // Appointment
  ARRIVED: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", label: "Arrived" },
  IN_PROGRESS: { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200", label: "In Progress" },
  COMPLETED: { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200", label: "Completed" },
  // Detention
  Approved: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", label: "Approved" },
  Disputed: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", label: "Disputed" },
  Pending: { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200", label: "Pending" },
  Paid: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", label: "Paid" },
  Reviewed: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", label: "Reviewed" },
  // Categories
  Company: { bg: "bg-slate-900", text: "text-white", border: "border-slate-900", label: "Company" },
  Contract: { bg: "bg-blue-600", text: "text-white", border: "border-blue-600", label: "Contract" },
  Outside: { bg: "bg-amber-500", text: "text-white", border: "border-amber-500", label: "Outside" },
};

export const StatusPill = ({ status, className = "", testId }) => {
  const s = MAP[status] || {
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
    label: lifecycleDisplayLabel(status) || status,
  };
  return (
    <span
      data-testid={testId || `status-${String(status).toLowerCase().replace(/_/g, "-")}`}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm border text-[11px] font-semibold tracking-wide uppercase ${s.bg} ${s.text} ${s.border} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {s.label}
    </span>
  );
};

export default StatusPill;
