import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";

import {
  refreshTravelGeofence,
  TRAVEL_GEOFENCE_TASK,
} from "@/lib/service/travelGeofence";
import { updateWaktuSolatAndWidgets } from "@/lib/service/waktuSolatWidget";

// iOS woke the app because the user left the travel circle: update the zone,
// reminders and widget, then draw a new circle around the new spot.
TaskManager.defineTask(TRAVEL_GEOFENCE_TASK, async ({ data, error }) => {
  if (error) return;
  const { eventType } = data as { eventType: Location.GeofencingEventType };
  if (eventType !== Location.GeofencingEventType.Exit) return;

  try {
    await updateWaktuSolatAndWidgets(true, true, { woken: true });
  } finally {
    await refreshTravelGeofence();
  }
});
