import { memo } from "react";
import PageLoaderOverlay from "@/components/loaders/overlays/PageLoaderOverlay";
import SectionLoaderOverlay from "@/components/loaders/overlays/SectionLoaderOverlay";
import {
  TableSkeleton,
  CardSkeleton,
  DetailSkeleton,
  ListSkeleton,
  WidgetSkeleton,
  TimelineSkeleton,
  ChartSkeleton,
} from "@/components/loaders/Skeleton/LoaderSkeleton";

export const PageLoader = memo(function PageLoader({
  loading,
  message = "Loading…",
  skeleton = "detail",
  children,
  testId = "page-loader",
}) {
  if (loading && skeleton === "detail") {
    return <DetailSkeleton testId={`${testId}-skeleton`} />;
  }
  if (loading && skeleton === "table") {
    return <TableSkeleton testId={`${testId}-skeleton`} />;
  }
  if (loading && skeleton === "cards") {
    return <CardSkeleton testId={`${testId}-skeleton`} />;
  }

  return (
    <PageLoaderOverlay loading={loading} message={message} testId={testId}>
      {children}
    </PageLoaderOverlay>
  );
});

export const TableLoader = memo(function TableLoader({
  loading,
  message,
  children,
  testId = "table-loader",
  useSkeleton = true,
}) {
  if (loading && useSkeleton && !children) {
    return <TableSkeleton testId={`${testId}-skeleton`} />;
  }

  return (
    <div className="relative" data-testid={testId}>
      {children}
      <SectionLoaderOverlay loading={loading} message={message} testId={`${testId}-overlay`} />
    </div>
  );
});

export const CardLoader = memo(function CardLoader({ loading, children, testId = "card-loader" }) {
  return (
    <div className="relative" data-testid={testId}>
      {children}
      <SectionLoaderOverlay loading={loading} compact testId={`${testId}-overlay`} />
    </div>
  );
});

export const ListLoader = memo(function ListLoader({ loading, rows, testId = "list-loader" }) {
  if (loading) return <ListSkeleton rows={rows} testId={`${testId}-skeleton`} />;
  return null;
});

export const WidgetLoader = memo(function WidgetLoader({ loading, testId = "widget-loader" }) {
  if (loading) return <WidgetSkeleton testId={testId} />;
  return null;
});

export const DashboardMetricsLoader = memo(function DashboardMetricsLoader({ loading }) {
  if (!loading) return null;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6" data-testid="dashboard-metrics-loader">
      {Array.from({ length: 4 }).map((_, i) => (
        <WidgetSkeleton key={i} testId={`widget-skeleton-${i}`} />
      ))}
    </div>
  );
});

export const TimelineLoader = memo(function TimelineLoader({ loading }) {
  if (!loading) return null;
  return <TimelineSkeleton testId="timeline-loader" />;
});

export const ChartLoader = memo(function ChartLoader({ loading, children }) {
  if (loading) return <ChartSkeleton testId="chart-loader" />;
  return children;
});
