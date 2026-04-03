import * as Location from "expo-location";
import notifee, { AndroidNotificationSetting } from "@notifee/react-native";
import { Alert, Platform } from "react-native";

export async function requestAllPermissions(): Promise<void> {
  // Foreground location
  try {
    const fgStatus = await Location.getForegroundPermissionsAsync();
    if (fgStatus.status !== "granted") {
      await new Promise<void>((resolve) => {
        Alert.alert(
          "Location Permission",
          "This app needs your location to determine your prayer zone and display accurate prayer times for your area.",
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
  } catch {
    Alert.alert(
      "Location Error",
      "Failed to request location permission. Prayer zone detection may not work.",
    );
  }

  // Background location
  try {
    const bgStatus = await Location.getBackgroundPermissionsAsync();
    if (bgStatus.status !== "granted") {
      await new Promise<void>((resolve) => {
        Alert.alert(
          "Background Location Permission",
          "This app needs background location access to keep your prayer times and widgets updated as you travel, even when the app is not open.",
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
  } catch {
    Alert.alert(
      "Background Location Error",
      "Failed to request background location permission. Widgets may not update automatically.",
    );
  }

  // Notifications
  try {
    await notifee.requestPermission();
  } catch {
    Alert.alert(
      "Notification Error",
      "Failed to initialize notifications. Prayer time alerts may not work. Please restart the app or reinstall if the issue persists.",
    );
  }

  // Exact alarms (Android 12+)
  try {
    if (Platform.OS === "android") {
      const settings = await notifee.getNotificationSettings();
      if (settings.android.alarm !== AndroidNotificationSetting.ENABLED) {
        await new Promise<void>((resolve) => {
          Alert.alert(
            "Exact Alarm Permission",
            "This app needs exact alarm permission to notify you precisely when each prayer time begins.",
            [
              {
                text: "Skip",
                style: "cancel",
                onPress: () => resolve(),
              },
              {
                text: "Ok",
                style: "default",
                onPress: async () => {
                  await notifee.openAlarmPermissionSettings();
                  resolve();
                },
              },
            ],
          );
        });
      }
    }
  } catch {}

  // Battery optimization (Android 6+)
  try {
    if (Platform.OS === "android") {
      const batteryOptimized = await notifee.isBatteryOptimizationEnabled();
      if (batteryOptimized) {
        await new Promise<void>((resolve) => {
          Alert.alert(
            "Battery Optimization",
            'To ensure prayer time notifications arrive on time, please find "simplesolat" in the list, tap on it, and select "Unrestricted".',
            [
              {
                text: "Skip",
                style: "cancel",
                onPress: () => resolve(),
              },
              {
                text: "Ok",
                style: "default",
                onPress: async () => {
                  await notifee.openBatteryOptimizationSettings();
                  resolve();
                },
              },
            ],
          );
        });
      }
    }
  } catch {}
}
