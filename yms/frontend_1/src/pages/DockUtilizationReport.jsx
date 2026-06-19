import React from "react";
import OperationalReportPage from "./OperationalReportPage";
import reportsApi from "../services/reportsApi";

const COLUMNS = ["Dock", "Zone", "Vehicles", "Occupied (min)", "Idle (min)", "Util %", "Avg Service", "Avg Delay"];
const KEYS = ["dockCode", "zone", "vehiclesHandled", "occupiedMinutes", "idleMinutes", "utilizationPct", "avgServiceMinutes", "avgDelayMinutes"];

const DockUtilizationReport = () => (
  <OperationalReportPage
    title="Dock Utilization"
    subtitle="Occupancy, idle time, and service performance by dock"
    fetchFn={reportsApi.fetchDockUtilizationReport}
    exportPath="/reports/dock-utilization/export"
    columns={COLUMNS}
    keys={KEYS}
    extraFilters={(state, setState) => (
      <>
        <input
          className="border border-slate-300 rounded-md px-2 py-1.5 text-[12px]"
          placeholder="Zone filter"
          value={state.zone || ""}
          onChange={(e) => setState({ ...state, zone: e.target.value })}
        />
      </>
    )}
  />
);

export default DockUtilizationReport;
