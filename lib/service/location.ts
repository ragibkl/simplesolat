import * as Location from "expo-location";
import { AppState } from "react-native";

async function hasLocationPermissions(): Promise<boolean> {
  const fg = await Location.getForegroundPermissionsAsync();
  if (fg.status !== "granted") {
    return false;
  }

  if (AppState.currentState !== "active") {
    const bg = await Location.getBackgroundPermissionsAsync();
    if (bg.status !== "granted") {
      return false;
    }
  }

  return true;
}

export type GetLocationOptions = {
  // iOS woke the app because the user left the travel geofence. With
  // "Always" permission, iOS allows one location reading in that wake-up,
  // even though continuous background location isn't enabled.
  woken?: boolean;
};

export async function getLocation(
  options: GetLocationOptions = {},
): Promise<Location.LocationObject | null> {
  try {
    const permission = await hasLocationPermissions();
    if (!permission) {
      return null;
    }

    const enabled = await Location.hasServicesEnabledAsync();
    if (!enabled) {
      return null;
    }

    if (AppState.currentState !== "active" && !options.woken) {
      const bgEnabled = await Location.isBackgroundLocationAvailableAsync();
      if (!bgEnabled) {
        return null;
      }
    }

    const lastKnown = await Location.getLastKnownPositionAsync({
      // After travelling, an old position would be the previous zone's.
      maxAge: (options.woken ? 2 : 15) * 60 * 1000,
      requiredAccuracy: 3000,
    });
    if (lastKnown) {
      return lastKnown;
    }

    return await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Lowest,
    });
  } catch (e) {
    return null;
  }
}
