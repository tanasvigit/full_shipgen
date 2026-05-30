import { useCallback, useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import DataTable from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fleetopsService } from "@/services/fleetops";
import { assignmentsForCommit } from "@/lib/fleetops/routing";
import { pickAllocationEngine } from "@/lib/fleetops/allocation";
import { useFleetopsAbility } from "@/hooks/fleetops/useFleetopsAbility";
import OrchestratorImportModal from "@/components/fleetops/orchestrator/OrchestratorImportModal";
import { toast } from "sonner";
import { Upload, Play, CheckCircle2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const MODES = [
  { id: "assign_drivers", label: "Assign drivers" },
  { id: "assign_vehicles", label: "Assign vehicles" },
  { id: "optimize_routes", label: "Optimize routes" },
  { id: "allocate", label: "Allocate (VRP)" },
];

export default function Orchestrator() {
  const ability = useFleetopsAbility();
  const [orders, setOrders] = useState([]);
  const [engines, setEngines] = useState([]);
  const [configFields, setConfigFields] = useState([]);
  const [mode, setMode] = useState("assign_drivers");
  const [engine, setEngine] = useState("greedy");
  const [preview, setPreview] = useState(null);
  const [selectedKeys, setSelectedKeys] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [commitOpen, setCommitOpen] = useState(false);

  const canRun = ability.canDispatchOrder || ability.canUpdateOrder || ability.isDispatcher;

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [orderRows, engineList, fields] = await Promise.all([
        fleetopsService.listOrchestratorOrders({ unassigned: true }).catch(() => []),
        fleetopsService.getOrchestratorEngines().catch(() => []),
        fleetopsService.getOrchestratorOrderConfigFields().catch(() => []),
      ]);
      setOrders(orderRows);
      setEngines(engineList);
      setEngine(pickAllocationEngine(engineList, "greedy"));
      setConfigFields(Array.isArray(fields) ? fields : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const selectedIds = useMemo(() => [...selectedKeys], [selectedKeys]);

  const orderColumns = [
    {
      key: "public_id",
      header: "Order",
      render: (row) => <span className="font-mono text-xs text-[#0066FF]">{row.public_id || row.id}</span>,
    },
    { key: "status", header: "Status", render: (row) => row.status || "—" },
    {
      key: "customer",
      header: "Customer",
      render: (row) => row.customer?.name || "—",
    },
    {
      key: "driver",
      header: "Driver",
      render: (row) => row.driver_assigned?.name || row.driver?.name || "—",
    },
  ];

  const assignmentRows = preview?.assignments || [];

  const runPreview = async () => {
    if (!canRun) {
      toast.error("No permission to run orchestrator");
      return;
    }
    setBusy(true);
    try {
      const body = {
        mode,
        order_ids: selectedIds.length ? selectedIds : undefined,
        options: { engine },
      };
      const data = await fleetopsService.runOrchestratorPreview(body);
      setPreview(data);
      toast.success("Preview ready");
    } catch (err) {
      toast.error(err?.friendlyMessage || err?.message || "Orchestrator preview failed");
    } finally {
      setBusy(false);
    }
  };

  const runCommit = async () => {
    if (!preview?.assignments?.length) {
      toast.error("Run preview first");
      return;
    }
    setBusy(true);
    try {
      await fleetopsService.runOrchestratorCommit(assignmentsForCommit(preview.assignments));
      toast.success("Orchestrator plan committed");
      setPreview(null);
      setSelectedKeys(new Set());
      await reload();
    } catch (err) {
      toast.error(err?.friendlyMessage || "Commit failed");
    } finally {
      setBusy(false);
      setCommitOpen(false);
    }
  };

  return (
    <div data-testid="orchestrator-page">
      <PageHeader
        breadcrumbs={[{ label: "FleetOps", to: "/fleet-ops" }, { label: "Orchestrator" }]}
        title="Orchestrator"
        description={`${orders.length} orders in pool · ${engines.length} engines`}
        actions={
          canRun && (
            <>
              <Button variant="outline" size="sm" className="h-9" onClick={() => setImportOpen(true)} data-testid="orchestrator-import">
                <Upload className="h-4 w-4 mr-1" /> Import
              </Button>
              <Button variant="outline" size="sm" className="h-9" disabled={busy} onClick={runPreview} data-testid="orchestrator-preview">
                <Play className="h-4 w-4 mr-1" /> Preview
              </Button>
              <Button size="sm" className="h-9 bg-[#0066FF]" disabled={busy || !preview?.assignments?.length} onClick={() => setCommitOpen(true)} data-testid="orchestrator-commit">
                <CheckCircle2 className="h-4 w-4 mr-1" /> Commit
              </Button>
            </>
          )
        }
      />
      <div className="p-6 space-y-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="space-y-1">
            <Label className="text-xs">Mode</Label>
            <Select value={mode} onValueChange={setMode}>
              <SelectTrigger className="w-[180px]" data-testid="orchestrator-mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODES.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Engine</Label>
            <Select value={engine} onValueChange={setEngine}>
              <SelectTrigger className="w-[180px]" data-testid="orchestrator-engine">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(engines.length ? engines : [{ id: "greedy" }, { id: "vroom" }]).map((e) => {
                  const id = typeof e === "string" ? e : e.id || e.identifier || e.name;
                  return (
                    <SelectItem key={id} value={String(id).toLowerCase()}>
                      {typeof e === "string" ? e : e.name || id}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        {configFields.length > 0 && (
          <div className="text-xs text-[#6B7280]" data-testid="orchestrator-config-fields">
            {configFields.length} order config(s) with custom fields loaded for card display.
          </div>
        )}

        <DataTable
          testid="orchestrator-orders-table"
          columns={orderColumns}
          data={orders}
          loading={loading}
          selectable
          selectedKeys={selectedKeys}
          onSelectedKeysChange={setSelectedKeys}
          rowKey="public_id"
          pageSize={15}
        />

        {assignmentRows.length > 0 && (
          <div className="bg-white border border-black/[0.08] rounded-md p-4" data-testid="orchestrator-preview-panel">
            <div className="overline mb-3">Proposed assignments ({assignmentRows.length})</div>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {assignmentRows.map((a, i) => (
                <div key={a.order_id || i} className="border border-black/[0.06] rounded-md p-3 text-sm">
                  <div className="font-mono text-xs text-[#0066FF]">{a.order_id}</div>
                  <div className="text-[#374151] mt-1">
                    Driver: {a.driver_id || "—"} · Vehicle: {a.vehicle_id || "—"}
                  </div>
                  <div className="text-[10px] font-mono text-[#6B7280] mt-1">
                    Seq {a.sequence ?? i + 1} · {a.distance ?? 0}m · {a.duration ?? 0}s
                  </div>
                </div>
              ))}
            </div>
            {preview?.unassigned?.length > 0 && (
              <p className="text-xs text-amber-700 mt-3">Unassigned: {preview.unassigned.join(", ")}</p>
            )}
          </div>
        )}
      </div>

      <OrchestratorImportModal open={importOpen} onOpenChange={setImportOpen} onImported={reload} />

      <AlertDialog open={commitOpen} onOpenChange={setCommitOpen}>
        <AlertDialogContent data-testid="orchestrator-commit-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Commit orchestrator plan?</AlertDialogTitle>
            <AlertDialogDescription>
              This creates manifests and assigns {assignmentRows.length} order(s). Dispatch is not triggered automatically.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-[#0066FF]" onClick={(e) => { e.preventDefault(); runCommit(); }}>
              Commit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
