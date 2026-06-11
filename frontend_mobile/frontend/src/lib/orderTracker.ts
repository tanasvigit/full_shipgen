import type { MapCoordinate } from "@/src/maps/markers";
import { placeCoordinate } from "@/src/lib/placeCoordinates";

export type OrderTrackerSummary = {
  driverCoordinate: MapCoordinate | null;
  currentDestinationEta: string | null;
  completionEta: string | null;
  progressPercent: number | null;
  estimatedCompletion: string | null;
};

export type GeofenceEventRow = {
  id: string;
  label: string;
  occurredAt: string;
  geofenceName: string;
};

function readRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

/** Normalize tracker API payloads (direct body or wrapped). */
export function unwrapTrackerPayload(payload: unknown): Record<string, unknown> | null {
  const root = readRecord(payload);
  if (!root) return null;
  if (root.driver_current_location !== undefined || root.progress_percentage !== undefined) {
    return root;
  }
  const nested =
    readRecord(root.tracker) ??
    readRecord(root.data) ??
    readRecord(root.order);
  if (nested?.driver_current_location !== undefined || nested?.progress_percentage !== undefined) {
    return nested;
  }
  return root;
}

export function coordinateFromUnknown(value: unknown): MapCoordinate | null {
  return placeCoordinate(value);
}

export function formatEtaSeconds(seconds: unknown): string | null {
  const n = Number(seconds);
  if (!Number.isFinite(n) || n < 0) return null;
  if (n === 0) return "Arrived";
  if (n < 60) return "< 1 min";
  const mins = Math.round(n / 60);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem ? `${hrs}h ${rem}m` : `${hrs}h`;
}

export function parseTrackerSummary(payload: unknown): OrderTrackerSummary {
  const tracker = unwrapTrackerPayload(payload);
  if (!tracker) {
    return {
      driverCoordinate: null,
      currentDestinationEta: null,
      completionEta: null,
      progressPercent: null,
      estimatedCompletion: null,
    };
  }

  const progress = Number(tracker.progress_percentage);
  const estimatedCompletion =
    typeof tracker.estimated_completion_time_formatted === "string"
      ? tracker.estimated_completion_time_formatted
      : null;

  return {
    driverCoordinate: coordinateFromUnknown(tracker.driver_current_location),
    currentDestinationEta: formatEtaSeconds(tracker.current_destination_eta),
    completionEta: formatEtaSeconds(tracker.completion_eta),
    progressPercent: Number.isFinite(progress) ? progress : null,
    estimatedCompletion,
  };
}

/** Pick the best human-readable ETA from tracker + waypoint ETA payloads. */
export function resolveOrderEtaLabel(trackerPayload: unknown, etaPayload: unknown): string | null {
  const tracker = parseTrackerSummary(trackerPayload);
  if (tracker.currentDestinationEta) {
    return tracker.currentDestinationEta;
  }
  if (tracker.completionEta) {
    return tracker.completionEta;
  }
  if (tracker.estimatedCompletion) {
    return tracker.estimatedCompletion;
  }

  const etaRecord = readRecord(etaPayload);
  if (!etaRecord) return null;

  const direct =
    etaRecord.eta ??
    readRecord(etaRecord.data)?.eta ??
    etaRecord.duration ??
    etaRecord.time;
  if (typeof direct === "string" || typeof direct === "number") {
    return typeof direct === "number" ? formatEtaSeconds(direct) : direct;
  }
  if (direct && typeof direct === "object") {
    const obj = direct as Record<string, unknown>;
    if (typeof obj.text === "string") return obj.text;
    if (typeof obj.human === "string") return obj.human;
    if (obj.minutes != null) return `${obj.minutes} min`;
  }

  const waypointValues = Object.values(etaRecord).filter((v) => typeof v === "number") as number[];
  const positive = waypointValues.filter((v) => v >= 0);
  if (positive.length) {
    return formatEtaSeconds(Math.min(...positive));
  }

  return null;
}

export function resolveDriverCoordinate(
  localPoint: { latitude: number; longitude: number; capturedAt?: number } | null | undefined,
  trackerPayload: unknown,
  maxAgeMs = 90_000
): MapCoordinate | null {
  if (
    localPoint &&
    Number.isFinite(localPoint.latitude) &&
    Number.isFinite(localPoint.longitude) &&
    (!localPoint.capturedAt || Date.now() - localPoint.capturedAt <= maxAgeMs)
  ) {
    return { latitude: localPoint.latitude, longitude: localPoint.longitude };
  }
  return parseTrackerSummary(trackerPayload).driverCoordinate;
}

export function mapGeofenceEvents(events: unknown[], orderRef?: string): GeofenceEventRow[] {
  return (events || [])
    .map((raw) => {
      const event = readRecord(raw);
      if (!event) return null;

      const order = readRecord(event.order);
      if (orderRef) {
        const matches =
          String(order?.uuid || "") === orderRef ||
          String(order?.id || "") === orderRef;
        if (order && !matches) return null;
      }

      const geofence = readRecord(event.geofence);
      const eventType = String(event.event_type || "geofence.event");
      const action = eventType.replace(/^geofence\./, "").replace(/_/g, " ");
      const geofenceName = String(geofence?.name || "Geofence");

      return {
        id: String(event.id || event.uuid || `${geofenceName}-${event.occurred_at}`),
        label: `${action} · ${geofenceName}`,
        occurredAt: String(event.occurred_at || "—"),
        geofenceName,
      };
    })
    .filter(Boolean) as GeofenceEventRow[];
}
