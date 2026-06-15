import { useEffect, useState } from "react";
import DetailFieldGrid from "@/components/fleetops/detail/DetailFieldGrid";
import { fleetopsService } from "@/services/fleetops";
import { customFieldValuesFromApi } from "@/lib/fleetops/customFieldValues";

export default function EntityCustomFieldsReadOnly({ entityType, entityApi }) {
  const [fields, setFields] = useState([]);
  const values = customFieldValuesFromApi(entityApi);

  useEffect(() => {
    let active = true;
    fleetopsService
      .listCustomFieldsForEntity(entityType)
      .then((rows) => {
        if (active) setFields((rows || []).filter((f) => (f.status || "active") === "active"));
      })
      .catch(() => {
        if (active) setFields([]);
      });
    return () => {
      active = false;
    };
  }, [entityType]);

  const gridFields = fields
    .map((field) => {
      const key = field.name || field.slug;
      const raw = values[key];
      if (raw == null || raw === "") return null;
      return { label: field.label || key, value: String(raw) };
    })
    .filter(Boolean);

  if (!gridFields.length) return null;

  return (
    <div className="bg-white border border-black/[0.08] rounded-md p-5" data-testid={`${entityType}-custom-fields-readonly`}>
      <div className="overline mb-3">Custom fields</div>
      <DetailFieldGrid fields={gridFields} columns={2} />
    </div>
  );
}
