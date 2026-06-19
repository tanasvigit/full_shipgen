import React from "react";
import OperationalReportPage from "./OperationalReportPage";
import reportsApi from "../services/reportsApi";

const COLUMNS = ["Category", "Count", "Avg Delay (min)", "Worst (min)", "Affected Vehicles"];
const KEYS = ["category", "count", "avgDelayMinutes", "worstDelayMinutes", "affectedVehicles"];

const DelayAnalysisReport = () => (
  <OperationalReportPage
    title="Delay Analysis"
    subtitle="Waiting, loading, exit, turnaround, and exception delays"
    fetchFn={reportsApi.fetchDelayAnalysisReport}
    exportPath="/reports/delay-analysis/export"
    columns={COLUMNS}
    keys={KEYS}
  />
);

export default DelayAnalysisReport;
