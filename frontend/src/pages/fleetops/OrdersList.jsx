import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFleetopsDetailDrawer } from "@/hooks/fleetops/useFleetopsDetailDrawer";
import { useOrderStatuses } from "@/hooks/fleetops/useOrderStatuses";
import { useFleetopsAbility } from "@/hooks/fleetops/useFleetopsAbility";
import { useOperationalIntelligence } from "@/hooks/fleetops/useOperationalIntelligence";
import { useOrdersListShortcuts } from "@/hooks/fleetops/useOrdersListShortcuts";
import { useOrdersListPage } from "@/hooks/fleetops/useOrdersListPage";
import { mapDriverRow, mapOrder, statusLabel } from "@/lib/mappers";
import { useFleetopsRealtimeChannel } from "@/hooks/fleetops/useFleetopsRealtimeChannel";
import { resolveCompanyChannelId } from "@/domain/fleetops/realtime/socketConfig";
import { orderRiskLevel } from "@/domain/fleetops/intelligence/evaluateDeliveryRisks";
import PageHeader from "@/components/common/PageHeader";
import DataTable from "@/components/common/DataTable";
import StatusBadge from "@/components/common/StatusBadge";
import MapView from "@/components/common/MapView";
import OrderCreateDialog from "@/components/fleetops/orders/OrderCreateDialog";
import OrderImportDialog from "@/components/fleetops/orders/OrderImportDialog";
import OrdersBulkToolbar from "@/components/fleetops/orders/bulk/OrdersBulkToolbar";
import OperationalMetricsStrip from "@/components/fleetops/intelligence/OperationalMetricsStrip";
import RiskAlertsBar from "@/components/fleetops/intelligence/RiskAlertsBar";
import DispatcherSuggestionsPanel from "@/components/fleetops/intelligence/DispatcherSuggestionsPanel";
import { Button } from "@/components/ui/button";
import { Plus, LayoutList, Map as MapIcon, Columns3, Filter, RefreshCw, Upload, Download, AlertTriangle, Route, Columns2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { fleetopsService } from "@/services/fleetops";
import { parseFleetopsApiError } from "@/lib/fleetops/parseApiErrors";
import { useDemoMode } from "@/contexts/DemoModeContext";

const OrderKanban = lazy(() => import("@/components/fleetops/orders/OrderKanban"));

const VIEWS = [
  { id: "table", label: "Table", icon: LayoutList },
  { id: "kanban", label: "Kanban", icon: Columns3 },
  { id: "map", label: "Map", icon: MapIcon },
];

const ALL_COLUMNS = [
  { key: "risk", label: "" },
  { key: "publicId", label: "Order ID" },
  { key: "customer.name", label: "Customer" },
  { key: "route", label: "Route" },
  { key: "status", label: "Status" },
  { key: "priority", label: "Priority" },
  { key: "scheduled_at", label: "Scheduled" },
  { key: "driverId", label: "Driver" },
  { key: "eta", label: "ETA" },
  { key: "total", label: "Total" },
];

export default function OrdersList() {
  const navigate = useNavigate();
  const [suggestionsCollapsed, setSuggestionsCollapsed] = useState(false);
  const [mapFocusId, setMapFocusId] = useState(null);
  const searchInputRef = useRef(null);
  const prevDangerRef = useRef(0);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState(() => new Set());
  const [hiddenColumns, setHiddenColumns] = useState(() => new Set());
  const { openDetail: openOrderDetail } = useFleetopsDetailDrawer("order");
  const { openDetail: openDriverDetail } = useFleetopsDetailDrawer("driver");
  const { statuses } = useOrderStatuses();
  const ability = useFleetopsAbility();
  const { isDemoMode, demoOrders, demoDrivers } = useDemoMode();
  const [drivers, setDrivers] = useState([]);

  const { queryState, patchQuery, orders, loading, reload, refreshBackground } = useOrdersListPage({
    isDemoMode,
    demoOrders,
  });

  const companyChannel = resolveCompanyChannelId();

  useEffect(() => {
    if (isDemoMode) {
      setDrivers(demoDrivers);
      return;
    }
    fleetopsService.listDrivers().then((rows) => setDrivers((rows || []).map(mapDriverRow))).catch(() => {});
  }, [isDemoMode, demoDrivers]);

  useFleetopsRealtimeChannel(
    companyChannel,
    () => {
      refreshBackground();
    },
    { enabled: Boolean(companyChannel), debounceMs: 800 },
  );

  const view = queryState.layout;
  const statusFilter = queryState.status;
  const setView = (layout) => patchQuery({ layout, page: 1 });
  const setStatusFilter = (status) => patchQuery({ status, page: 1 });

  const filtered = orders;

  const selectedIds = useMemo(() => [...selectedKeys], [selectedKeys]);

  const runBulk = async (fn) => {
    if (!selectedIds.length) return;
    setBulkBusy(true);
    try {
      const result = await fn(selectedIds);
      const ok = result?.successful?.length ?? selectedIds.length;
      toast.success(`Updated ${ok} order(s)`);
      setSelectedKeys(new Set());
      await reload();
    } catch (err) {
      toast.error(parseFleetopsApiError(err));
    } finally {
      setBulkBusy(false);
    }
  };

  const handleExport = async () => {
    setBulkBusy(true);
    try {
      const blob = await fleetopsService.exportOrders();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `orders-export-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export started");
    } catch (err) {
      toast.error(parseFleetopsApiError(err));
    } finally {
      setBulkBusy(false);
    }
  };

  const { metrics, risks, suggestions, riskByOrderId } = useOperationalIntelligence(orders, drivers);

  useEffect(() => {
    if (risks.dangerCount > prevDangerRef.current && prevDangerRef.current > 0) {
      toast.warning(`${risks.dangerCount} orders need immediate attention`, { duration: 5000 });
    }
    prevDangerRef.current = risks.dangerCount;
  }, [risks.dangerCount]);

  useOrdersListShortcuts({
    onNew: () => setCreateOpen(true),
    onRefresh: () => reload(),
    onViewChange: setView,
    searchInputRef,
    enabled: true,
  });

  const filterChips = ["all", ...statuses];

  const columnDefs = {
    risk: {
      key: "risk",
      header: "",
      className: "w-8",
      render: (row) => {
        const level = orderRiskLevel(riskByOrderId.get(row.id) || []);
        if (!level) return null;
        return (
          <span title="Operational risk" data-testid={`order-risk-${row.id}`}>
            <AlertTriangle className={`h-4 w-4 ${level === "danger" ? "text-red-600" : "text-amber-600"}`} />
          </span>
        );
      },
    },
    publicId: { key: "publicId", header: "Order ID", sortable: true, render: (row) => <span className="font-mono text-xs text-[#0066FF]">{row.publicId}</span> },
    "customer.name": { key: "customer.name", header: "Customer", sortable: true, render: (row) => <span className="font-medium text-[#0A0E1A]">{row.customer.name}</span> },
    route: { key: "route", header: "Route", render: (row) => <span className="text-xs text-[#374151] font-mono">{row.pickup.name} → {row.dropoff.name}</span> },
    status: { key: "status", header: "Status", sortable: true, render: (row) => <StatusBadge status={row.status} label={statusLabel(row.status)} /> },
    priority: { key: "priority", header: "Priority", sortable: true, render: (row) => <StatusBadge status={row.priority} label={row.priority} dot={false} /> },
    scheduled_at: { key: "scheduled_at", header: "Scheduled", render: (row) => <span className="text-xs font-mono">{row.scheduledAt || "—"}</span> },
    driverId: { key: "driverId", header: "Driver", render: (row) => <span className="text-xs">{row.driverId ? String(row.driverId).slice(0, 8) : "—"}</span> },
    eta: { key: "eta", header: "ETA", render: (row) => <span className="font-mono text-xs text-[#1F2937]">{row.eta}</span> },
    total: { key: "total", header: "Total", sortable: true, render: (row) => <span className="font-mono tabular text-right">${Number(row.total || 0).toFixed(2)}</span>, className: "text-right" },
  };

  const columns = ALL_COLUMNS.filter((c) => !hiddenColumns.has(c.key)).map((c) => columnDefs[c.key]);

  const mapMarkers = useMemo(
    () => [
      ...filtered
        .filter((order) => order.dropoff?.lat && order.dropoff?.lng)
        .map((order) => ({
          id: order.id,
          lat: order.dropoff.lat,
          lng: order.dropoff.lng,
          label: order.publicId,
          color: orderRiskLevel(riskByOrderId.get(order.id) || []) === "danger" ? "#DC2626" : "#0066FF",
          popup: `${order.customer.name} · ${statusLabel(order.status)}`,
          entityKey: "order",
        })),
      ...drivers
        .filter((d) => d.location?.lat && d.location?.lng)
        .map((d) => ({
          id: `driver-${d.id}`,
          lat: d.location.lat,
          lng: d.location.lng,
          label: d.name?.slice(0, 2)?.toUpperCase(),
          color: "#059669",
          live: ["online", "active", "on_duty"].includes(String(d.status).toLowerCase()),
          popup: `Driver · ${d.name} · ${d.status}`,
          entityKey: "driver",
        })),
    ],
    [filtered, drivers, riskByOrderId],
  );

  return (
    <div data-testid="orders-list-page">
      <PageHeader
        breadcrumbs={[{ label: "FleetOps", to: "/fleet-ops" }, { label: "Operations" }, { label: "Orders" }]}
        overline="Operations"
        title="Orders"
        description={loading ? "Loading orders..." : `${filtered.length} orders · ${statusFilter === "all" ? "all statuses" : statusLabel(statusFilter)}`}
        actions={
          <>
            <div className="flex bg-white border border-black/[0.08] rounded-sm p-0.5">
              {VIEWS.map((item) => {
                const Icon = item.icon;
                const active = view === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setView(item.id)}
                    data-testid={`orders-view-${item.id}`}
                    className={`flex items-center gap-1.5 px-3 h-8 text-xs font-medium rounded-sm ${active ? "bg-[#EEF0F4] text-[#0A0E1A]" : "text-[#374151] hover:text-[#0A0E1A]"}`}
                  >
                    <Icon className="h-3.5 w-3.5" strokeWidth={1.75} /> {item.label}
                  </button>
                );
              })}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 bg-transparent border-black/[0.08]"
              disabled={loading || bulkBusy}
              onClick={() => reload()}
              data-testid="orders-refresh"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
            </Button>
            {ability.canExportOrder && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 bg-transparent border-black/[0.08]"
                disabled={bulkBusy}
                onClick={handleExport}
                data-testid="orders-export-button"
              >
                <Download className="h-4 w-4 mr-1" /> Export
              </Button>
            )}
            {ability.canImportOrder && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 bg-transparent border-black/[0.08]"
                disabled={bulkBusy}
                onClick={() => setImportOpen(true)}
                data-testid="orders-import-button"
              >
                <Upload className="h-4 w-4 mr-1" /> Import
              </Button>
            )}
            {ability.canCreateOrder && (
              <Button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 rounded-sm h-9"
                data-testid="orders-new-button"
              >
                <Plus className="h-4 w-4 mr-1" /> New order
              </Button>
            )}
          </>
        }
      />
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-2 flex-wrap" data-testid="orders-filters">
          <Filter className="h-3.5 w-3.5 text-[#4B5563]" />
          {filterChips.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-2.5 h-7 text-[11px] font-mono uppercase tracking-wider rounded-sm border ${statusFilter === status ? "bg-blue-600/10 border-blue-500/40 text-[#0066FF]" : "bg-white border-black/[0.08] text-[#374151] hover:bg-[#F1F2F5]"}`}
            >
              {status === "all" ? "All" : statusLabel(status)}
            </button>
          ))}
          <label className="flex items-center gap-2 ml-2 text-xs text-[#374151] cursor-pointer">
            <Checkbox
              checked={queryState.without_driver}
              onCheckedChange={(v) => patchQuery({ without_driver: Boolean(v), page: 1 })}
              data-testid="orders-filter-without-driver"
            />
            No driver
          </label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => {
              const next = new Set(hiddenColumns);
              if (next.size) next.clear();
              else next.add("scheduled_at");
              setHiddenColumns(next);
            }}
          >
            <Columns2 className="h-3.5 w-3.5 mr-1" /> Columns
          </Button>
        </div>

        <OrdersBulkToolbar
          selectedCount={selectedIds.length}
          onClearSelection={() => setSelectedKeys(new Set())}
          busy={bulkBusy}
          canDispatch={ability.canBulkManage && ability.canDispatchOrder}
          canCancel={ability.canBulkManage && ability.canCancelOrder}
          canDelete={ability.canBulkManage && ability.canDeleteOrder}
          canAssign={ability.canBulkManage && ability.canAssignDriver}
          canPlanRoutes={selectedIds.length > 0}
          onPlanRoutes={() =>
            navigate(`/fleet-ops/operations/routes/new?order_ids=${encodeURIComponent(selectedIds.join(","))}`)
          }
          onBulkDispatch={() => runBulk((ids) => fleetopsService.bulkDispatch(ids))}
          onBulkCancel={() => runBulk((ids) => fleetopsService.bulkCancel(ids))}
          onBulkDelete={() => runBulk((ids) => fleetopsService.bulkDeleteOrders(ids))}
          onBulkAssign={(driverId) => runBulk((ids) => fleetopsService.bulkAssignDriver(ids, driverId))}
        />

        {view === "table" && (
          <DataTable
            testid="orders-table"
            columns={columns}
            data={filtered}
            loading={loading}
            loadingMessage="Fetching orders…"
            searchKeys={[
              "publicId",
              "internalId",
              "trackingNumber",
              "customer.name",
              "pickup.name",
              "dropoff.name",
              "notes",
            ]}
            searchInputRef={searchInputRef}
            pageSize={10}
            selectable
            selectedKeys={selectedKeys}
            onSelectedKeysChange={setSelectedKeys}
            onRowClick={(row) => openOrderDetail(row.id)}
          />
        )}

        {view === "kanban" && (
          <Suspense fallback={<div className="h-64 rounded-xl bg-white border animate-pulse" data-testid="orders-kanban-loading" />}>
            <OrderKanban
              orders={filtered}
              statuses={statuses}
              onOpenDetail={openOrderDetail}
              onOrdersChange={() => reload()}
            />
          </Suspense>
        )}

        {view === "map" && (
          <div className="bg-white border border-black/[0.08] rounded-md overflow-hidden">
            <div className="h-[min(600px,70vh)] md:h-[600px]">
              <MapView
                markers={mapMarkers}
                selectedMarkerId={mapFocusId}
                onMarkerClick={(m) => {
                  setMapFocusId(m?.id);
                  if (m?.entityKey === "order" && m?.id) openOrderDetail(m.id);
                  if (m?.entityKey === "driver" && m?.id) {
                    openDriverDetail(String(m.id).replace(/^driver-/, ""));
                  }
                }}
                testid="orders-map"
              />
            </div>
          </div>
        )}
      </div>

      <OrderCreateDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={() => reload()} />
      <OrderImportDialog open={importOpen} onOpenChange={setImportOpen} onImported={() => reload()} />
    </div>
  );
}
