import type { ReportsSectionErrors } from '../../utils/reportErrors';

type ReportsStatusBannerProps = {
  refreshing?: boolean;
  sectionErrors?: ReportsSectionErrors;
  emptyHint?: string | null;
};

const SECTION_LABELS: Record<keyof ReportsSectionErrors, string> = {
  revenue: 'Revenue',
  traffic: 'Traffic',
  occupancy: 'Category / occupancy',
};

export default function ReportsStatusBanner({
  refreshing = false,
  sectionErrors = {},
  emptyHint = null,
}: ReportsStatusBannerProps) {
  const entries = (Object.keys(sectionErrors) as Array<keyof ReportsSectionErrors>).filter(
    (key) => sectionErrors[key],
  );

  if (!refreshing && entries.length === 0 && !emptyHint) {
    return null;
  }

  return (
    <div className="space-y-2">
      {refreshing && (
        <p className="text-sm text-slate-500 flex items-center gap-2" data-testid="reports-refreshing">
          <span
            className="inline-block h-3.5 w-3.5 rounded-full border-2 border-slate-300 border-t-[#ea1c26] animate-spin"
            aria-hidden
          />
          Updating report data…
        </p>
      )}
      {entries.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 space-y-1">
          <p className="font-medium">Some sections could not be refreshed</p>
          <ul className="list-disc list-inside text-amber-800">
            {entries.map((key) => (
              <li key={key}>
                {SECTION_LABELS[key]}: {sectionErrors[key]}
              </li>
            ))}
          </ul>
        </div>
      )}
      {emptyHint && (
        <p className="text-sm text-slate-500" data-testid="reports-empty-hint">
          {emptyHint}
        </p>
      )}
    </div>
  );
}
