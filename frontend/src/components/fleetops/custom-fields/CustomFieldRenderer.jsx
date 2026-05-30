import { resolveCustomFieldRenderer } from "@/lib/fleetops/customFieldRegistry";
import { Input } from "@/components/ui/input";

export default function CustomFieldRenderer({ field, value, onChange }) {
  const custom = resolveCustomFieldRenderer(field?.field_type);
  if (custom) return custom({ field, value, onChange });

  if (field?.field_type === "number") {
    return (
      <Input
        type="number"
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
        data-testid={`custom-field-input-${field?.name || "unknown"}`}
      />
    );
  }

  return (
    <Input
      value={value ?? ""}
      onChange={(e) => onChange?.(e.target.value)}
      data-testid={`custom-field-input-${field?.name || "unknown"}`}
    />
  );
}
