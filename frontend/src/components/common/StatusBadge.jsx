import { cn } from "@/lib/utils";

const STATUS_TONE = {
    created: "neutral",
    dispatched: "info",
    en_route: "warning",
    delivered: "success",
    canceled: "danger",
    online: "success",
    offline: "neutral",
    on_break: "warning",
    active: "success",
    maintenance: "warning",
    out_of_service: "danger",
    paused: "warning",
    invited: "info",
    disabled: "neutral",
    paid: "success",
    pending: "warning",
    refunded: "neutral",
    urgent: "danger",
    high: "warning",
    medium: "info",
    low: "neutral",
    in_stock: "success",
    low_stock: "warning",
    out_of_stock: "danger",
    in_transit: "info",
    received: "success",
    draft: "neutral",
    approved: "info",
};

const TONE_CLASSES = {
    success: "bg-[#16A34A]/[0.10] text-[#15803D] border-[#16A34A]/25",
    info:    "bg-[#0066FF]/[0.10] text-[#0040CC] border-[#0066FF]/25",
    warning: "bg-[#EAB308]/[0.14] text-[#A16207] border-[#EAB308]/35",
    danger:  "bg-[#DC2626]/[0.10] text-[#B91C1C] border-[#DC2626]/25",
    neutral: "bg-black/[0.04] text-[#4B5563] border-black/[0.08]",
};

const DOT_CLASSES = {
    success: "bg-[#16A34A] shadow-[0_0_6px_rgba(22,163,74,0.5)]",
    info:    "bg-[#0066FF] shadow-[0_0_6px_rgba(0,102,255,0.5)]",
    warning: "bg-[#EAB308] shadow-[0_0_6px_rgba(234,179,8,0.5)]",
    danger:  "bg-[#DC2626] shadow-[0_0_6px_rgba(220,38,38,0.5)]",
    neutral: "bg-[#9CA3AF]",
};

export default function StatusBadge({ status, label, tone, dot = true, className }) {
    const t = tone || STATUS_TONE[status] || "neutral";
    const display = (label || status || "").toString().replace(/_/g, " ");
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono uppercase tracking-[0.14em] font-semibold border",
                TONE_CLASSES[t],
                className,
            )}
            data-testid={`status-${status}`}
        >
            {dot && <span className={cn("h-1.5 w-1.5 rounded-full", DOT_CLASSES[t])} />}
            {display}
        </span>
    );
}
