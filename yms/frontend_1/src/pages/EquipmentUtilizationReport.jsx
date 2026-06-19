import React from "react";
import OperationalReportPage from "./OperationalReportPage";
import reportsApi from "../services/reportsApi";

const COLUMNS = ["Code", "Name", "Assignments", "Usage (min)", "Idle (min)", "Loading (min)", "Util %"];
const KEYS = ["equipmentCode", "equipmentName", "assignments", "usageMinutes", "idleMinutes", "loadingMinutes", "utilizationPct"];

const EquipmentUtilizationReport = () => (
  <OperationalReportPage
    title="Equipment Utilization"
    subtitle="Assignment volume and usage hours"
    fetchFn={reportsApi.fetchEquipmentUtilizationReport}
    exportPath="/reports/equipment-utilization/export"
    columns={COLUMNS}
    keys={KEYS}
  />
);

export default EquipmentUtilizationReport;
