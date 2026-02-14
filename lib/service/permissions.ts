import * as Location from "expo-location";
import notifee from "@notifee/react-native";
import { Alert } from "react-native";

export async function requestAllPermissions(): Promise<void> {
  try {
    // Foreground location
    const fgStatus = await Location.getForegroundPermissionsAsync();
    if (fgStatus.status !== "granted") {
      await new Promise<void>((resolve) => {
        Alert.alert(
          "Location Permission",
          "This app needs your location to determine which of the JAKIM prayer zones you're in, so it can display accurate prayer times for your area.",
          [
            {
              text: "Ok",
              style: "default",
              onPress: async () => {
                await Location.requestForegroundPermissionsAsync();
                resolve();
              },
            },
          ],
        );
      });
    }

    // Background location
    const bgStatus = await Location.getBackgroundPermissionsAsync();
    if (bgStatus.status !== "granted") {
      await new Promise<void>((resolve) => {
        Alert.alert(
          "Background Location Permission",
          "This app needs background location access to keep your prayer times widget updated with the correct JAKIM prayer zone as you move around Malaysia, even when the app is not open.",
          [
            {
              text: "Ok",
              style: "default",
              onPress: async () => {
                await Location.requestBackgroundPermissionsAsync();
                resolve();
              },
            },
          ],
        );
      });
    }

    // Notifications
    await notifee.requestPermission();
  } catch (e) {
    console.log("Error requesting permissions", e);
  }
}
