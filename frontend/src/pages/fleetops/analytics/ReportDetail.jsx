import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { fleetopsService } from "@/services/fleetops";

export default function ReportDetail() {
  const { id } = useParams();
  const [report, setReport] = useState(null);

  useEffect(() => {
    fleetopsService.getReport(id).then(setReport).catch(() => setReport(null));
  }, [id]);

  return (
    <div data-testid="report-detail-page">
      <PageHeader
        overline="Analytics"
        title={report?.name || "Report"}
        description={report?.description || "Configure and run this analytics report."}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to={`/fleet-ops/analytics/reports/${id}/edit`} data-testid="report-edit-link">
                Edit definition
              </Link>
            </Button>
            <Button asChild className="bg-[#0066FF]">
              <Link to={`/fleet-ops/analytics/reports/${id}/result`} data-testid="report-result-link">
                Run & view results
              </Link>
            </Button>
          </div>
        }
      />
    </div>
  );
}
