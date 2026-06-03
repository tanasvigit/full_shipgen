import { registerDashboardWidget } from "@/domain/fleetops/extensions/dashboardRegistry";
import IamMetricsWidget from "@/components/iam/dashboard/IamMetricsWidget";

/** Register IAM dashboard extensions (Ember widget id: iam-metrics-widget). */
export function registerIamDashboardWidgets() {
  registerDashboardWidget({
    key: "iam-metrics-widget",
    order: 20,
    render: () => <IamMetricsWidget />,
  });
}
