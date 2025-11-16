import * as Location from "expo-location";
import { Alert, AppState } from "react-native";

async function getLocationPermissions(): Promise<boolean> {
  try {
    const fgPermissionCurrent = await Location.getForegroundPermissionsAsync();
    if (fgPermissionCurrent.status !== "granted") {
      const fgPermission: Location.LocationPermissionResponse = await new Promise((resolve, _reject) => {
          Alert.alert(
            "Location Permission",
            "This app needs your location to determine which of the JAKIM prayer zones you're in, so it can display accurate prayer times for your area.",
            [
              {
                text: "Ok",
                style: "default",
                onPress: async () => {
                  const permission =
                    await Location.requestForegroundPermissionsAsync();
                  resolve(permission);
                },
              },
            ],
          );
        });
      if (fgPermission.status !== "granted") {
        return false;
      }
    }

    const bgPermissionCurrent = await Location.getBackgroundPermissionsAsync();
    if (bgPermissionCurrent.status !== "granted") {
      const bgPermission: Location.LocationPermissionResponse =
        await new Promise((resolve, _reject) => {
          Alert.alert(
            "Background Location Permission",
            "This app needs background location access to keep your prayer times widget updated with the correct JAKIM prayer zone as you move around Malaysia, even when the app is not open.",
            [
              {
                text: "Ok",
                style: "default",
                onPress: async () => {
                  const permission =
                    await Location.requestBackgroundPermissionsAsync();
                  resolve(permission);
                },
              },
            ],
          );
        });
      if (bgPermission.status !== "granted") {
        return false;
      }
    }

    return true;
  } catch (e) {
    console.log("Cannot get location permission", e);
    return false;
  }
}

export async function getLocation(
  fast: boolean = false,
): Promise<Location.LocationObject | null> {
  try {
    const permission = await getLocationPermissions();
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

    if (fast) {
      return await Location.getLastKnownPositionAsync();
    } else {
      return await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Lowest,
      });
    }
  } catch (e) {
    console.log("Cannot get location", e);
    return null;
  }
}
