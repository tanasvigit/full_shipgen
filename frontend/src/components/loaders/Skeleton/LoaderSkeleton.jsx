import { cn } from "@/lib/utils";

export function Shimmer({ className }) {
  return (
    <div
      className={cn(
        "rounded-md bg-gradient-to-r from-black/[0.06] via-black/[0.04] to-black/[0.06]",
        "animate-pulse motion-reduce:animate-none",
        className,
      )}
      aria-hidden
    />
  );
}

export function TableSkeleton({ rows = 6, cols = 5, testId = "table-skeleton" }) {
  return (
    <div className="space-y-2 p-4" data-testid={testId} aria-busy="true" aria-label="Loading table">
      <div className="flex gap-3 mb-4">
        <Shimmer className="h-9 flex-1 max-w-xs" />
        <Shimmer className="h-9 w-24" />
      </div>
      <Shimmer className="h-10 w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3">
          {Array.from({ length: cols }).map((__, j) => (
            <Shimmer key={j} className="h-11 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ count = 3, testId = "card-skeleton" }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" data-testid={testId} aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border border-black/[0.08] rounded-md p-4 space-y-3 bg-white">
          <Shimmer className="h-5 w-2/3" />
          <Shimmer className="h-4 w-full" />
          <Shimmer className="h-4 w-4/5" />
          <Shimmer className="h-8 w-24 mt-2" />
        </div>
      ))}
    </div>
  );
}

export function DetailSkeleton({ testId = "detail-skeleton" }) {
  return (
    <div className="p-6 space-y-4" data-testid={testId} aria-busy="true">
      <Shimmer className="h-8 w-64" />
      <Shimmer className="h-4 w-96 max-w-full" />
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4 mt-6">
        <Shimmer className="h-80 w-full rounded-md" />
        <div className="space-y-3">
          <Shimmer className="h-32 w-full rounded-md" />
          <Shimmer className="h-32 w-full rounded-md" />
        </div>
      </div>
    </div>
  );
}

export function SidebarSkeleton({ testId = "sidebar-skeleton" }) {
  return (
    <div className="p-3 space-y-2 w-56" data-testid={testId} aria-busy="true">
      {Array.from({ length: 8 }).map((_, i) => (
        <Shimmer key={i} className="h-9 w-full" />
      ))}
    </div>
  );
}

export function ChartSkeleton({ testId = "chart-skeleton" }) {
  return (
    <div className="p-4 border border-black/[0.08] rounded-md bg-white" data-testid={testId} aria-busy="true">
      <Shimmer className="h-5 w-40 mb-4" />
      <Shimmer className="h-48 w-full rounded-md" />
    </div>
  );
}

export function ModalSkeleton({ testId = "modal-skeleton" }) {
  return (
    <div className="p-6 space-y-4" data-testid={testId} aria-busy="true">
      <Shimmer className="h-6 w-48" />
      <Shimmer className="h-4 w-full" />
      <Shimmer className="h-10 w-full" />
      <Shimmer className="h-10 w-full" />
      <div className="flex justify-end gap-2 pt-2">
        <Shimmer className="h-9 w-20" />
        <Shimmer className="h-9 w-24" />
      </div>
    </div>
  );
}

export function ListSkeleton({ rows = 5, testId = "list-skeleton" }) {
  return (
    <div className="divide-y divide-black/[0.06] border border-black/[0.08] rounded-md bg-white" data-testid={testId}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <Shimmer className="h-8 w-8 rounded-md shrink-0" />
          <div className="flex-1 space-y-2">
            <Shimmer className="h-4 w-1/3" />
            <Shimmer className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function WidgetSkeleton({ testId = "widget-skeleton" }) {
  return (
    <div className="border border-black/[0.08] rounded-md p-4 bg-white" data-testid={testId}>
      <Shimmer className="h-3 w-20 mb-2" />
      <Shimmer className="h-8 w-28" />
    </div>
  );
}

export function TimelineSkeleton({ testId = "timeline-skeleton" }) {
  return (
    <div className="space-y-4 p-4" data-testid={testId}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <Shimmer className="h-3 w-3 rounded-full mt-1 shrink-0" />
          <div className="flex-1 space-y-2">
            <Shimmer className="h-4 w-32" />
            <Shimmer className="h-3 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
