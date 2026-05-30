const detailRegistry = new Map();

export function registerDetailExtension(entityKey, tabConfig) {
  if (!entityKey || !tabConfig?.key) return;
  const list = detailRegistry.get(entityKey) || [];
  if (list.some((item) => item.key === tabConfig.key)) return;
  detailRegistry.set(entityKey, [...list, tabConfig].sort((a, b) => (a.order || 0) - (b.order || 0)));
}

export function getDetailExtensions(entityKey) {
  return detailRegistry.get(entityKey) || [];
}
