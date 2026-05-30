import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DataTable from "@/components/common/DataTable";
import { fleetopsService } from "@/services/fleetops";

export default function ReportDetail() {
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

  const rows = Array.isArray(result?.rows) ? result.rows : Array.isArray(result?.data) ? result.data : [];
  const normalized = rows.map((row, idx) => ({ id: idx, ...(row || {}) }));
  const keys = Object.keys(normalized[0] || {}).filter((key) => key !== "id");

  return (
    <div data-testid="report-detail-page">
      <PageHeader
        overline="Analytics report"
        title={report?.name || "Report result"}
        description={report?.description || "Run, filter, and inspect report output."}
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
