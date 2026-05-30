const hookRegistry = new Map();

export function registerExtensionHook(hookName, handler) {
  if (!hookName || typeof handler !== "function") return;
  const list = hookRegistry.get(hookName) || [];
  if (list.includes(handler)) return;
  hookRegistry.set(hookName, [...list, handler]);
}

export async function runExtensionHook(hookName, payload) {
  const handlers = hookRegistry.get(hookName) || [];
  for (const handler of handlers) {
    await handler(payload);
  }
}
