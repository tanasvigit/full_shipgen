/** Map API custom_field_values array to form key/value object. */
export function customFieldValuesFromApi(raw) {
  const rows = raw?.custom_field_values || raw?.customFieldValues;
  if (!Array.isArray(rows)) return {};
  const out = {};
  for (const row of rows) {
    const key =
      row?.custom_field?.name ||
      row?.custom_field?.slug ||
      row?.customField?.name ||
      row?.name ||
      row?.slug;
    if (!key) continue;
    out[key] = row.value ?? row.content ?? row.text ?? "";
  }
  return out;
}
