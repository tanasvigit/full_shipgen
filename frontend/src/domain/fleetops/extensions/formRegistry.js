const formRegistry = new Map();

export function registerFormExtension(entityKey, extension) {
  if (!entityKey || !extension?.key) return;
  const list = formRegistry.get(entityKey) || [];
  if (list.some((item) => item.key === extension.key)) return;
  formRegistry.set(entityKey, [...list, extension].sort((a, b) => (a.order || 0) - (b.order || 0)));
}

export function getFormExtensions(entityKey) {
  return formRegistry.get(entityKey) || [];
}
