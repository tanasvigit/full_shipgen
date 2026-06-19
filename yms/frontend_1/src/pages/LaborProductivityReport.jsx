import React from "react";
import OperationalReportPage from "./OperationalReportPage";
import reportsApi from "../services/reportsApi";

const COLUMNS = ["Team", "Name", "Assignments", "Vehicles", "Loading (min)", "Paused (min)", "Exceptions", "Util %"];
const KEYS = ["teamCode", "teamName", "assignments", "vehiclesServed", "loadingMinutes", "pausedMinutes", "exceptionsHandled", "utilizationPct"];

const LaborProductivityReport = () => (
  <OperationalReportPage
    title="Labor Productivity"
    subtitle="Team assignments, loading hours, and utilization"
    fetchFn={reportsApi.fetchLaborProductivityReport}
    exportPath="/reports/labor-productivity/export"
    columns={COLUMNS}
    keys={KEYS}
  />
);

export default LaborProductivityReport;
