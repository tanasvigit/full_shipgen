import React, { useCallback, useEffect, useMemo, useState } from "react";
import TopBar from "../components/yms/TopBar";
import SectionCard from "../components/yms/SectionCard";
import StatusPill from "../components/yms/StatusPill";
import KpiCard from "../components/yms/KpiCard";
import EmptyState from "../components/yms/EmptyState";
import CreateZoneDialog from "../components/yms/CreateZoneDialog";
import EditZoneDialog from "../components/yms/EditZoneDialog";
import ZoneDrawer from "../components/yms/ZoneDrawer";
import ZoneDetailBadge from "../components/yms/ZoneDetailBadge";
import { zonePanelTitle } from "../utils/zoneDisplay";
import {
  Compass, Loader2, AlertCircle, Activity, Plus, Eye,
  LayoutGrid, Ban, Gauge,
} from "lucide-react";
import { useUI } from "../contexts/UIContext";
import yardMapApi, {
  findNavZoneById,
  getLiveZoneCounters,
  getZoneEvents,
} from "../services/yardMapApi";
import { notifyYmsDataChanged } from "../services/gateManagementApi";
import useOperationalAutoRefresh from "../hooks/useOperationalAutoRefresh";
import usePermissions from "../hooks/usePermissions";
import { MOD } from "../constants/permissions";
import { KPI_GRID_DENSE, PAGE_PADDING } from "../lib/responsiveClasses";

const ZONE_FILTERS = [
  { id: "ALL", label: "All zones" },
  { id: "A", label: "Loading" },
  { id: "B", label: "Unloading" },
  { id: "C", label: "Documentation" },
  { id: "D", label: "Hazardous" },
  { id: "E", label: "Cold Chain" },
  { id: "F", label: "Emergency" },
  { id: "occupied", label: "Occupied" },
  { id: "free", label: "Has space" },
];

