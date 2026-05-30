import { TrendingUp, TrendingDown } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area } from "recharts";
import { cn } from "@/lib/utils";

const ACCENTS = {
    blue:    { stroke: "#0066FF", glow: "rgba(0,102,255,0.30)" },
    cyan:    { stroke: "#0891B2", glow: "rgba(8,145,178,0.30)" },
    emerald: { stroke: "#16A34A", glow: "rgba(22,163,74,0.30)" },
    amber:   { stroke: "#EAB308", glow: "rgba(234,179,8,0.30)" },
    red:     { stroke: "#DC2626", glow: "rgba(220,38,38,0.30)" },
    violet:  { stroke: "#7C3AED", glow: "rgba(124,58,237,0.30)" },
};

export default function KpiCard({ label, value, delta, trend, series, accent = "cyan", testid, featured = false }) {
    const series_data = (series || []).map((v, i) => ({ i, v }));
    const a = ACCENTS[accent] || ACCENTS.cyan;
    const isUp = trend === "up";
    const gradId = `grad-${label.replace(/[^a-zA-Z0-9]/g, "")}`;

    return (
        <div
            className={cn(
                "group relative overflow-hidden rounded-xl p-5 flex flex-col transition-all duration-300",
                "bg-white border border-black/[0.06] hover:border-black/[0.14] shadow-[0_1px_0_rgba(255,255,255,1)_inset,0_2px_8px_-2px_rgba(10,14,26,0.04)] hover:shadow-[0_8px_24px_-8px_rgba(10,14,26,0.08)]",
                featured && "ring-1 ring-[#0066FF]/30",
            )}
            data-testid={testid || `kpi-${label}`}
        >
            {/* Accent corner glow */}
            <div
                className="absolute -top-12 -right-12 h-32 w-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl pointer-events-none"
                style={{ background: a.glow }}
            />

            {/* Top label row */}
            <div className="flex items-center justify-between gap-2 relative">
                <div className="overline">{label}</div>
                <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: a.stroke, boxShadow: `0 0 6px ${a.glow}` }}
                />
            </div>

            {/* Value + delta */}
            <div className="flex items-end justify-between gap-3 mt-3.5 relative">
                <div className="kpi-value text-[34px] tabular text-[#0A0E1A]">{value}</div>
                {delta && (
                    <div
                        className={cn(
                            "flex items-center gap-1 px-1.5 h-6 rounded-md text-[11px] font-mono font-semibold tabular",
                            isUp
                                ? "bg-[#16A34A]/[0.10] text-[#15803D] border border-[#16A34A]/25"
                                : "bg-[#DC2626]/[0.10] text-[#B91C1C] border border-[#DC2626]/25",
                        )}
                    >
                        {isUp ? <TrendingUp className="h-3 w-3" strokeWidth={2.25} /> : <TrendingDown className="h-3 w-3" strokeWidth={2.25} />}
                        {delta}
                    </div>
                )}
            </div>

            {/* Sparkline */}
            {series_data.length > 0 && (
                <div className="h-14 mt-4 -mx-1 relative">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <AreaChart data={series_data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                            <defs>
                                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={a.stroke} stopOpacity={0.4} />
                                    <stop offset="100%" stopColor={a.stroke} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Area
                                type="monotone"
                                dataKey="v"
                                stroke={a.stroke}
                                strokeWidth={1.75}
                                fill={`url(#${gradId})`}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Bottom accent bar */}
            <div
                className="absolute left-0 right-0 bottom-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: `linear-gradient(90deg, transparent, ${a.stroke}, transparent)` }}
            />
        </div>
    );
}
