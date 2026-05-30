import * as TaskManager from "expo-task-manager";
import * as Location from "expo-location";
import { uploadTrackPoint } from "@/src/tracking/uploader";
import { getRuntimeSession } from "@/src/runtime/session";

export const BACKGROUND_LOCATION_TASK = "fleetbase-background-location";

type BackgroundPayload = {
  locations?: Location.LocationObject[];
};

if (!TaskManager.isTaskDefined(BACKGROUND_LOCATION_TASK)) {
  TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
    if (error) return;
    const session = getRuntimeSession();
    if (!session?.companyUuid || !session.userId) return;

    const payload = data as BackgroundPayload;
    const latest = payload.locations?.[payload.locations.length - 1];
    if (!latest) return;

    const orderId = session.activeOrderId;
    if (!orderId) return;

    await uploadTrackPoint({
      companyUuid: session.companyUuid,
      userId: session.userId,
      orderId,
      point: {
        latitude: latest.coords.latitude,
        longitude: latest.coords.longitude,
        capturedAt: latest.timestamp,
      },
    });
  });
}

export async function startBackgroundTracking(orderId: string) {
  const foreground = await Location.requestForegroundPermissionsAsync();
  if (!foreground.granted) return false;

  const background = await Location.requestBackgroundPermissionsAsync();
  if (!background.granted) return false;

  const session = getRuntimeSession();
  if (session) {
    session.activeOrderId = orderId;
  }

  const started = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  if (started) return true;

  await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 30_000,
    distanceInterval: 25,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: "Fleetbase tracking active",
      notificationBody: "Sharing live trip location",
    },
  });

  return true;
}

export async function stopBackgroundTracking() {
  const started = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  if (!started) return;
  await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  const session = getRuntimeSession();
  if (session) {
    session.activeOrderId = undefined;
  }
}
