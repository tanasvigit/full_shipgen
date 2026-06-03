import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import DataTable from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Download } from "lucide-react";
import { fleetopsService } from "@/services/fleetops";
import { toast } from "sonner";
import { useFleetopsPermission } from "@/hooks/fleetops/useFleetopsPermission";

export default function ServiceRatesList() {
  const { can } = useFleetopsPermission();
  const canExport = can("export", "service-rate") || can("view", "service-rate");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await fleetopsService.listServiceRates());
    } catch (err) {
      toast.error(err?.friendlyMessage || "Failed to load service rates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const types = [...new Set(rows.map((r) => r.service_type || r.serviceType).filter(Boolean))];
  const filtered =
    typeFilter === "all" ? rows : rows.filter((r) => (r.service_type || r.serviceType) === typeFilter);

  const handleExport = async () => {
    try {
      const blob = await fleetopsService.exportServiceRates();
      fleetopsService.downloadExportBlob(blob, "service-rates.csv");
      toast.success("Export downloaded");
    } catch (err) {
      toast.error(err?.friendlyMessage || "Export failed");
    }
  };

  const columns = [
    {
      key: "name",
      header: "Name",
      render: (row) => (
        <Link className="text-[#0066FF]" to={`/fleet-ops/operations/service-rates/${row.uuid || row.id}`}>
          {row.name || row.public_id || row.id}
        </Link>
      ),
    },
    { key: "service_type", header: "Type", render: (row) => row.service_type || row.serviceType || "—" },
    { key: "base_fee", header: "Base fee", render: (row) => row.base_fee ?? row.baseFee ?? row.amount ?? "—" },
    { key: "per_mile", header: "Per mile", render: (row) => row.per_mile ?? row.perMile ?? "—" },
  ];

  return (
    <div data-testid="service-rates-list-page">
      <PageHeader
        breadcrumbs={[{ label: "FleetOps", to: "/fleet-ops" }, { label: "Service rates" }]}
        title="Service rates"
        actions={
          <div className="flex gap-2">
            {canExport && (
              <Button variant="outline" onClick={handleExport} data-testid="service-rates-export">
                <Download className="h-4 w-4 mr-1" /> Export
              </Button>
            )}
            <Button asChild className="bg-blue-600 h-9">
              <Link to="/fleet-ops/operations/service-rates/new">
                <Plus className="h-4 w-4 mr-1" /> New rate
              </Link>
            </Button>
          </div>
        }
      />
      <div className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]" data-testid="service-rates-type-filter">
              <SelectValue placeholder="Service type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {types.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DataTable columns={columns} data={filtered} loading={loading} testid="service-rates-table" searchKeys={["name", "service_type"]} />
      </div>
    </div>
  );
}
