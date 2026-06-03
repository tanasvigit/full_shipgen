import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DataTable from "@/components/common/DataTable";
import { fleetopsService } from "@/services/fleetops";
import { Download } from "lucide-react";
import { toast } from "sonner";

export default function ReportResult() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [result, setResult] = useState(null);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [details, run] = await Promise.all([
      fleetopsService.getReport(id).catch(() => null),
      fleetopsService.runReport(id, filter ? { q: filter } : {}).catch(() => ({})),
    ]);
    setReport(details);
    setResult(run);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, [id]);

  const handleExport = async () => {
    try {
      const blob = await fleetopsService.exportReport(id, filter ? { q: filter } : {});
      fleetopsService.downloadExportBlob(blob, `${report?.name || "report"}.csv`);
      toast.success("Export downloaded");
    } catch (err) {
      toast.error(err?.friendlyMessage || "Export failed");
    }
  };

  const rows = Array.isArray(result?.rows) ? result.rows : Array.isArray(result?.data) ? result.data : [];
  const normalized = rows.map((row, idx) => ({ id: idx, ...(row || {}) }));
  const keys = report?.columns?.length
    ? report.columns
    : Object.keys(normalized[0] || {}).filter((key) => key !== "id");

  return (
    <div data-testid="report-result-page">
      <PageHeader
        overline="Analytics"
        title={report?.name ? `${report.name} — results` : "Report results"}
        description={report?.description}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport} data-testid="report-result-export">
              <Download className="h-4 w-4 mr-1" /> Export CSV
            </Button>
            <Button variant="outline" asChild>
              <Link to={`/fleet-ops/analytics/reports/${id}/edit`}>Edit</Link>
            </Button>
          </div>
        }
      />
      <div className="p-6 space-y-4">
        <div className="flex gap-2">
          <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter query" data-testid="report-filter-input" />
          <Button onClick={() => void load()} disabled={loading} data-testid="report-run-button">
            Run
          </Button>
        </div>
        {normalized.length === 0 ? (
          <div className="rounded-md border border-black/[0.08] p-6 text-sm text-[#4B5563]" data-testid="report-empty-state">
            No rows returned for this report.
          </div>
        ) : (
          <DataTable
            testid="report-results-table"
            data={normalized}
            loading={loading}
            searchKeys={keys}
            columns={keys.map((key) => ({ key, header: key, render: (row) => String(row[key] ?? "—") }))}
          />
        )}
      </div>
    </div>
  );
}
