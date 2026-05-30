import ActivityItem from "./ActivityItem";
import EmptyState from "@/components/common/EmptyState";
import { TimelineSkeleton } from "@/components/loaders";
import { History } from "lucide-react";

export default function ActivityTimeline({ events = [], loading = false, testId = "activity-timeline" }) {
  if (loading) return <TimelineSkeleton testId={`${testId}-skeleton`} />;

  if (!events.length) {
    return (
      <EmptyState
        testId={`${testId}-empty`}
        icon={History}
        title="No activity yet"
        description="Status changes, dispatches, and uploads will appear here as the order progresses."
      />
    );
  }

  return (
    <div className="relative pl-1" data-testid={testId} aria-live="polite">
      <div className="absolute left-4 top-2 bottom-2 w-px bg-black/[0.08]" aria-hidden />
      {events.map((event) => (
        <ActivityItem key={event.id} event={event} />
      ))}
    </div>
  );
}
