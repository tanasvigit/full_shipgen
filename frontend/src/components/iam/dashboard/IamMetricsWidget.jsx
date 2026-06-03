import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { iamService } from "@/services/iam";
import { useIamAbility } from "@/hooks/iam/useIamAbility";
import { t } from "@/i18n";
import PageLoaderOverlay from "@/components/loaders/overlays/PageLoaderOverlay";

function humanizeMetricKey(key) {
  return String(key || "")
    .replace(/_count$/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Ember `iam-metrics-widget` — GET /metrics/iam (G-IAM036).
 */
export default function IamMetricsWidget({ className = "" }) {
  const ability = useIamAbility();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const canSeeWidget =
    ability.canViewUser || ability.canViewRole || ability.canViewGroup || ability.canViewPolicy;

  useEffect(() => {
    if (!canSeeWidget) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError(false);
    iamService
      .getIamMetrics()
      .then((data) => {
        if (!active) return;
        setMetrics(data && typeof data === "object" ? data : {});
      })
      .catch(() => {
        if (active) {
          setMetrics(null);
          setError(true);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [canSeeWidget]);

  const cards = useMemo(() => {
    if (!metrics) return [];
    return Object.entries(metrics).map(([key, value]) => ({
      key,
      label: humanizeMetricKey(key),
      value: typeof value === "object" ? JSON.stringify(value) : value,
    }));
  }, [metrics]);

  if (!canSeeWidget) return null;

  return (
    <div
      className={`rounded-xl border border-black/[0.08] bg-white overflow-hidden ${className}`}
      data-testid="iam-metrics-widget"
    >
      <div className="flex flex-row items-center justify-between px-4 py-2 border-b border-black/[0.08] bg-[#F9FAFB]">
        <span className="text-sm font-semibold text-[#0A0E1A] flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[#0066FF]" strokeWidth={1.75} />
          {t("iam.widget.metrics.title", "IAM Metrics")}
        </span>
        <Link
          to="/iam"
          className="text-[11px] font-medium text-[#0066FF] hover:underline"
          data-testid="iam-metrics-manage-link"
        >
          {t("iam.widget.metrics.manage", "Manage IAM")}
        </Link>
      </div>
      <div className="p-4">
        <PageLoaderOverlay loading={loading} message="" testId="iam-metrics-loader">
          {error && !loading && (
            <p className="text-xs text-[#6B7280]" data-testid="iam-metrics-error">
              {t("iam.widget.metrics.error", "Could not load IAM metrics.")}
            </p>
          )}
          {!error && !loading && cards.length === 0 && (
            <p className="text-xs text-[#6B7280]">{t("iam.widget.metrics.empty", "No metrics available.")}</p>
          )}
          {!loading && cards.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {cards.map((card) => (
                <div key={card.key} className="rounded-md border border-black/[0.08] bg-[#F9FAFB] p-3 h-full">
                  <div className="text-[10px] uppercase tracking-wider text-[#6B7280] font-mono">{card.label}</div>
                  <div
                    className="text-xl font-semibold text-[#0A0E1A] tabular mt-1"
                    data-testid={`iam-metric-${card.key}`}
                  >
                    {card.value ?? "—"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </PageLoaderOverlay>
      </div>
    </div>
  );
}
