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

export async function getLocation(): Promise<Location.LocationObject | null> {
  try {
    const permission = await hasLocationPermissions();
    if (!permission) {
      return null;
    }

    const enabled = await Location.hasServicesEnabledAsync();
    if (!enabled) {
      return null;
    }

    if (AppState.currentState !== "active") {
      const bgEnabled = await Location.isBackgroundLocationAvailableAsync();
      if (!bgEnabled) {
        return null;
      }
    }

    const lastKnown = await Location.getLastKnownPositionAsync({
      maxAge: 15 * 60 * 1000,
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
