import * as Location from "expo-location";
import notifee, { AndroidNotificationSetting } from "@notifee/react-native";
import { Alert, Platform } from "react-native";

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

    // Exact alarms (Android 12+)
    if (Platform.OS === "android") {
      const settings = await notifee.getNotificationSettings();
      if (settings.android.alarm !== AndroidNotificationSetting.ENABLED) {
        await new Promise<void>((resolve) => {
          Alert.alert(
            "Exact Alarm Permission",
            "This app needs exact alarm permission to notify you precisely when each prayer time begins.",
            [
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

    // Battery optimization (Android 6+)
    if (Platform.OS === "android") {
      const batteryOptimized = await notifee.isBatteryOptimizationEnabled();
      if (batteryOptimized) {
        await new Promise<void>((resolve) => {
          Alert.alert(
            "Battery Optimization",
            "To ensure prayer time notifications arrive on time, please disable battery optimization for this app.",
            [
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

    // Manufacturer power manager (Samsung, Xiaomi, etc.)
    if (Platform.OS === "android") {
      const powerManagerInfo = await notifee.getPowerManagerInfo();
      if (powerManagerInfo.activity) {
        await new Promise<void>((resolve) => {
          Alert.alert(
            "Background Restrictions",
            `Your ${powerManagerInfo.manufacturer} device may restrict background notifications. Please allow this app to run in the background for reliable prayer time alerts.`,
            [
              {
                text: "Ok",
                style: "default",
                onPress: async () => {
                  await notifee.openPowerManagerSettings();
                  resolve();
                },
              },
            ],
          );
        });
      }
    }
  } catch (e) {
    console.log("Error requesting permissions", e);
  }
}
