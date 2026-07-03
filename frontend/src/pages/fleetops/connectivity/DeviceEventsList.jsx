import { useCallback, useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import DataTable from "@/components/common/DataTable";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { parseApiError } from "@/lib/errors";
import { fleetopsService } from "@/services/fleetops";
import { mapCrudRow } from "@/lib/fleetops/crudEntities";
import { useFleetopsPermission } from "@/hooks/fleetops/useFleetopsPermission";
import { useFleetopsDetailDrawer } from "@/hooks/fleetops/useFleetopsDetailDrawer";
import CrudImportExportBar from "@/components/fleetops/crud/CrudImportExportBar";
import {
  deviceEventType,
  eventMatchesDevice,
} from "@/lib/fleetops/connectivityResourcePayloads";

export default function DeviceEventsList() {
  const { openDetail } = useFleetopsDetailDrawer("deviceEvent");
  const { can } = useFleetopsPermission();
  const canView = can("view", "device-event") || can("view", "device");
  const [rows, setRows] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deviceFilter, setDeviceFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");

  const load = useCallback(async () => {
    if (!canView) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [events, devs] = await Promise.all([
        fleetopsService.listDeviceEvent(),
        fleetopsService.listDevice(),
      ]);
      setRows(events.map((r) => mapCrudRow(r, "deviceEvent")));
      setDevices(devs.map((r) => mapCrudRow(r, "device")));
    } catch (err) {
      toast.error(parseApiError(err, "Failed to load device events"));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [canView]);

  useEffect(() => {
    load();
  }, [load]);

  const types = useMemo(
    () => [...new Set(rows.map((r) => deviceEventType(r.raw)).filter(Boolean))],
    [rows],
  );

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (deviceFilter !== "all" && !eventMatchesDevice(r.raw, deviceFilter)) return false;
      const eventType = deviceEventType(r.raw);
      if (typeFilter && eventType !== typeFilter) return false;
      if (dateFrom) {
        const created = r.raw?.created_at || r.raw?.occurred_at || "";
        if (created && created < dateFrom) return false;
      }
      return true;
    });
  }, [rows, deviceFilter, typeFilter, dateFrom]);

  if (!canView) {
    return (
      <div className="p-8" data-testid="device-event-forbidden">
        You do not have permission to view device events.
      </div>
    );
  }

  return (
    <div data-testid="device-event-list-page">
      <PageHeader overline="Connectivity" title="Device events" description={`${filtered.length} events`} />
      <div className="p-6">
        <CrudImportExportBar entityKey="deviceEvent" onComplete={load} testPrefix="device-event" />
        <div className="flex flex-wrap gap-2 mb-4">
          <Select value={deviceFilter} onValueChange={setDeviceFilter}>
            <SelectTrigger className="w-[200px]" data-testid="device-events-device-filter">
              <SelectValue placeholder="Device" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All devices</SelectItem>
              {devices.map((d) => (
                <SelectItem key={d.id} value={String(d.id)}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={typeFilter || "all"} onValueChange={(v) => setTypeFilter(v === "all" ? "" : v)}>
            <SelectTrigger className="w-[160px]" data-testid="device-events-type-filter">
              <SelectValue placeholder="Type" />
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
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-[160px]" data-testid="device-events-date-filter" />
        </div>
        <DataTable
          testid="device-event-table"
          columns={[
            { key: "name", header: "Event" },
            { key: "type", header: "Type", render: (r) => deviceEventType(r.raw) || "—" },
            { key: "device", header: "Device", render: (r) => r.raw?.device_name || r.raw?.device?.name || r.raw?.device_uuid || "—" },
            { key: "when", header: "When", render: (r) => r.raw?.created_at || r.raw?.occurred_at || "—" },
          ]}
          data={filtered}
          loading={loading}
          onRowClick={(r) => openDetail(r.id)}
          searchKeys={["name", "publicId"]}
        />
      </div>
    </div>
  );
}
