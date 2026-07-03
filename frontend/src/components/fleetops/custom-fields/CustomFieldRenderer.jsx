import { resolveCustomFieldRenderer } from "@/lib/fleetops/customFieldRegistry";
import { Input } from "@/components/ui/input";

export default function CustomFieldRenderer({ field, value, onChange }) {
  const fieldType = field?.type || field?.field_type;
  const custom = resolveCustomFieldRenderer(fieldType);
  if (custom) return custom({ field, value, onChange });

  if (fieldType === "number") {
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