const YardMap = () => {
  const { openVehicle, openDock, search } = useUI();
  const { can } = usePermissions();
  const includeAppointments = can(MOD.APPOINTMENTS) || can(MOD.APPOINTMENTS_VIEW);
  const includeQueue = can(MOD.QUEUE);
  const includeDocks = can(MOD.DOCKS);
  const [model, setModel] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);
  const [zoneFilter, setZoneFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editZone, setEditZone] = useState(null);
  const [zoneDrawerId, setZoneDrawerId] = useState(null);
  const [zoneDrawerOpen, setZoneDrawerOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const bundle = await yardMapApi.fetchYardMapBundle({
        includeAppointments,
        includeQueue,
        includeDocks,
      });
      setModel(bundle);
    } catch (e) {
      setError(e.message || "Failed to load yard map");
      setModel(null);
    } finally {
      setLoading(false);
    }
  }, [includeAppointments, includeQueue, includeDocks]);

  useEffect(() => {
    load();
  }, [load]);

  useOperationalAutoRefresh(load);

  const filtered = useMemo(() => {
    if (!model) return null;
    try {
      return yardMapApi.filterYardMapModel(model, search, "ALL");
    } catch {
      return {
        ...model,
        zones: model.zones,
        filteredVehicles: model.allVehicles ?? [],
        dockTiles: model.dockTiles ?? [],
      };
    }
  }, [model, search]);

  const liveZoneCounters = useMemo(
    () => (model?.yardZones ? getLiveZoneCounters(model.yardZones) : []),
    [model?.yardZones]
  );

  useEffect(() => {
    if (!model?.yardZones?.length) return;
    if (selectedZone && findNavZoneById(model, selectedZone)) return;
    const loading = liveZoneCounters.find((c) => c.zoneType === "LOADING") || liveZoneCounters[0];
    if (loading?.id) setSelectedZone(loading.id);
  }, [model, selectedZone, liveZoneCounters]);

  const handleZoneSelect = useCallback(
    (zoneId) => {
      if (!zoneId) return;
      setSelectedZone(zoneId);
      const mapZone = model?.zones?.find((z) => z.id === zoneId);
      if (mapZone?.code) setZoneFilter(mapZone.code);
      else setZoneFilter("ALL");
    },
    [model?.zones]
  );

  useEffect(() => {
    if (zoneFilter.length === 1 && ["A", "B", "C", "D", "E", "F"].includes(zoneFilter) && model?.zones) {
      const mapZone = model.zones.find((z) => z.code === zoneFilter);
      if (mapZone?.id) setSelectedZone(mapZone.id);
    }
  }, [zoneFilter, model?.zones]);

  const activeZone = useMemo(() => {
    if (!model || !selectedZone) return null;
    return findNavZoneById(model, selectedZone);
  }, [model, selectedZone]);

  const vehiclesInZone = useMemo(() => {
    if (!activeZone) return [];
    const list = activeZone.vehicles || [];
    if (!search?.trim() || !filtered) return list;
    return list.filter((v) => filtered.filteredVehicles.some((fv) => fv.vehicleId === v.vehicleId));
  }, [activeZone, search, filtered]);

  const zoneEvents = useMemo(() => {
    if (!model || !activeZone) return [];
    const code = activeZone.code || activeZone.mapCode || activeZone.zoneCode;
    return getZoneEvents(model.events || model.recentEvents, code, activeZone.vehicles || []);
  }, [model, activeZone]);

  const dashboard = model?.dashboard;

  const openVehicleDetail = (v) => {
    openVehicle({
      vehicleId: v.vehicleId,
      queueEntryId: v.queueEntryId,
      appointmentId: v.appointmentId,
      dockId: v.dockId,
      onQueueUpdated: async () => {
        await load();
        notifyYmsDataChanged();
      },
    });
  };

  const openDockDetail = (dockId) => {
    openDock({
      dockId,
      onUpdated: async () => {
        await load();
        notifyYmsDataChanged();
      },
      openVehicle: (payload) => openVehicle(payload),
    });
  };

  const openZoneControl = (z) => {
    if (z?.id) {
      setZoneDrawerId(z.id);
      setZoneDrawerOpen(true);
    }
  };

  if (loading && !model) {
    return (
      <>
        <TopBar title="Yard Control" subtitle="Loading operational yard data…" />
        <div className="p-6 flex items-center justify-center gap-2 text-slate-500 py-24">
          <Loader2 className="w-6 h-6 animate-spin" /> Loading yard control…
        </div>
      </>
    );
  }

  if (error && !model) {
    return (
      <>
        <TopBar title="Yard Control" subtitle="Operational yard management" />
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-md p-4 flex gap-3 text-red-800">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-semibold">Could not load yard control</p>
              <p className="text-sm mt-1">{error}</p>
              <button type="button" onClick={load} className="mt-2 underline text-sm font-semibold">
                Retry
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  const dockTiles = filtered?.dockTiles ?? model?.dockTiles ?? [];
  const mapZones = model?.zones ?? [];

  let displayMapZones = mapZones;
  if (search?.trim() && filtered) {
    displayMapZones = mapZones.map((z) => ({
      ...z,
      vehicles: z.vehicles.filter((v) =>
        filtered.filteredVehicles?.some((fv) => fv.vehicleId === v.vehicleId)
      ),
    }));
  }
  if (zoneFilter === "occupied") displayMapZones = displayMapZones.filter((z) => z.occupied > 0);
  else if (zoneFilter === "free") displayMapZones = displayMapZones.filter((z) => z.free > 0);
  else if (["A", "B", "C", "D", "E", "F"].includes(zoneFilter)) {
    displayMapZones = displayMapZones.filter((z) => z.code === zoneFilter);
  }

  return (
    <>
      <TopBar
        title="Yard Control"
        subtitle={`${model?.totalInYard ?? 0} vehicles in yard · zone master · live occupancy`}
        actions={
          <>
            <button
              data-testid="create-zone-btn-mobile"
              type="button"
              onClick={() => setCreateOpen(true)}
              className="md:hidden inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-2 rounded-md transition min-h-[44px]"
            >
              <Plus className="w-3.5 h-3.5" /> Zone
            </button>
            <button
              data-testid="create-zone-btn"
              type="button"
              onClick={() => setCreateOpen(true)}
              className="hidden md:inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-2 rounded-md transition min-h-[44px]"
            >
              <Plus className="w-3.5 h-3.5" /> Create Zone
            </button>
          </>
        }
      />
      <div className={`${PAGE_PADDING}`}>
        {dashboard && (
          <div className={KPI_GRID_DENSE}>
            <KpiCard testId="kpi-total-zones" label="Total Zones" value={dashboard.totalZones} icon={LayoutGrid} />
            <KpiCard testId="kpi-active-zones" label="Active" value={dashboard.activeZones} accent="success" />
            <KpiCard testId="kpi-blocked-zones" label="Blocked" value={dashboard.blockedZones} accent="danger" icon={Ban} />
            <KpiCard testId="kpi-full-zones" label="Full" value={dashboard.fullZones} accent="warning" />
            <KpiCard testId="kpi-total-capacity" label="Total Capacity" value={dashboard.totalCapacity} icon={Gauge} />
            <KpiCard testId="kpi-occupancy" label="Occupancy" value={dashboard.currentOccupancy} accent="info" />
            <KpiCard testId="kpi-available" label="Available Slots" value={dashboard.availableSlots} accent="success" />
            <KpiCard
              testId="kpi-utilization"
              label="Yard Utilization"
              value={`${dashboard.yardUtilizationPct}`}
              suffix="%"
              accent={dashboard.yardUtilizationPct > 85 ? "danger" : dashboard.yardUtilizationPct > 65 ? "warning" : "success"}
            />
          </div>
        )}

        {liveZoneCounters.length > 0 && (
          <div
            data-testid="live-zone-counters"
            className="flex flex-wrap gap-2 p-3 bg-white border border-slate-200 rounded-md"
          >
            {liveZoneCounters.map((c) => (
              <button
                key={c.zoneType}
                type="button"
                data-testid={`zone-counter-${c.zoneType}`}
                onClick={() => handleZoneSelect(c.id)}
                disabled={!c.id}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-[11px] border transition disabled:opacity-40 ${
                  selectedZone === c.id
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-slate-50 text-slate-800 border-slate-200 hover:border-slate-400"
                }`}
              >
                <span className="font-semibold">{c.label}</span>
                <span className="font-mono-yms font-bold">
                  {c.occupied}/{c.capacity}
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {ZONE_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setZoneFilter(f.id)}
              className={`px-2.5 py-1 rounded-sm text-[11px] font-semibold border ${
                zoneFilter === f.id
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-600 border-slate-200"
              }`}
            >
              {f.label}
            </button>
          ))}
          <button type="button" onClick={load} className="ml-auto text-[11px] font-semibold text-slate-600 hover:text-slate-900">
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
          <div className="xl:col-span-3">
            <SectionCard
              testId="card-yard-map"
              title="Facility Overhead"
              subtitle="Bhiwandi Mega Hub · live zone occupancy"
              action={
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-semibold">
                  <span className="inline-flex items-center gap-1 text-emerald-600">●Avail</span>
                  <span className="inline-flex items-center gap-1 text-red-600">●Occupied</span>
                  <span className="inline-flex items-center gap-1 text-amber-600">●Delayed</span>
                </div>
              }
            >
              <div className="overflow-x-auto thin-scroll -mx-1 px-1">
              <div
                className="relative bg-slate-50 border-2 border-dashed border-slate-300 rounded-md p-3 sm:p-4 grid-bg min-h-[320px] sm:min-h-[400px] md:min-h-[480px] lg:min-h-[540px] min-w-[300px]"
              >
                <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-900 text-amber-400 font-mono-yms text-[10px] px-2 py-1 rounded-sm uppercase tracking-widest flex items-center gap-1">
                  <Compass className="w-3 h-3" /> Main Gate G1
                </div>

                <div className="hidden md:flex absolute top-12 right-2 bottom-12 w-16 lg:w-24 flex-col gap-1 overflow-y-auto thin-scroll">
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest text-center mb-1 sticky top-0 bg-slate-50">
                    Docks ({dockTiles.length})
                  </div>
                  {dockTiles.length === 0 ? (
                    <div className="text-[9px] text-slate-400 text-center py-2">No docks</div>
                  ) : (
                    dockTiles.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => openDockDetail(d.id)}
                        className="flex-1 min-h-[22px] bg-white border border-slate-300 rounded-sm flex items-center justify-between px-2 hover:border-slate-900 cursor-pointer text-left"
                        title={d.currentVehicle ? `${d.code}: ${d.currentVehicle}` : d.code}
                      >
                        <span className="font-mono-yms text-[10px] font-bold text-slate-700 truncate">{d.code}</span>
                        <span className={`w-2 h-2 rounded-full shrink-0 ${d.color}`} />
                      </button>
                    ))
                  )}
                </div>

                <div className="absolute top-12 left-2 right-2 md:right-20 lg:right-28 bottom-12 grid grid-cols-2 sm:grid-cols-3 grid-rows-3 sm:grid-rows-2 gap-2 sm:gap-3">
                  {displayMapZones.map((z) => {
                    const dotVehicles = z.vehicles;
                    const isActive = selectedZone === z.id;
                    return (
                      <button
                        key={z.code}
                        type="button"
                        data-testid={`zone-${z.code}`}
                        onClick={() => handleZoneSelect(z.id)}
                        className={`zone-cell relative bg-white border-2 rounded-md p-2 text-left transition-all ${
                          isActive ? "border-slate-900 shadow-md" : "border-slate-300"
                        }`}
                        style={{ borderColor: isActive ? z.color : undefined }}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-mono-yms font-bold text-2xl" style={{ color: z.color }}>
                              {z.code}
                            </div>
                            <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-600">{z.name}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono-yms text-[10px] text-slate-500">
                              {z.occupied}/{z.capacity}
                            </div>
                            <div
                              className={`font-mono-yms text-[10px] font-bold ${
                                z.pct > 85 ? "text-red-600" : z.pct > 65 ? "text-amber-600" : "text-emerald-600"
                              }`}
                            >
                              {z.pct}%
                            </div>
                          </div>
                        </div>

                        <div className="absolute inset-0">
                          {dotVehicles.slice(0, 14).map((v) => (
                            <button
                              key={v.vehicleId}
                              type="button"
                              data-testid={`yard-vehicle-dot-${v.plate}`}
                              className="absolute w-3 h-3 rounded-sm shadow-sm hover:ring-2 hover:ring-offset-1 hover:ring-slate-900 cursor-pointer z-10 transition-transform hover:scale-125"
                              style={{ left: v.dot.left, top: v.dot.top, background: z.color }}
                              title={`${v.plate} · ${v.status}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                openVehicleDetail(v);
                              }}
                            />
                          ))}
                        </div>

                        <div className="absolute left-2 right-2 bottom-1.5 h-1 bg-slate-100 rounded-sm overflow-hidden">
                          <div className="h-full" style={{ width: `${z.pct}%`, background: z.color }} />
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-slate-900 text-amber-400 font-mono-yms text-[10px] px-2 py-1 rounded-sm uppercase tracking-widest flex items-center gap-1">
                  <Compass className="w-3 h-3" /> Exit G2
                </div>
              </div>

              {dockTiles.length > 0 && (
                <div className="md:hidden mt-3 flex gap-2 overflow-x-auto thin-scroll pb-1" data-testid="mobile-dock-rail">
                  {dockTiles.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => openDockDetail(d.id)}
                      className="shrink-0 min-h-[44px] px-3 py-2 bg-white border border-slate-300 rounded-md flex items-center gap-2"
                      title={d.currentVehicle ? `${d.code}: ${d.currentVehicle}` : d.code}
                    >
                      <span className="font-mono-yms text-[11px] font-bold text-slate-700">{d.code}</span>
                      <span className={`w-2 h-2 rounded-full shrink-0 ${d.color}`} />
                    </button>
                  ))}
                </div>
              )}
              </div>
            </SectionCard>
          </div>

          <div className="xl:col-span-1 space-y-4">
            {activeZone ? (
              <SectionCard
                testId="card-zone-detail"
                title={zonePanelTitle(activeZone)}
                subtitle={`${activeZone.occupied} of ${activeZone.capacity} occupied`}
                action={<StatusPill status={activeZone.status} />}
                padding="p-0"
              >
                <div className="p-4 space-y-3 border-b border-slate-100">
                  <ZoneDetailBadge zone={activeZone} />
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-slate-50 border border-slate-200 rounded-md p-2 text-center">
                      <div className="font-mono-yms text-xl font-bold text-slate-900">{activeZone.occupied}</div>
                      <div className="text-slate-500 uppercase tracking-wider text-[10px]">Occupied</div>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-md p-2 text-center">
                      <div className="font-mono-yms text-xl font-bold text-slate-900">{activeZone.free}</div>
                      <div className="text-slate-500 uppercase tracking-wider text-[10px]">Free</div>
                    </div>
                  </div>
                  {activeZone.purpose && (
                    <div className="text-[11px] text-slate-600">
                      <strong className="text-slate-900">Purpose:</strong>
                      <div className="mt-1">{activeZone.purpose}</div>
                    </div>
                  )}
                  {activeZone.id && (
                    <button
                      type="button"
                      onClick={() => openZoneControl(activeZone)}
                      className="w-full inline-flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-wider border border-slate-300 rounded-md py-2 hover:bg-slate-50"
                    >
                      <Eye className="w-3.5 h-3.5" /> Zone Control
                    </button>
                  )}
                </div>

                <div className="px-4 py-2 border-b border-slate-100 bg-slate-50">
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-700">
                    Vehicles in Zone ({vehiclesInZone.length})
                  </div>
                </div>

                <div className="overflow-x-auto max-h-[320px] overflow-y-auto thin-scroll">
                  {vehiclesInZone.length === 0 ? (
                    <div className="px-4 py-6 text-center text-[11px] text-slate-500">
                      {search?.trim() ? <EmptyState query={search} label="vehicles in zone" /> : "No vehicles in this zone"}
                    </div>
                  ) : (
                    <table className="w-full text-[11px]" data-testid="zone-vehicles-table">
                      <thead className="sticky top-0 bg-white border-b border-slate-200 text-[9px] uppercase tracking-wider text-slate-500">
                        <tr>
                          <th className="text-left font-semibold px-3 py-2">Vehicle</th>
                          <th className="text-left font-semibold px-2 py-2">Status</th>
                          <th className="text-left font-semibold px-2 py-2 hidden sm:table-cell">Appointment</th>
                          <th className="text-left font-semibold px-2 py-2">Dock</th>
                          <th className="text-right font-semibold px-2 py-2">ETA</th>
                          <th className="text-right font-semibold px-3 py-2">Delay</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vehiclesInZone.map((v) => (
                          <tr
                            key={v.vehicleId}
                            data-testid={`zone-vehicle-row-${v.plate}`}
                            tabIndex={0}
                            role="button"
                            onClick={() => openVehicleDetail(v)}
                            onKeyDown={(e) => e.key === "Enter" && openVehicleDetail(v)}
                            className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer"
                          >
                            <td className="px-3 py-2 font-mono-yms font-semibold text-slate-900 whitespace-nowrap">
                              {v.plate}
                            </td>
                            <td className="px-2 py-2 text-slate-700 whitespace-nowrap">{v.status}</td>
                            <td className="px-2 py-2 text-slate-600 whitespace-nowrap hidden sm:table-cell">
                              {v.appointmentRef || "—"}
                            </td>
                            <td className="px-2 py-2 font-mono-yms text-slate-700 whitespace-nowrap">
                              {v.dockCode || "—"}
                            </td>
                            <td className="px-2 py-2 text-right font-mono-yms text-slate-700 whitespace-nowrap">
                              {v.etaMin > 0 ? `${v.etaMin}m` : "—"}
                            </td>
                            <td className="px-3 py-2 text-right whitespace-nowrap">
                              {v.delayed ? (
                                <span className="text-amber-700 font-semibold">Yes</span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </SectionCard>
            ) : (
              <SectionCard testId="card-zone-detail" title="Zone detail" subtitle="Select a zone">
                <p className="text-sm text-slate-500 p-4">Select a zone from the counter strip or map</p>
              </SectionCard>
            )}

            <SectionCard
              testId="card-zone-activity"
              title="Recent activity"
              subtitle="Zone movement events"
              padding="p-0"
            >
              <div className="max-h-[160px] overflow-y-auto thin-scroll">
                {zoneEvents.length === 0 ? (
                  <p className="px-3 py-4 text-[11px] text-slate-500 text-center">No recent events for this zone</p>
                ) : (
                  zoneEvents.map((ev) => (
                    <div key={ev.id} className="px-3 py-2 border-b border-slate-100 text-[11px]">
                      <div className="flex items-center gap-1 font-mono-yms text-slate-800">
                        <Activity className="w-3 h-3 text-slate-400" />
                        {ev.event_type}
                      </div>
                      <div className="text-slate-500 mt-0.5">
                        {new Date(ev.event_time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        {ev.event_note ? ` — ${ev.event_note}` : ""}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </SectionCard>
          </div>
        </div>
      </div>

      <CreateZoneDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={async () => {
          await load();
          notifyYmsDataChanged();
        }}
      />
      <EditZoneDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        zone={editZone}
        onUpdated={async () => {
          await load();
          notifyYmsDataChanged();
          if (zoneDrawerId) setZoneDrawerOpen(true);
        }}
      />
      <ZoneDrawer
        zoneId={zoneDrawerId}
        open={zoneDrawerOpen}
        onOpenChange={setZoneDrawerOpen}
        recentEvents={model?.events || model?.recentEvents || []}
        onEdit={(z) => {
          setEditZone(z);
          setEditOpen(true);
        }}
        onDeleted={async () => {
          await load();
          notifyYmsDataChanged();
        }}
      />
    </>
  );
};

export default YardMap;
