import { useEffect, useState } from "react";
import FormSection from "@/components/fleetops/FormSection";
import { Label } from "@/components/ui/label";
import CustomFieldRenderer from "@/components/fleetops/custom-fields/CustomFieldRenderer";
import { fleetopsService } from "@/services/fleetops";

/**
 * Renders custom field definitions for an entity type on create/edit forms (G031).
 */
export default function EntityCustomFieldsBlock({ entityType, values = {}, onChange, testId }) {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const rows = await fleetopsService.listCustomFieldsForEntity(entityType).catch(() => []);
      if (active) {
        setFields(rows.filter((f) => (f.status || "active") === "active"));
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [entityType]);

  if (loading || fields.length === 0) return null;

  return (
    <FormSection title="Custom fields" collapsible testId={testId || `custom-fields-${entityType}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((field) => {
          const key = field.name || field.slug;
          return (
            <div key={field.uuid || field.id || key} className="space-y-1.5">
              <Label className="text-xs font-mono uppercase text-[#374151]">{field.label || key}</Label>
              <CustomFieldRenderer
                field={field}
                value={values[key]}
                onChange={(v) => onChange?.({ ...values, [key]: v })}
              />
            </div>
          );
        })}
      </div>
    </FormSection>
  );
}
