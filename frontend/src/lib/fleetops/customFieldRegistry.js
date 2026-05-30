const registry = new Map();

export function registerCustomFieldRenderer(fieldType, renderFn) {
  if (!fieldType || typeof renderFn !== "function") return;
  registry.set(String(fieldType).toLowerCase(), renderFn);
}

export function resolveCustomFieldRenderer(fieldType) {
  return registry.get(String(fieldType || "").toLowerCase()) || null;
}

export function listCustomFieldRenderers() {
  return Array.from(registry.keys());
}
