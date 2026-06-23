import React, { useCallback, useEffect, useMemo, useState } from "react";
import TopBar from "../components/yms/TopBar";
import SectionCard from "../components/yms/SectionCard";
import StatusPill from "../components/yms/StatusPill";
import KpiCard from "../components/yms/KpiCard";
import ExportMenu from "../components/yms/ExportMenu";
import EmptyState from "../components/yms/EmptyState";
import QueueOverrideDialog from "../components/yms/QueueOverrideDialog";
import WeighTareDialog from "../components/yms/WeighTareDialog";
import queueApi from "../services/queueApi";
import ymsApi from "../services/ymsApi";
import { notifyYmsDataChanged } from "../services/gateManagementApi";
import {
  ListOrdered, Clock, IndianRupee, AlertTriangle, Shield, Activity,
} from "lucide-react";
import { useUI } from "../contexts/UIContext";
import { KPI_GRID_STANDARD } from "../lib/responsiveClasses";
import { matchesSearch } from "../utils/search";
import { toast } from "sonner";
import useOperationalAutoRefresh from "../hooks/useOperationalAutoRefresh";
import usePermissions from "../hooks/usePermissions";

const Q_FIELDS = [
  "plate", "transporter", "category", "material", "zone", "dockCode",
  "status", "displayStatus", "id", "detentionRisk", "queueAging",
];

const RiskBadge = ({ level }) => {
  const colors = {
    LOW: "bg-emerald-50 text-emerald-700 border-emerald-200",
    MEDIUM: "bg-amber-50 text-amber-800 border-amber-200",
    HIGH: "bg-orange-50 text-orange-800 border-orange-200",
    CRITICAL: "bg-red-50 text-red-800 border-red-200",
  };
  return (
    <span className={`inline-flex px-1.5 py-0.5 rounded-sm border text-[9px] font-bold uppercase tracking-wider ${colors[level] || colors.LOW}`}>
      {level}
    </span>
  );
};

