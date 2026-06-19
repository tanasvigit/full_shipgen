import React, { useCallback, useEffect, useMemo, useState } from "react";
import TopBar from "../components/yms/TopBar";
import SectionCard from "../components/yms/SectionCard";
import StatusPill from "../components/yms/StatusPill";
import EmptyState from "../components/yms/EmptyState";
import CreateTeamDialog from "../components/yms/CreateTeamDialog";
import EditTeamDialog from "../components/yms/EditTeamDialog";
import { HardHat, Clock, Loader2, AlertCircle, Plus, Eye, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useUI } from "../contexts/UIContext";
import { matchesSearch } from "../utils/search";
import laborApi, { computeLaborKpis } from "../services/laborApi";
import { notifyYmsDataChanged } from "../services/gateManagementApi";
import usePermissions from "../hooks/usePermissions";
import { MOD } from "../constants/permissions";

const LABOR_FIELDS = [
  "id",
  "code",
  "name",
  "shift",
  "assigned",
  "status",
  "supervisor",
  "location",
  "materialType",
];
const STATUS_FILTERS = ["ALL", "ON_DUTY", "OFF_DUTY", "ASSIGNED", "AVAILABLE", "BREAK", "UNAVAILABLE"];

const KpiCard = ({ label, value, sub, accent = "text-slate-900" }) => (
  <div className="bg-white border border-slate-200 rounded-md p-4">
    <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">{label}</div>
    <div className={`font-display font-bold text-2xl mt-2 font-mono-yms ${accent}`}>{value}</div>
    {sub && <div className="text-[11px] text-slate-500 mt-1">{sub}</div>}
  </div>
);

