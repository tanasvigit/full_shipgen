/** Map FleetOps custom-field UI values to core-api `/custom-fields` payloads. */

export function normalizeEntityFor(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/^fleet-ops:/, "")
    .replace(/^fleet_ops:/, "");
}

export function toCustomFieldMorphType(entityType) {
  const value = String(entityType || "").trim();
  if (!value) return "";
  if (value.includes(":")) return value;
  return `fleet-ops:${value.toLowerCase()}`;
}

export function customFieldMatchesEntity(field, entityType) {
  const want = normalizeEntityFor(entityType);
  if (!want) return false;
  const got = normalizeEntityFor(field?.for || field?.subject_type || field?.entity_type || field?.entityType);
  return got === want;
}

export function slugifyCustomFieldName(label) {
  return String(label || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function normalizeCustomFieldPayload(formValues = {}) {
  const label = String(formValues.label || formValues.name || "").trim();
  const name = String(formValues.name || slugifyCustomFieldName(label) || "").trim();
  const forEntity = formValues.for || formValues.entity_type || formValues.entityType;
  const type = formValues.type || formValues.field_type;

  const payload = {
    label,
    name: name || undefined,
    for: forEntity ? normalizeEntityFor(forEntity) : undefined,
    type,
    description: formValues.description || undefined,
    category_uuid: formValues.category_uuid || formValues.categoryUuid || undefined,
    required: formValues.required,
    editable: formValues.editable,
    help_text: formValues.help_text || formValues.helpText || undefined,
    default_value: formValues.default_value ?? formValues.defaultValue,
    options: formValues.options,
  };

  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined) delete payload[key];
  });

  return payload;
}

/**
 * Core-api custom_fields rows require subject_uuid + subject_type (company-scoped templates per entity).
 */
export function buildCustomFieldApiPayload(formValues = {}, { companyUuid } = {}) {
  const base = normalizeCustomFieldPayload(formValues);
  const forEntity = base.for;

  if (!forEntity) {
    throw new Error("Entity type is required for custom fields.");
  }
  if (!companyUuid) {
    throw new Error("Organization context is required to manage custom fields.");
  }

  return {
    ...base,
    company_uuid: companyUuid,
    subject_uuid: base.category_uuid || companyUuid,
    subject_type: toCustomFieldMorphType(forEntity),
  };
}

export function mapCustomFieldGroupRow(row = {}) {
  const entityType =
    row?.meta?.entity_type ||
    row?.meta?.entityType ||
    (Array.isArray(row?.tags) ? row.tags[0] : null) ||
    row?.entity_type ||
    row?.entityType ||
    "";

  return {
    ...row,
    entity_type: entityType,
    entityType,
  };
}

export function buildCustomFieldGroupPayload(values = {}) {
  const name = String(values.name || "").trim();
  const entityType = values.entity_type || values.entityType || "order";

  return {
    category: {
      name,
      for: "custom_field_group",
      meta: { entity_type: entityType },
    },
    name,
    for: "custom_field_group",
    meta: { entity_type: entityType },
  };
}
