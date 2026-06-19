import React, { useCallback, useEffect, useMemo, useState } from "react";
import TopBar from "../components/yms/TopBar";
import SectionCard from "../components/yms/SectionCard";
import StatusPill from "../components/yms/StatusPill";
import KpiCard from "../components/yms/KpiCard";
import ExportMenu from "../components/yms/ExportMenu";
import EmptyState from "../components/yms/EmptyState";
import { Truck, Phone, RefreshCw, Warehouse, Clock, DoorOpen } from "lucide-react";
import { useUI } from "../contexts/UIContext";
import { matchesSearch } from "../utils/search";
import vehiclesApi, { VEHICLE_TYPES, formatVehicleType } from "../services/vehiclesApi";
import { lifecycleDisplayLabel } from "../constants/lifecycleStatuses";
import useBundlePermissionFlags from "../hooks/useBundlePermissionFlags";

const VEHICLE_SEARCH_FIELDS = [
  "reference", "plate", "displayName", "vehicleTypeLabel", "category",
  "transporter", "driver", "driverPhone", "material", "operationType",
  "currentStage", "zone", "status", "dockCode", "appointmentRef", "queueNumber",
];

const formatActivity = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
};

const FilterSelect = ({ label, value, onChange, options, testId }) => (
  <label className="flex flex-col gap-0.5">
    <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500">{label}</span>
    <select
      data-testid={testId}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="text-[11px] font-semibold border border-slate-200 rounded-md px-2 py-1.5 bg-white text-slate-700 min-w-[120px]"
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  </label>
);

