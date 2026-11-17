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

// Why the zone can't be checked right now, if it can't: location access
// not allowed, or the phone's location switched off.
export type LocationProblem = "denied" | "off";

export async function getLocationProblem(): Promise<LocationProblem | null> {
  try {
    const fg = await Location.getForegroundPermissionsAsync();
    if (fg.status !== "granted") return "denied";
    if (!(await Location.hasServicesEnabledAsync())) return "off";
    return null;
  } catch {
    return null;
  }
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

// A fix good enough to tell neighbouring zones apart (about 100 m), for
// when the cheap fix lands near a zone border or one of JAKIM's small special
// zones. Null if the user only allowed approximate location, or no fix comes
// in time.
const PRECISE_FIX_TIMEOUT_MS = 15_000;

export async function getPreciseLocation(
  options: GetLocationOptions = {},
): Promise<Location.LocationObject | null> {
  try {
    if (!(await hasLocationPermissions())) return null;
    const fg = await Location.getForegroundPermissionsAsync();
    if (fg.android?.accuracy === "coarse" || fg.ios?.accuracy === "reduced") {
      return null;
    }
    if (AppState.currentState !== "active" && !options.woken) {
      if (!(await Location.isBackgroundLocationAvailableAsync())) return null;
    }
    return await Promise.race([
      Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      }),
      new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), PRECISE_FIX_TIMEOUT_MS),
      ),
    ]);
  } catch {
    return null;
  }
}
