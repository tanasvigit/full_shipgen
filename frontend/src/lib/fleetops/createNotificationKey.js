/**
 * Mirrors @fleetbase/ember-core/utils/create-notification-key (Ember notifications settings).
 */
function camelize(str) {
  const s = String(str || "");
  return s
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ""))
    .replace(/^./, (c) => c.toLowerCase());
}

export function createNotificationKey(definition, name) {
  const withoutSlashes = String(definition || "").replace(/[\W_]+/g, "");
  return `${camelize(withoutSlashes)}__${camelize(name)}`;
}
