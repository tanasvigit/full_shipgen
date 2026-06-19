import React, { useCallback, useEffect, useMemo, useState } from "react";
import TopBar from "../components/yms/TopBar";
import StatusPill from "../components/yms/StatusPill";
import EmptyState from "../components/yms/EmptyState";
import AddEquipmentDialog from "../components/yms/AddEquipmentDialog";
import EditEquipmentDialog from "../components/yms/EditEquipmentDialog";
import {
  Wrench,
  BatteryFull,
  BatteryLow,
  MapPin,
  Loader2,
  AlertCircle,
  Plus,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useUI } from "../contexts/UIContext";
import { matchesSearch } from "../utils/search";
import equipmentApi, { computeEquipmentKpis } from "../services/equipmentApi";
import { notifyYmsDataChanged } from "../services/gateManagementApi";
import usePermissions from "../hooks/usePermissions";
import { MOD } from "../constants/permissions";
import { KPI_GRID_STANDARD } from "../lib/responsiveClasses";

const EQ_FIELDS = ["id", "code", "name", "type", "model", "status", "operator", "location", "assetNumber"];
const STATUS_FILTERS = ["ALL", "IDLE", "ASSIGNED", "IN_USE", "MAINTENANCE", "CHARGING", "OUT_OF_SERVICE"];

const KpiCard = ({ label, value, sub, accent = "text-slate-900" }) => (
  <div className="bg-white border border-slate-200 rounded-md p-4">
    <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">{label}</div>
    <div className={`font-display font-bold text-2xl mt-2 font-mono-yms ${accent}`}>{value}</div>
    {sub && <div className="text-[11px] text-slate-500 mt-1">{sub}</div>}
  </div>
);