const Labor = () => {
  const { search, openLabor } = useUI();
  const { canWriteLabor, can } = usePermissions();
  const includeAppointments = can(MOD.APPOINTMENTS);
  const includeQueue = can(MOD.QUEUE);
  const [rows, setRows] = useState([]);
  const [kpis, setKpis] = useState(computeLaborKpis([]));
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTeam, setEditTeam] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const bundle = await laborApi.fetchLaborBundle({
        includeAppointments,
        includeQueue,
      });
      setRows(bundle.rows);
      setKpis(computeLaborKpis(bundle.rows));
    } catch (e) {
      setError(e.message || "Failed to load labor teams");
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
      list = list.filter((t) => t.status === statusFilter);
    }
    return list.filter((t) => matchesSearch(t, search, LABOR_FIELDS));
  }, [rows, search, statusFilter]);

  const openDetail = (t) => {
    openLabor({
      laborId: t.laborId,
      onUpdated: async () => {
        await load();
        notifyYmsDataChanged();
      },
    });
  };

  const handleEdit = (e, t) => {
    e.stopPropagation();
    setEditTeam(t);
    setEditOpen(true);
  };

  const handleDelete = async (e, t) => {
    e.stopPropagation();
    if (!window.confirm(`Delete team "${t.name}" (${t.code})? This cannot be undone.`)) return;
    try {
      await laborApi.deleteTeam(t.laborId);
      toast.success(`Team ${t.code} deleted`);
      await load();
      notifyYmsDataChanged();
    } catch (err) {
      toast.error(err.message || "Failed to delete team");
    }
  };

  const topActions = canWriteLabor ? (
    <button
      type="button"
      data-testid="create-team-btn"
      onClick={() => setCreateOpen(true)}
      className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-2 rounded-md transition"
    >
      <Plus className="w-3.5 h-3.5" /> Create Team
    </button>
  ) : null;

  return (
    <>
      <TopBar
        title="Labor Management"
        subtitle="Labor teams · Shift roster · Dock & vehicle assignment · Live availability"
        actions={topActions}
      />
      <CreateTeamDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={load} />
      <EditTeamDialog
        open={editOpen}
        team={editTeam}
        onOpenChange={(o) => {
          setEditOpen(o);
          if (!o) setEditTeam(null);
        }}
        onUpdated={load}
      />

      <div className="p-6 space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <KpiCard label="Total Workforce" value={kpis.totalMembers} sub={`${kpis.teamCount} teams · live`} />
          <KpiCard
            label="Available Workforce"
            value={kpis.availableWorkforce}
            sub="workers ready to assign"
            accent="text-emerald-600"
          />
          <KpiCard label="Assigned Teams" value={kpis.assignedTeams} sub="status ASSIGNED" accent="text-indigo-600" />
          <KpiCard label="Teams On Break" value={kpis.teamsOnBreak} sub="BREAK status" accent="text-amber-600" />
          <KpiCard label="Teams Available" value={kpis.teamsAvailable} sub="ON_DUTY or AVAILABLE" accent="text-emerald-600" />
          <KpiCard label="Teams Off Duty" value={kpis.teamsOffDuty} sub="OFF_DUTY status" />
          <KpiCard label="Teams Working" value={kpis.teamsWorking} sub="assigned to dock/vehicle" />
          <KpiCard label="Available Now" value={kpis.availableNow} sub="unassigned worker headcount" accent="text-emerald-600" />
          <KpiCard
            label="Avg Utilization"
            value={`${kpis.avgUtil}%`}
            sub="assigned_count / members"
            accent="text-amber-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              type="button"
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
          <button
            type="button"
            onClick={load}
            className="ml-auto text-[11px] font-semibold text-slate-600 hover:text-slate-900"
          >
            Refresh
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 py-12 text-slate-500 text-sm">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading teams…
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start gap-3 text-sm text-red-800">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-semibold">Could not load labor teams</p>
              <p className="text-red-700 mt-1">{error}</p>
              <button type="button" onClick={load} className="mt-2 underline font-semibold">
                Retry
              </button>
            </div>
          </div>
        )}

        {!loading && !error && (
          <SectionCard
            testId="card-labor-teams"
            title="Teams"
            subtitle={`${rows.length} teams · backend-driven`}
            padding="p-0"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr className="text-[10px] uppercase tracking-wider text-slate-500">
                    <th className="text-left font-semibold px-4 py-2.5">Team</th>
                    <th className="text-left font-semibold px-2 py-2.5">Material</th>
                    <th className="text-left font-semibold px-2 py-2.5">Shift</th>
                    <th className="text-right font-semibold px-2 py-2.5">Members</th>
                    <th className="text-right font-semibold px-2 py-2.5">Available</th>
                    <th className="text-left font-semibold px-2 py-2.5">Currently Assigned</th>
                    <th className="text-left font-semibold px-2 py-2.5 w-48">Utilization</th>
                    <th className="text-left font-semibold px-4 py-2.5">Status</th>
                    <th className="text-right font-semibold px-4 py-2.5 w-28">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => (
                    <tr
                      key={t.laborId}
                      data-testid={`team-row-${t.id}`}
                      onClick={() => openDetail(t)}
                      className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                    >
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-md bg-slate-900 text-amber-400 flex items-center justify-center">
                            <HardHat className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-display font-bold text-slate-900">{t.name}</div>
                            <div className="font-mono-yms text-[10px] text-slate-500">{t.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-2.5 text-[10px] font-semibold text-slate-600">
                        {t.materialType.replace(/_/g, " ")}
                      </td>
                      <td className="px-2 py-2.5 font-mono-yms text-slate-700">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" /> {t.shift}
                        </span>
                      </td>
                      <td className="px-2 py-2.5 text-right font-mono-yms font-bold text-slate-900">{t.members}</td>
                      <td className="px-2 py-2.5 text-right font-mono-yms font-bold text-emerald-600">{t.available}</td>
                      <td className="px-2 py-2.5 text-slate-700">
                        <div>{t.assigned}</div>
                        {t.assignedSinceLabel !== "—" && (
                          <div className="text-[10px] text-slate-400">since {t.assignedSinceLabel}</div>
                        )}
                      </td>
                      <td className="px-2 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-sm overflow-hidden">
                            <div className="h-full bg-slate-900" style={{ width: `${t.utilPct}%` }} />
                          </div>
                          <span className="font-mono-yms text-[11px] font-semibold text-slate-700 w-10 text-right">
                            {t.utilPct}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusPill status={t.status} />
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            data-testid={`team-view-${t.id}`}
                            title="View details"
                            onClick={() => openDetail(t)}
                            className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {canWriteLabor && (
                          <button
                            type="button"
                            data-testid={`team-edit-${t.id}`}
                            title="Edit team"
                            onClick={(e) => handleEdit(e, t)}
                            className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          )}
                          {canWriteLabor && (
                          <button
                            type="button"
                            data-testid={`team-delete-${t.id}`}
                            title="Delete team"
                            onClick={(e) => handleDelete(e, t)}
                            className="p-1.5 rounded-md border border-red-200 text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && <EmptyState query={search} label="teams" />}
            </div>
          </SectionCard>
        )}
      </div>
    </>
  );
};

export default Labor;
