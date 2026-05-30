const marks = new Map<string, number>();

export function markStart(name: string) {
  marks.set(name, Date.now());
}

export function markEnd(name: string) {
  const start = marks.get(name);
  if (!start) return null;
  const durationMs = Date.now() - start;
  marks.delete(name);
  return durationMs;
}
