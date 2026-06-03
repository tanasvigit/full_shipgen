import { useCallback, useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DataTable from "@/components/common/DataTable";
import ServiceAreaMapEditor from "@/pages/fleetops/service-areas/ServiceAreaMapEditor";
import { fleetopsService } from "@/services/fleetops";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function GeofenceHub() {
  const [draftGeometry, setDraftGeometry] = useState(null);
  const [events, setEvents] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [dwell, setDwell] = useState([]);
  const [driverHistory, setDriverHistory] = useState([]);
  const [driverUuid, setDriverUuid] = useState("");
  const [loading, setLoading] = useState(false);

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const [ev, inv, dw] = await Promise.all([
        fleetopsService.listGeofenceEvents().catch(() => []),
        fleetopsService.listGeofenceInventory().catch(() => []),
        fleetopsService.getGeofenceDwellReport().catch(() => ({})),
      ]);
      setEvents(ev);
      setInventory(inv);
      const dwellRows = Array.isArray(dw?.rows) ? dw.rows : Array.isArray(dw) ? dw : [];
      setDwell(dwellRows);
    } catch (err) {
      toast.error(err?.friendlyMessage || "Failed to load geofence data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const loadDriverHistory = async () => {
    if (!driverUuid.trim()) return;
    try {
      const rows = await fleetopsService.getGeofenceDriverHistory(driverUuid.trim());
      setDriverHistory(rows);
    } catch (err) {
      toast.error(err?.friendlyMessage || "Driver history failed");
      setDriverHistory([]);
    }
  };

  const saveDraftGeofence = async (polygon) => {
    setDraftGeometry(polygon);
    toast.success("Geofence polygon captured — assign to a place or service area via API");
  };

  return (
    <div data-testid="geofence-hub-page">
      <PageHeader
        breadcrumbs={[{ label: "FleetOps", to: "/fleet-ops" }, { label: "Geofences" }]}
        overline="Geo"
        title="Geofences"
        description="Draw geofences and inspect events, inventory, dwell, and driver history (G046, G089)."
      />
      <div className="p-6 space-y-6">
        <section className="rounded-md border border-black/[0.08] p-4" data-testid="geofence-draw-panel">
          <div className="overline mb-3">Draw geofence (G046)</div>
          <ServiceAreaMapEditor geometry={draftGeometry} onSave={saveDraftGeofence} onDelete={() => setDraftGeometry(null)} />
        </section>

        <Tabs defaultValue="events">
          <TabsList>
            <TabsTrigger value="events" data-testid="geofence-tab-events">Events</TabsTrigger>
            <TabsTrigger value="inventory" data-testid="geofence-tab-inventory">Inventory</TabsTrigger>
            <TabsTrigger value="dwell" data-testid="geofence-tab-dwell">Dwell report</TabsTrigger>
            <TabsTrigger value="history" data-testid="geofence-tab-history">Driver history</TabsTrigger>
          </TabsList>
          <TabsContent value="events" className="mt-4">
            <DataTable
              testid="geofence-events-table"
              loading={loading}
              data={events.map((r, i) => ({ id: r.id || i, ...r }))}
              columns={[
                { key: "type", header: "Type", render: (r) => r.type || r.event || "—" },
                { key: "subject", header: "Subject", render: (r) => r.driver_uuid || r.vehicle_uuid || "—" },
                { key: "at", header: "When", render: (r) => r.created_at || r.occurred_at || "—" },
              ]}
              emptyMessage="No geofence events"
            />
          </TabsContent>
          <TabsContent value="inventory" className="mt-4">
            <DataTable
              testid="geofence-inventory-table"
              loading={loading}
              data={inventory.map((r, i) => ({ id: r.id || i, ...r }))}
              columns={[
                { key: "geofence", header: "Geofence", render: (r) => r.geofence_id || r.name || "—" },
                { key: "count", header: "Inside", render: (r) => r.count ?? r.inside_count ?? "—" },
              ]}
              emptyMessage="No inventory data"
            />
          </TabsContent>
          <TabsContent value="dwell" className="mt-4">
            <DataTable
              testid="geofence-dwell-table"
              loading={loading}
              data={dwell.map((r, i) => ({ id: i, ...r }))}
              columns={[
                { key: "geofence", header: "Geofence" },
                { key: "dwell_seconds", header: "Dwell (s)", render: (r) => r.dwell_seconds ?? r.duration ?? "—" },
                { key: "driver", header: "Driver", render: (r) => r.driver_uuid || "—" },
              ]}
              emptyMessage="No dwell rows"
            />
          </TabsContent>
          <TabsContent value="history" className="mt-4 space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Driver UUID"
                value={driverUuid}
                onChange={(e) => setDriverUuid(e.target.value)}
                data-testid="geofence-driver-uuid"
              />
              <Button onClick={loadDriverHistory} data-testid="geofence-driver-history-load">
                Load history
              </Button>
            </div>
            <DataTable
              testid="geofence-driver-history-table"
              data={driverHistory.map((r, i) => ({ id: i, ...r }))}
              columns={[
                { key: "type", header: "Event" },
                { key: "geofence", header: "Geofence", render: (r) => r.geofence_id || "—" },
                { key: "at", header: "When", render: (r) => r.created_at || "—" },
              ]}
              emptyMessage="Enter a driver UUID and load"
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
