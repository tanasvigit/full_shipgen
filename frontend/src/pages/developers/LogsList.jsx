import { useCallback, useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import DataTable from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { developersService } from "@/services/developers";
import { mapApiLog } from "@/lib/mappers";
import { formatRelativeApiTime } from "@/lib/formatRelativeApiTime";
import { toast } from "sonner";

const METHODS = ["all", "GET", "POST", "PATCH", "DELETE"];

function statusColor(s) {
  if (s >= 500) return "bg-red-500/10 border-red-500/20 text-[#B91C1C]";
  if (s >= 400) return "bg-amber-500/10 border-amber-500/20 text-[#A16207]";
  return "bg-emerald-500/10 border-emerald-500/20 text-[#15803D]";
}

function toCsv(rows) {
  const headers = ["when", "method", "path", "status", "latency_ms", "api_key", "ip"];
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push(
      [
        JSON.stringify(r.time || ""),
        r.method,
        JSON.stringify(r.path || ""),
        r.status,
        r.latency,
        JSON.stringify(r.key || ""),
        JSON.stringify(r.ip || ""),
      ].join(","),
    );
  }
  return lines.join("\n");
}

export default function LogsList() {
  const [method, setMethod] = useState("all");
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await developersService.listApiRequestLogs({ limit: 500 });
      const mapped = raw.map((row) => {
        const m = mapApiLog(row);
        return {
          ...m,
          time: formatRelativeApiTime(m.at),
        };
      });
      setLogs(mapped);
    } catch (err) {
      toast.error(err?.friendlyMessage || "Failed to load request logs.");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const filtered = useMemo(() => {
    if (method === "all") return logs;
    return logs.filter((l) => l.method === method);
  }, [logs, method]);

  const columns = [
    { key: "time", header: "When", render: (r) => <span className="font-mono text-xs text-[#374151]">{r.time}</span> },
    {
      key: "method",
      header: "Method",
      sortable: true,
      render: (r) => (
        <span
          className={`text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-sm border ${
            r.method === "GET"
              ? "bg-blue-500/10 border-blue-500/20 text-[#0066FF]"
              : r.method === "POST"
                ? "bg-emerald-500/10 border-emerald-500/20 text-[#15803D]"
                : r.method === "PATCH"
                  ? "bg-amber-500/10 border-amber-500/20 text-[#A16207]"
                  : "bg-red-500/10 border-red-500/20 text-[#B91C1C]"
          }`}
        >
          {r.method}
        </span>
      ),
    },
    { key: "path", header: "Path", render: (r) => <span className="font-mono text-xs text-[#1F2937]">{r.path}</span> },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (r) => (
        <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-sm border ${statusColor(r.status)}`}>
          {r.status}
        </span>
      ),
    },
    {
      key: "latency",
      header: "Latency",
      sortable: true,
      render: (r) => (
        <span
          className={`font-mono text-xs tabular ${r.latency > 1000 ? "text-[#B91C1C]" : r.latency > 500 ? "text-[#A16207]" : "text-[#1F2937]"}`}
        >
          {r.latency}ms
        </span>
      ),
    },
    { key: "key", header: "API key", render: (r) => <span className="font-mono text-[10px] text-[#4B5563]">{r.key}</span> },
    { key: "ip", header: "IP", render: (r) => <span className="font-mono text-[10px] text-[#4B5563]">{r.ip}</span> },
  ];

  function exportCsv() {
    try {
      const blob = new Blob([toCsv(filtered)], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `api-request-logs-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Exported as CSV");
    } catch {
      toast.error("Export failed");
    }
  }

  return (
    <div data-testid="logs-list-page">
      <PageHeader
        breadcrumbs={[{ label: "Developers", to: "/developers" }, { label: "Request Logs" }]}
        overline="Inspect"
        title="Request Logs"
        description={loading ? "Loading…" : `${filtered.length} API requests captured`}
        actions={
          <Button
            onClick={exportCsv}
            variant="outline"
            disabled={!filtered.length}
            className="bg-transparent border-black/[0.08] hover:bg-[#F1F2F5] text-[#1F2937]"
            data-testid="logs-export"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" /> Export CSV
          </Button>
        }
      />
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          {METHODS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMethod(m)}
              data-testid={`logs-method-${m}`}
              className={`px-2.5 h-7 text-[11px] font-mono uppercase tracking-wider rounded-sm border ${
                method === m ? "bg-blue-600/10 border-blue-500/40 text-[#0066FF]" : "bg-white border-black/[0.08] text-[#374151] hover:bg-[#F1F2F5]"
              }`}
            >
              {m === "all" ? "All" : m}
            </button>
          ))}
        </div>
        {!loading && logs.length === 0 && (
          <div className="text-sm text-[#4B5563]" data-testid="logs-empty">
            No API request logs returned.
          </div>
        )}
        <DataTable testid="logs-table" columns={columns} data={filtered} searchKeys={["path", "key", "ip"]} pageSize={15} />
      </div>
    </div>
  );
}