const Vehicles = () => {
  const { openVehicle, search } = useUI();
  const { vehiclesBundleOptions } = useBundlePermissionFlags();
  const [cat, setCat] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [zoneFilter, setZoneFilter] = useState("All");
  const [dockFilter, setDockFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [rows, setRows] = useState([]);
  const [counts, setCounts] = useState({ total: 0, inYard: 0, waiting: 0, loading: 0, exitHolding: 0 });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const bundle = await vehiclesApi.fetchVehiclesBundle(vehiclesBundleOptions);
      setRows(bundle.rows);
      setCounts(bundle.counts);
    } catch (e) {
      console.error(e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [vehiclesBundleOptions]);

  useEffect(() => {
    load();
    const onChange = () => load();
    window.addEventListener("yms-data-changed", onChange);
    return () => window.removeEventListener("yms-data-changed", onChange);
  }, [load]);

  const filterOptions = useMemo(() => ({
    statuses: ["All", ...Array.from(new Set(rows.map((r) => r.status).filter(Boolean))).sort()],
    zones: ["All", ...Array.from(new Set(rows.map((r) => r.zone).filter((z) => z && z !== "—"))).sort()],
    docks: ["All", ...Array.from(new Set(rows.map((r) => r.dockCode).filter((d) => d && d !== "—"))).sort()],
    types: ["All", ...VEHICLE_TYPES.map((t) => formatVehicleType(t))],
  }), [rows]);

  const filtered = useMemo(() => {
    let list = cat === "All"
      ? rows
      : rows.filter((v) => v.category.toLowerCase() === cat.toLowerCase());

    if (statusFilter !== "All") {
      list = list.filter((v) => v.status === statusFilter);
    }
    if (zoneFilter !== "All") {
      list = list.filter((v) => v.zone === zoneFilter);
    }
    if (dockFilter !== "All") {
      list = list.filter((v) => v.dockCode === dockFilter);
    }
    if (typeFilter !== "All") {
      list = list.filter((v) => v.vehicleTypeLabel === typeFilter);
    }

    return list.filter((v) => matchesSearch(v, search, VEHICLE_SEARCH_FIELDS));
  }, [cat, rows, search, statusFilter, zoneFilter, dockFilter, typeFilter]);

  const exportRows = filtered.map((v) => ({
    plate: v.plate,
    status: v.status,
    zone: v.zone,
    dock: v.dockCode,
    appointment: v.appointmentRef,
    vehicleType: v.vehicleTypeLabel,
    lastActivity: formatActivity(v.lastActivity),
    currentStage: v.currentStage,
    reference: v.reference,
    category: v.category,
    transporter: v.transporter,
    driver: v.driver,
    phone: v.driverPhone,
    material: v.material,
    operationType: v.operationType,
  }));

  const openRow = (v) =>
    openVehicle({
      vehicleId: v.vehicleId || v.id,
      appointmentId: v.appointmentId,
      queueEntryId: v.queueEntryId,
      rowSnapshot: v,
    });

  return (
    <>
      <TopBar
        title="Vehicle Operations Monitor"
        subtitle="Live yard visibility · Journey tracking · Read-only operational view"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={load}
              className="inline-flex items-center gap-1 border border-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-md hover:bg-slate-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <ExportMenu
              testId="veh-export"
              filename="YARDOS_Vehicle_Operations"
              title="Vehicle Operations Monitor"
              subtitle={`${filtered.length} vehicles · read-only export`}
              columns={[
                "Vehicle", "Status", "Zone", "Dock", "Appointment", "Type", "Last Activity",
                "Stage", "Reference", "Category", "Transporter", "Driver", "Phone", "Material", "Operation",
              ]}
              keys={[
                "plate", "status", "zone", "dock", "appointment", "vehicleType", "lastActivity",
                "currentStage", "reference", "category", "transporter", "driver", "phone", "material", "operationType",
              ]}
              rows={exportRows}
              meta={[
                { label: "In Yard", value: String(counts.inYard) },
                { label: "Waiting", value: String(counts.waiting) },
                { label: "Loading", value: String(counts.loading) },
                { label: "Exit Holding", value: String(counts.exitHolding) },
              ]}
            />
          </div>
        }
      />
      <div className="p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <KpiCard testId="kpi-veh-inyard" label="In Yard" value={counts.inYard} hint="active vehicles" icon={Truck} />
          <KpiCard testId="kpi-veh-waiting" label="Waiting" value={counts.waiting} hint="in waiting area" icon={Clock} accent="warning" />
          <KpiCard testId="kpi-veh-loading" label="Loading" value={counts.loading} hint="ready or loading" icon={DoorOpen} accent="info" />
          <KpiCard testId="kpi-veh-exit" label="Exit Holding" value={counts.exitHolding} hint="awaiting gate-out" icon={Warehouse} accent="slate" />
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <FilterSelect
            label="Status"
            testId="veh-filter-status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={filterOptions.statuses}
          />
          <FilterSelect
            label="Zone"
            testId="veh-filter-zone"
            value={zoneFilter}
            onChange={setZoneFilter}
            options={filterOptions.zones}
          />
          <FilterSelect
            label="Dock"
            testId="veh-filter-dock"
            value={dockFilter}
            onChange={setDockFilter}
            options={filterOptions.docks}
          />
          <FilterSelect
            label="Vehicle Type"
            testId="veh-filter-type"
            value={typeFilter}
            onChange={setTypeFilter}
            options={filterOptions.types}
          />
          <div className="flex bg-white border border-slate-200 rounded-md overflow-hidden ml-auto">
            {["All", "Company", "Contract", "Outside"].map((f) => (
              <button
                key={f}
                data-testid={`veh-filter-${f.toLowerCase()}`}
                onClick={() => setCat(f)}
                className={`px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition ${
                  cat === f ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <SectionCard
          testId="card-veh-list"
          title="Vehicles In Operation"
          subtitle={loading ? "Loading…" : `${filtered.length} vehicles · monitor view`}
          padding="p-0"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                <tr className="text-[10px] uppercase tracking-wider text-slate-500">
                  <th className="text-left font-semibold px-4 py-2.5">Vehicle</th>
                  <th className="text-left font-semibold px-2 py-2.5">Status</th>
                  <th className="text-left font-semibold px-2 py-2.5">Zone</th>
                  <th className="text-left font-semibold px-2 py-2.5">Dock</th>
                  <th className="text-left font-semibold px-2 py-2.5">Appointment</th>
                  <th className="text-left font-semibold px-2 py-2.5">Type</th>
                  <th className="text-left font-semibold px-2 py-2.5">Last Activity</th>
                  <th className="text-left font-semibold px-2 py-2.5">Stage</th>
                  <th className="text-left font-semibold px-2 py-2.5">Reference</th>
                  <th className="text-left font-semibold px-2 py-2.5">Category</th>
                  <th className="text-left font-semibold px-2 py-2.5">Transporter</th>
                  <th className="text-left font-semibold px-2 py-2.5">Driver</th>
                  <th className="text-left font-semibold px-2 py-2.5">Phone</th>
                  <th className="text-left font-semibold px-2 py-2.5">Material</th>
                  <th className="text-left font-semibold px-2 py-2.5">Operation</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((v) => (
                  <tr
                    key={v.id}
                    data-testid={`veh-row-${v.id}`}
                    onClick={() => openRow(v)}
                    className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                  >
                    <td className="px-4 py-2.5 font-mono-yms font-semibold text-slate-900">{v.plate}</td>
                    <td className="px-2 py-2.5"><StatusPill status={lifecycleDisplayLabel(v.status)} /></td>
                    <td className="px-2 py-2.5 text-slate-700">{v.zone}</td>
                    <td className="px-2 py-2.5 font-mono-yms text-[11px] text-slate-600">{v.dockCode}</td>
                    <td className="px-2 py-2.5 font-mono-yms text-[11px] text-slate-600">{v.appointmentRef}</td>
                    <td className="px-2 py-2.5 text-slate-700">{v.vehicleTypeLabel}</td>
                    <td className="px-2 py-2.5 font-mono-yms text-[11px] text-slate-500">{formatActivity(v.lastActivity)}</td>
                    <td className="px-2 py-2.5"><StatusPill status={v.currentStage} /></td>
                    <td className="px-2 py-2.5 font-mono-yms text-[11px] text-slate-600">{v.reference}</td>
                    <td className="px-2 py-2.5"><StatusPill status={v.category} /></td>
                    <td className="px-2 py-2.5 text-slate-700">{v.transporter}</td>
                    <td className="px-2 py-2.5 text-slate-700">{v.driver}</td>
                    <td className="px-2 py-2.5 font-mono-yms text-slate-500 text-[11px]">
                      <span className="inline-flex items-center gap-1"><Phone className="w-3 h-3" /> {v.driverPhone}</span>
                    </td>
                    <td className="px-2 py-2.5 text-slate-700">{v.material}</td>
                    <td className="px-2 py-2.5 text-slate-700">{v.operationType}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && filtered.length === 0 && <EmptyState query={search} label="vehicles" />}
          </div>
        </SectionCard>
      </div>
    </>
  );
};

export default Vehicles;
