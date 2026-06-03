/** Role/policy scheme types (Ember `iam.schemeTypes`). */
export const IAM_SCHEME_TYPES = [
  { id: "flb-managed", name: "FLB Managed" },
  { id: "org-managed", name: "Organization Managed" },
];

export function schemeTypeLabel(idOrLabel) {
  const hit = IAM_SCHEME_TYPES.find((t) => t.id === idOrLabel);
  return hit?.name || idOrLabel || "—";
}
