/** Helpers for FleetOps maintenance API payloads (polymorphic relations). */

/** Canonical polymorphic type strings for FleetOps models (PolymorphicType cast). */
export const FLEETOPS_MORPH = {
  vehicle: "fleet-ops:vehicle",
  equipment: "fleet-ops:equipment",
  vendor: "fleet-ops:vendor",
};

/** Map form short type (vehicle/equipment/vendor) to API morph type. */
export function toMorphType(shortOrMorph) {
  if (!shortOrMorph) return FLEETOPS_MORPH.vehicle;
  const value = String(shortOrMorph);
  if (value.includes(":")) return value;
  const key = value.toLowerCase();
  return FLEETOPS_MORPH[key] || `fleet-ops:${key}`;
}

export function shortMorphType(morphOrShort) {
  const value = String(morphOrShort || "vehicle").toLowerCase();
  if (value.includes("equipment")) return "equipment";
  if (value.includes("vendor")) return "vendor";
  return "vehicle";
}

export const SUBJECT_TYPES = [
  { value: "vehicle", label: "Vehicle" },
  { value: "equipment", label: "Equipment" },
];

export const SCHEDULE_STATUSES = [
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "inactive", label: "Inactive" },
];

export const INTERVAL_UNITS = [
  { value: "days", label: "Days" },
  { value: "weeks", label: "Weeks" },
  { value: "months", label: "Months" },
  { value: "years", label: "Years" },
];

export const PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export const WORK_ORDER_STATUSES = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "closed", label: "Closed" },
  { value: "canceled", label: "Canceled" },
];

export function resolvePolymorphicUuid(raw, typeKey, uuidKey) {
  if (!raw) return { type: "vehicle", uuid: "" };
  const type =
    raw[typeKey] ||
    raw.subject?.type ||
    raw.target?.type ||
    raw.maintainable?.type ||
    (raw.subject_type || raw.target_type || raw.maintainable_type || "vehicle")
      .toString()
      .split("\\")
      .pop()
      ?.toLowerCase() ||
    "vehicle";
  const uuid =
    raw[uuidKey] ||
    raw.subject_uuid ||
    raw.target_uuid ||
    raw.maintainable_uuid ||
    raw.subject?.uuid ||
    raw.target?.uuid ||
    raw.maintainable?.uuid ||
    "";
  return { type: shortMorphType(type), uuid: String(uuid || "") };
}

export function parseReminderOffsets(value) {
  if (Array.isArray(value)) return value;
  if (!value || !String(value).trim()) return [];
  return String(value)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => ({ days_before: Number(s) || 0 }))
    .filter((o) => o.days_before > 0);
}

export function formatReminderOffsets(raw) {
  const arr = Array.isArray(raw) ? raw : [];
  return arr
    .map((o) => o?.days_before ?? o?.daysBefore ?? o)
    .filter((n) => Number(n) > 0)
    .join(", ");
}

export function parseChecklist(text) {
  if (!text || !String(text).trim()) return [];
  return String(text)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((label) => ({ label, completed: false }));
}

export function formatChecklist(raw) {
  const arr = Array.isArray(raw) ? raw : [];
  return arr.map((item) => (typeof item === "string" ? item : item?.label || "")).filter(Boolean).join("\n");
}

export function subjectLabel(raw) {
  const sub = raw?.subject || raw?.target || raw?.maintainable;
  return (
    sub?.name ||
    sub?.display_name ||
    sub?.plate_number ||
    raw?.subject_name ||
    raw?.target_name ||
    raw?.maintainable_name ||
    "—"
  );
}

export function assigneeLabel(raw) {
  const a = raw?.assignee || raw?.default_assignee || raw?.defaultAssignee || raw?.performed_by || raw?.performedBy;
  return a?.name || raw?.assignee_name || raw?.default_assignee_name || raw?.performed_by_name || "—";
}

export function warrantyValuesFromApi(raw) {
  if (!raw) return {};
  const { type, uuid } = resolvePolymorphicUuid(raw, "subject_type", "subject_uuid");
  return {
    provider: raw.provider || "",
    policyNumber: raw.policy_number || "",
    startDate: raw.start_date ? String(raw.start_date).slice(0, 10) : "",
    endDate: raw.end_date ? String(raw.end_date).slice(0, 10) : "",
    coverage: typeof raw.coverage === "object" ? JSON.stringify(raw.coverage) : raw.coverage || "",
    terms: raw.terms || "",
    subjectType: type,
    subjectUuid: uuid,
    vendorUuid: String(raw.vendor_uuid || raw.vendor?.uuid || ""),
  };
}

function omitEmpty(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined && value !== null && value !== ""),
  );
}

function jsonFieldOrUndefined(value) {
  if (value == null || value === "") return undefined;
  if (typeof value === "object") return value;
  const text = String(value).trim();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export function warrantyPayload(values) {
  return omitEmpty({
    provider: values.provider,
    policy_number: values.policyNumber,
    start_date: values.startDate,
    end_date: values.endDate,
    coverage: jsonFieldOrUndefined(values.coverage),
    terms: jsonFieldOrUndefined(values.terms),
    subject_type: values.subjectUuid ? toMorphType(values.subjectType) : undefined,
    subject_uuid: values.subjectUuid,
    vendor_uuid: values.vendorUuid,
  });
}
