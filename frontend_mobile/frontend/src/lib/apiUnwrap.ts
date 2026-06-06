type UnwrapOptions = {
  candidates?: string[];
};

export function unwrapList<T>(payload: any, candidatesOrOptions: string[] | UnwrapOptions = []) {
  const candidates = Array.isArray(candidatesOrOptions)
    ? candidatesOrOptions
    : candidatesOrOptions?.candidates || [];
  const keys = ["data", "records", "results", ...candidates];
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key] as T[];
  }
  if (Array.isArray(payload)) return payload as T[];
  return [];
}

export function unwrapEntity<T>(payload: any, candidatesOrOptions: string[] | UnwrapOptions = []) {
  const candidates = Array.isArray(candidatesOrOptions)
    ? candidatesOrOptions
    : candidatesOrOptions?.candidates || [];
  const keys = ["data", ...candidates];
  for (const key of keys) {
    if (payload?.[key] && typeof payload[key] === "object") return payload[key] as T;
  }
  if (payload && typeof payload === "object") return payload as T;
  return null;
}
