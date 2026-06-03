import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fleetopsService } from "@/services/fleetops";
import { toast } from "sonner";

export default function ReportBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === "new";
  const isEdit = window.location.pathname.includes("/edit");
  const reportId = isNew ? null : id;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [queryJson, setQueryJson] = useState('{"metrics":["active_orders","active_drivers"]}');
  const [columns, setColumns] = useState("metric,value");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    if (isNew) {
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      const row = await fleetopsService.getReport(reportId).catch(() => null);
      if (row) {
        setName(row.name || "");
        setDescription(row.description || "");
        setQueryJson(JSON.stringify(row.query || {}, null, 2));
        setColumns((row.columns || ["metric", "value"]).join(","));
      }
      setLoading(false);
    })();
  }, [isNew, reportId]);

  const save = async () => {
    setBusy(true);
    try {
      let query = {};
      try {
        query = JSON.parse(queryJson);
      } catch {
        toast.error("Query must be valid JSON");
        return;
      }
      const values = {
        name,
        description,
        query,
        columns: columns.split(",").map((c) => c.trim()).filter(Boolean),
        status: "ready",
      };
      if (isNew) {
        const row = await fleetopsService.createReport(values);
        toast.success("Report created");
        navigate(`/fleet-ops/analytics/reports/${row.uuid || row.id}`);
      } else {
        await fleetopsService.updateReport(reportId, values);
        toast.success("Report saved");
      }
    } catch (err) {
      toast.error(err?.friendlyMessage || "Save failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div data-testid="report-builder-page">
      <PageHeader
        title={isNew ? "New report" : isEdit ? "Edit report" : "Report builder"}
        breadcrumbs={[
          { label: "FleetOps", to: "/fleet-ops" },
          { label: "Reports", to: "/fleet-ops/analytics/reports" },
        ]}
        actions={
          !isNew && (
            <Button variant="outline" onClick={() => navigate(`/fleet-ops/analytics/reports/${reportId}/result`)} data-testid="report-builder-run">
              Run report
            </Button>
          )
        }
      />
      <div className="p-6 max-w-2xl space-y-4">
        {loading ? <p className="text-sm text-[#4B5563]">Loading…</p> : null}
        <div>
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} data-testid="report-builder-name" />
        </div>
        <div>
          <Label>Description</Label>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div>
          <Label>Query definition (JSON)</Label>
          <Textarea rows={6} value={queryJson} onChange={(e) => setQueryJson(e.target.value)} data-testid="report-builder-query" />
        </div>
        <div>
          <Label>Columns (comma-separated)</Label>
          <Input value={columns} onChange={(e) => setColumns(e.target.value)} />
        </div>
        <Button disabled={busy || loading} onClick={save} data-testid="report-builder-save">
          Save
        </Button>
      </div>
    </div>
  );
}
