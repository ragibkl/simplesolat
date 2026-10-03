import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { Platform } from "react-native";

import { getLocation } from "./location";

// iOS only: a circle around where the user is. Leaving it wakes the app (even
// when closed) so the zone, reminders and widget follow them when they travel.
// Android does this with its frequent background task instead.
export const TRAVEL_GEOFENCE_TASK = "travel-geofence";
const RADIUS_METRES = 5000;

export async function refreshTravelGeofence(
  location?: Location.LocationObject | null,
): Promise<void> {
  if (Platform.OS !== "ios") return;
  try {
    const bg = await Location.getBackgroundPermissionsAsync();
    if (!bg.granted) {
      if (await TaskManager.isTaskRegisteredAsync(TRAVEL_GEOFENCE_TASK)) {
        await Location.stopGeofencingAsync(TRAVEL_GEOFENCE_TASK);
      }
      return;
    }

    const here = location ?? (await getLocation({ woken: true }));
    if (!here) return;

    // Replaces the previous circle.
    await Location.startGeofencingAsync(TRAVEL_GEOFENCE_TASK, [
      {
        identifier: "travel",
        latitude: here.coords.latitude,
        longitude: here.coords.longitude,
        radius: RADIUS_METRES,
        notifyOnEnter: false,
        notifyOnExit: true,
      },
    ]);
  } catch (e) {
    console.log("travel geofence:", e);
  }
}
