import { ymsRequest } from "@/src/lib/ymsApi";

export type WeighingRecord = {
  queueEntryId: string;
  tareWeightKg?: number | null;
  grossWeightKg?: number | null;
  netWeightKg?: number | null;
};

export function formatWeightKg(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
  return `${Number(value).toLocaleString("en-IN")} kg`;
}

const WEIGHT_FIELD_KEYS = {
  tare: ["tare_weight_kg", "tareWeightKg"],
  gross: ["gross_weight_kg", "grossWeightKg"],
  net: ["net_weight_kg", "netWeightKg"],
} as const;

/** Read TW/GW/NW from queue API rows (snake_case or camelCase). */
export function readQueueWeightKg(
  queue: Record<string, unknown> | null | undefined,
  kind: keyof typeof WEIGHT_FIELD_KEYS,
): number | null {
  if (!queue) return null;
  for (const key of WEIGHT_FIELD_KEYS[kind]) {
    const raw = queue[key];
    if (raw === null || raw === undefined || raw === "") continue;
    const value = Number(raw);
    if (Number.isFinite(value)) return value;
  }
  return null;
}

export async function recordTareWeight(queueEntryId: string, weightKg: number) {
  return ymsRequest<WeighingRecord>(`/queue/entries/${queueEntryId}/tare-weight`, {
    method: "POST",
    body: { weight_kg: weightKg, created_by: "mobile-queue" },
  });
}

export async function recordGrossWeight(queueEntryId: string, weightKg: number) {
  return ymsRequest<WeighingRecord>(`/queue/entries/${queueEntryId}/gross-weight`, {
    method: "POST",
    body: { weight_kg: weightKg, created_by: "mobile-dock" },
  });
}
