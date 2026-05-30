import ActivityTimeline from "@/components/activity/ActivityTimeline";

export default function OrderActivityPanel({ events, loading, live = false }) {
  return (
    <div className="bg-white border border-black/[0.08] rounded-md p-5">
      {live && (
        <div className="flex items-center gap-2 mb-3 text-[10px] font-mono uppercase tracking-wider text-emerald-700">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Live stream
        </div>
      )}
      <ActivityTimeline events={events} loading={loading} testId="order-activity-timeline" />
    </div>
  );
}