const VirtualQueue = () => {
  const { openVehicle, search } = useUI();
  const { canWriteQueue, canCallVehicle } = usePermissions();
  const [queue, setQueue] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [overrideRow, setOverrideRow] = useState(null);
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [tareRow, setTareRow] = useState(null);
  const [tareOpen, setTareOpen] = useState(false);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const bundle = await queueApi.fetchQueueBundle();
      setQueue(bundle.entries);
      setSummary(bundle.summary);
    } catch (e) {
      setError(e.message || "Failed to load queue");
      toast.error(e.message || "Failed to load queue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  useOperationalAutoRefresh(loadQueue);

  const visible = useMemo(() => queue.filter((v) => matchesSearch(v, search, Q_FIELDS)), [queue, search]);
  const avgWait = summary?.avgWaitMin ?? (visible.length ? Math.round(visible.reduce((s, v) => s + v.waitingMin, 0) / visible.length) : 0);
  const totalDetention = summary?.totalDetentionCost ?? visible.reduce((s, v) => s + v.detentionCost, 0);

  const exportRows = visible.map((v) => ({
    rank: v.queueRank,
    plate: v.plate,
    transporter: v.transporter,
    category: v.category,
    material: v.material,
    waiting: `${v.waitingMin} min`,
    detention: v.detentionCost ? `Rs ${v.detentionCost.toLocaleString("en-IN")}` : "—",
    risk: v.detentionRisk,
    aging: v.queueAging,
    zone: v.zone,
    status: v.displayStatus,
    score: v.priorityScore,
  }));

  const openRow = (v) => {
    openVehicle({
      queueEntryId: v.queueEntryId,
      vehicleId: v.vehicleId,
      appointmentId: v.appointmentId,
      dockId: v.dockId,
      rowSnapshot: v,
      onQueueUpdated: loadQueue,
    });
  };

  return (
    <>
      <TopBar
        title="Virtual Queue"
        subtitle="Queue Priority Engine · live metrics · supervisor override"
        actions={
          <ExportMenu
            testId="queue-export"
            filename="YARDOS_Virtual_Queue"
            title="Virtual Queue Snapshot"
            subtitle={`${visible.length} vehicles · Avg wait ${avgWait} min`}
            columns={["Rank", "Plate", "Transporter", "Category", "Material", "Waiting", "Detention", "Risk", "Aging", "Zone", "Status", "Score"]}
            keys={["rank", "plate", "transporter", "category", "material", "waiting", "detention", "risk", "aging", "zone", "status", "score"]}
            rows={exportRows}
            meta={[
              { label: "In Queue", value: String(visible.length) },
              { label: "Avg Wait", value: `${avgWait} min` },
              { label: "Detention Cost", value: `Rs ${(totalDetention / 1000).toFixed(1)}K` },
              { label: "Ready to Call", value: String(summary?.readyToCall ?? 0) },
              { label: "Critical Wait", value: String(summary?.criticalWait ?? 0) },
            ]}
          />
        }
      />
      <div className="p-6 space-y-5">
        <div className={KPI_GRID_STANDARD}>
          <KpiCard testId="vq-total" label="In Queue" value={summary?.inQueue ?? visible.length} hint="active entries" icon={ListOrdered} />
          <KpiCard testId="vq-avg-wait" label="Avg Wait" value={`${avgWait}`} suffix="min" hint="across queue" icon={Clock} accent="warning" />
          <KpiCard testId="vq-detention" label="Detention Cost" value={`₹${(totalDetention / 1000).toFixed(1)}K`} hint="estimated exposure" icon={IndianRupee} accent="danger" />
          <KpiCard testId="vq-ready" label="Ready to Call" value={summary?.readyToCall ?? 0} hint="top priority waiting" icon={AlertTriangle} accent="info" />
        </div>

        <SectionCard testId="card-queue-engine" title="Queue Priority Engine" subtitle="Backend-calculated · recalculated on each refresh">
          <div className="flex flex-wrap items-center gap-3 text-[12px] text-slate-700">
            <Activity className="w-4 h-4 text-emerald-600" />
            <span>{summary?.engineNote || "Priority scores rank vehicles by business priority, wait time, detention exposure, dock availability, and vehicle category."}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-[10px]">
            <span className="px-2 py-1 bg-slate-100 rounded-sm font-mono-yms">High priority: {summary?.highPriority ?? 0}</span>
            <span className="px-2 py-1 bg-amber-50 text-amber-800 rounded-sm font-mono-yms">Critical wait: {summary?.criticalWait ?? 0}</span>
            <span className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-sm text-slate-600 inline-flex items-center gap-1">
              <Shield className="w-3 h-3" /> Override requires supervisor + reason
            </span>
          </div>
        </SectionCard>

        <SectionCard
          testId="card-queue-list"
          title="Queue Order"
          subtitle={search ? `${visible.length} matching` : "Sorted by priority score · click row for details"}
          padding="p-0"
        >
          {error && (
            <div className="px-4 py-2 text-xs font-semibold text-red-700 bg-red-50 border-b border-red-100">{error}</div>
          )}
          {loading && (
            <div className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-50 border-b border-slate-100">Loading live queue…</div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-[10px] uppercase tracking-wider text-slate-500">
                  <th className="text-left font-semibold px-3 py-2.5 w-12">Rank</th>
                  <th className="text-left font-semibold px-2 py-2.5">Vehicle</th>
                  <th className="text-left font-semibold px-2 py-2.5">Status</th>
                  <th className="text-left font-semibold px-2 py-2.5">Waiting</th>
                  <th className="text-left font-semibold px-2 py-2.5">Detention</th>
                  <th className="text-left font-semibold px-2 py-2.5">Risk</th>
                  <th className="text-left font-semibold px-2 py-2.5">Aging</th>
                  <th className="text-left font-semibold px-2 py-2.5">Tare</th>
                  <th className="text-right font-semibold px-2 py-2.5">Score</th>
                  <th className="text-right font-semibold px-4 py-2.5">Action</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((v) => (
                  <tr
                    key={v.id}
                    data-testid={`queue-row-${v.id}`}
                    onClick={() => openRow(v)}
                    className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                  >
                    <td className="px-3 py-2.5">
                      <span className={`font-mono-yms font-bold text-[13px] ${v.queueRank <= 3 ? "text-amber-600" : "text-slate-500"}`}>
                        {v.queueRank}
                      </span>
                    </td>
                    <td className="px-2 py-2.5">
                      <div className="font-mono-yms font-semibold text-slate-900">{v.plate}</div>
                      <div className="text-[10px] text-slate-500">{v.transporter}</div>
                    </td>
                    <td className="px-2 py-2.5">
                      <StatusPill status={v.displayStatus} />
                    </td>
                    <td className="px-2 py-2.5 font-mono-yms text-slate-700">{v.waitingMin} min</td>
                    <td className="px-2 py-2.5 font-mono-yms text-red-600 font-semibold">
                      {v.detentionCost ? `₹${v.detentionCost.toLocaleString("en-IN")}` : "—"}
                    </td>
                    <td className="px-2 py-2.5"><RiskBadge level={v.detentionRisk} /></td>
                    <td className="px-2 py-2.5">
                      <StatusPill status={v.queueAging === "NORMAL" ? "AVAILABLE" : v.queueAging} />
                    </td>
                    <td className="px-2 py-2.5 font-mono-yms text-slate-700">
                      {v.tareWeightKg != null ? `${Number(v.tareWeightKg).toLocaleString("en-IN")} kg` : "—"}
                    </td>
                    <td className="px-2 py-2.5 text-right">
                      <span className={`font-mono-yms font-bold text-base ${v.priorityScore >= 80 ? "text-red-600" : v.priorityScore >= 60 ? "text-amber-600" : "text-slate-700"}`}>
                        {v.priorityScore}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                      {(canWriteQueue || canCallVehicle) ? (
                      <div className="inline-flex items-center gap-1">
                        {canWriteQueue && (
                        <button
                          type="button"
                          data-testid={`tare-${v.id}`}
                          onClick={() => {
                            setTareRow(v);
                            setTareOpen(true);
                          }}
                          className="text-[10px] font-bold uppercase tracking-wider border border-sky-300 text-sky-800 px-2 py-1 rounded-sm hover:bg-sky-50"
                        >
                          Tare Weight
                        </button>
                        )}
                        {canWriteQueue && (
                        <button
                          type="button"
                          data-testid={`override-${v.id}`}
                          onClick={() => {
                            setOverrideRow(v);
                            setOverrideOpen(true);
                          }}
                          className="text-[10px] font-bold uppercase tracking-wider border border-amber-300 text-amber-800 px-2 py-1 rounded-sm hover:bg-amber-50"
                        >
                          Override
                        </button>
                        )}
                        {canCallVehicle && (
                        <button
                          type="button"
                          data-testid={`call-${v.id}`}
                          onClick={async () => {
                            try {
                              await ymsApi.callQueueEntry(v.queueEntryId);
                              notifyYmsDataChanged();
                              toast.success(`${v.plate} called in`);
                              await loadQueue();
                            } catch (e) {
                              toast.error(e.message || "Failed to call queue entry");
                            }
                          }}
                          disabled={!["WAITING", "READY_TO_CALL", "CHECKED_IN"].includes(v.displayStatus) && v.status !== "WAITING"}
                          className="text-[10px] font-bold uppercase tracking-wider bg-slate-900 text-white px-2 py-1 rounded-sm hover:bg-slate-800 disabled:opacity-40"
                        >
                          Call In
                        </button>
                        )}
                      </div>
                      ) : (
                      <span className="text-[10px] text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {visible.length === 0 && <EmptyState query={search} label="queued vehicles" />}
          </div>
        </SectionCard>
      </div>

      <QueueOverrideDialog
        open={overrideOpen}
        onOpenChange={setOverrideOpen}
        row={overrideRow}
        maxRank={queue.length}
        onApplied={loadQueue}
      />
      <WeighTareDialog
        open={tareOpen}
        onOpenChange={setTareOpen}
        row={tareRow}
        onRecorded={loadQueue}
      />
    </>
  );
};

export default VirtualQueue;
