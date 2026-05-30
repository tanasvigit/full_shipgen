import KpiCard from "@/components/common/KpiCard";
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, Cell } from "recharts";

const STATUS_COLORS = {
  created: "#64748B",
  dispatched: "#0066FF",
  en_route: "#7C3AED",
  delivered: "#059669",
  completed: "#059669",
  canceled: "#DC2626",
  delayed: "#EA580C",
  failed: "#B91C1C",
};

export default function OperationalMetricsStrip({ metrics, loading, testId = "ops-metrics-strip" }) {
  if (loading && !metrics) {
    return (
      <div className="space-y-3" data-testid={testId}>
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-3 animate-pulse" data-testid={`${testId}-loading`}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-white/60 border border-black/[0.06]" />
        ))}
      </div>
      </div>
    );
  }

  if (!metrics) {
    return <div data-testid={testId} className="text-sm text-[#4B5563]">No operational data yet.</div>;
  }

  const chartData = (metrics.ordersByStatus || []).slice(0, 6);

  const cards = [
    { id: "active", label: "Active orders", value: metrics.activeOrders, accent: "cyan" },
    { id: "delayed", label: "Delayed / failed", value: metrics.delayedOrders, accent: "amber" },
    { id: "today", label: "Completed today", value: metrics.completedToday, accent: "emerald" },
    { id: "drivers", label: "Drivers online", value: metrics.activeDrivers, accent: "cyan" },
    { id: "sla", label: "SLA risk", value: metrics.slaRisk, accent: "amber" },
    { id: "failed", label: "Failed deliveries", value: metrics.failedDeliveries, accent: "amber" },
    {
      id: "avg",
      label: "Avg delivery (h)",
      value: metrics.avgDeliveryHours ?? "—",
      accent: "emerald",
    },
    { id: "util", label: "Driver util. %", value: `${metrics.driverUtilization}%`, accent: "cyan" },
  ];

  return (
    <div className="space-y-3" data-testid={testId}>
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-3">
        {cards.map((c) => (
          <KpiCard
            key={c.id}
            label={c.label}
            value={c.value}
            trend="neutral"
            accent={c.accent}
            testid={`${testId}-${c.id}`}
          />
        ))}
      </div>
      {chartData.length > 0 && (
        <div className="bg-white border border-black/[0.08] rounded-xl p-4 h-36" data-testid={`${testId}-status-chart`}>
          <div className="overline mb-2">Orders by status</div>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <XAxis dataKey="status" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                formatter={(v) => [v, "Orders"]}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {chartData.map((entry) => (
                  <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || "#94A3B8"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
