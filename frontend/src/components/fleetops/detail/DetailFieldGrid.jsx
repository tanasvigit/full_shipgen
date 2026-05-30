/**
 * Dense operational field grid for drawer overview tabs.
 * @param {{ fields: Array<{ label: string, value: React.ReactNode, mono?: boolean, testId?: string }> }} props
 */
export default function DetailFieldGrid({ fields = [], columns = 2 }) {
  const colClass =
    columns === 3 ? "sm:grid-cols-3" : columns === 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2";

  return (
    <div className={`grid grid-cols-1 ${colClass} gap-3`}>
      {fields.map((field) => (
        <div key={field.label} data-testid={field.testId}>
          <div className="overline">{field.label}</div>
          <div
            className={`text-sm text-[#0A0E1A] mt-1 ${field.mono ? "font-mono text-xs" : ""}`}
          >
            {field.value ?? "—"}
          </div>
        </div>
      ))}
    </div>
  );
}