const Equipment = () => {
  const { search, openEquipment } = useUI();
  const { canWriteEquipment, can } = usePermissions();
  const includeAppointments = can(MOD.APPOINTMENTS);
  const includeQueue = can(MOD.QUEUE);
  const [rows, setRows] = useState([]);
  const [kpis, setKpis] = useState(computeEquipmentKpis([]));
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const bundle = await equipmentApi.fetchEquipmentBundle({
        includeAppointments,
        includeQueue,
      });
      setRows(bundle.rows);
      setKpis(computeEquipmentKpis(bundle.rows));
    } catch (e) {
      setError(e.message || "Failed to load equipment");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [includeAppointments, includeQueue]);

  useEffect(() => {
    load();
    const onChange = () => load();
    window.addEventListener("yms-data-changed", onChange);
    return () => window.removeEventListener("yms-data-changed", onChange);
  }, [load]);

  const filtered = useMemo(() => {
    let list = rows;
    if (statusFilter !== "ALL") {
      list = list.filter((e) => e.status === statusFilter);
    }
    return list.filter((e) => matchesSearch(e, search, EQ_FIELDS));
  }, [rows, search, statusFilter]);

  const openDetail = (e) => {
    openEquipment({
      equipmentId: e.equipmentId,
      onUpdated: async () => {
        await load();
        notifyYmsDataChanged();
      },
    });
  };

  const handleEdit = (ev, e) => {
    ev.stopPropagation();
    setEditItem(e);
    setEditOpen(true);
  };

  const handleDelete = async (ev, e) => {
    ev.stopPropagation();
    if (!window.confirm(`Delete "${e.name}" (${e.code})? This cannot be undone.`)) return;
    try {
      await equipmentApi.deleteEquipment(e.equipmentId);
      toast.success(`${e.code} deleted`);
      await load();
      notifyYmsDataChanged();
    } catch (err) {
      toast.error(err.message || "Failed to delete equipment");
    }
  };

  const topActions = canWriteEquipment ? (
    <button
      type="button"
      data-testid="add-equipment-btn"
      onClick={() => setAddOpen(true)}
      className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-2 rounded-md transition"
    >
      <Plus className="w-3.5 h-3.5" /> Add Equipment
    </button>
  ) : null;

  return (
    <>
      <TopBar
        title="Equipment Management"
        subtitle="Forklifts · Cranes · Reach Stackers · Pallet Jacks · Live"
        actions={topActions}
      />
      <AddEquipmentDialog open={addOpen} onOpenChange={setAddOpen} onCreated={load} />
      <EditEquipmentDialog
        open={editOpen}
        item={editItem}
        onOpenChange={(o) => {
          setEditOpen(o);
          if (!o) setEditItem(null);
        }}
        onUpdated={load}
      />

      <div className="p-6 space-y-5">
        <div className={KPI_GRID_STANDARD}>
          <KpiCard label="Total Equipment" value={kpis.total} sub="registered units" />
          <KpiCard label="Available Equipment" value={kpis.available} sub="IDLE status" accent="text-emerald-600" />
          <KpiCard label="Assigned Equipment" value={kpis.assigned} sub="ASSIGNED status" accent="text-indigo-600" />
          <KpiCard label="Equipment In Use" value={kpis.inUse} sub="IN_USE status" />
          <KpiCard label="Equipment Charging" value={kpis.charging} sub="CHARGING status" accent="text-amber-600" />
          <KpiCard label="Equipment In Maintenance" value={kpis.maintenance} sub="MAINTENANCE status" />
          <KpiCard label="Out Of Service" value={kpis.outOfService} sub="OUT_OF_SERVICE" />
          <KpiCard
            label="Average Battery %"
            value={kpis.avgBattery ? `${kpis.avgBattery}%` : "—"}
            sub="units with battery data"
            accent="text-emerald-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              type="button"
              data-testid={`eq-filter-${s.toLowerCase()}`}
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 rounded-sm text-[11px] font-semibold border ${
                statusFilter === s
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
              }`}
            >
              {s === "ALL" ? "All" : s.replace(/_/g, " ")}
            </button>
          ))}
          <button type="button" onClick={load} className="ml-auto text-[11px] font-semibold text-slate-600 hover:text-slate-900">
            Refresh
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 py-16 text-slate-500 text-sm">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading equipment…
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start gap-3 text-sm text-red-800">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-semibold">Could not load equipment</p>
              <p className="text-red-700 mt-1">{error}</p>
              <button type="button" onClick={load} className="mt-2 underline font-semibold">
                Retry
              </button>
            </div>
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            {filtered.map((e) => {
              const lowBat = e.battery !== null && e.battery !== undefined && e.battery < 50;
              return (
                <div
                  key={e.equipmentId}
                  data-testid={`eq-card-${e.id}`}
                  className="relative text-left bg-white border border-slate-200 rounded-md p-4 hover:shadow-sm hover:border-slate-300 transition"
                >
                  <button type="button" className="w-full text-left" onClick={() => openDetail(e)}>
                    <div className="flex items-start justify-between pr-20">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-md bg-slate-100 flex items-center justify-center">
                          <Wrench className="w-4 h-4 text-slate-700" />
                        </div>
                        <div>
                          <div className="font-display font-bold text-sm text-slate-900">{e.name}</div>
                          <div className="font-mono-yms text-[10px] text-slate-500">{e.code}</div>
                          <div className="text-[10px] uppercase tracking-wider text-slate-500">{e.type.replace(/_/g, " ")}</div>
                        </div>
                      </div>
                    </div>
                    <div className="absolute top-4 right-4">
                      <StatusPill status={e.status} />
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Model</span>
                        <span className="font-semibold text-slate-900">{e.model}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Operator</span>
                        <span className="font-semibold text-slate-900">{e.operator}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> Location
                        </span>
                        <span className="font-mono-yms font-semibold text-slate-900 truncate max-w-[120px]">{e.location}</span>
                      </div>
                    </div>

                    {e.battery !== null && e.battery !== undefined && (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-500 uppercase tracking-wider font-semibold flex items-center gap-1">
                            {lowBat ? (
                              <BatteryLow className="w-3 h-3 text-red-500" />
                            ) : (
                              <BatteryFull className="w-3 h-3 text-emerald-500" />
                            )}
                            Battery
                          </span>
                          <span
                            className={`font-mono-yms font-bold ${
                              e.batteryBlocked ? "text-red-600" : lowBat ? "text-red-600" : e.battery > 75 ? "text-emerald-600" : "text-slate-700"
                            }`}
                          >
                            {e.battery}%
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 bg-slate-100 rounded-sm overflow-hidden">
                          <div
                            className={`h-full ${e.batteryBlocked || lowBat ? "bg-red-500" : e.battery > 75 ? "bg-emerald-500" : "bg-amber-500"}`}
                            style={{ width: `${e.battery}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </button>

                  <div className="flex items-center justify-end gap-1 mt-3 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      title="View"
                      data-testid={`eq-view-${e.id}`}
                      onClick={() => openDetail(e)}
                      className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    {canWriteEquipment && (
                    <button
                      type="button"
                      title="Edit"
                      data-testid={`eq-edit-${e.id}`}
                      onClick={(ev) => handleEdit(ev, e)}
                      className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    )}
                    {canWriteEquipment && (
                    <button
                      type="button"
                      title="Delete"
                      data-testid={`eq-delete-${e.id}`}
                      onClick={(ev) => handleDelete(ev, e)}
                      className="p-1.5 rounded-md border border-red-200 text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-md">
            <EmptyState query={search} label="equipment" />
          </div>
        )}
      </div>
    </>
  );
};

export default Equipment;
