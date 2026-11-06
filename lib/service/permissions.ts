import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import notifee, { AndroidNotificationSetting } from "@notifee/react-native";
import { Alert, Platform } from "react-native";

import { loadLanguage, t } from "@/lib/i18n";

const PROMPTED_KEY = "PERMISSIONS_PROMPTED_V1";

// Ask once, on first launch. After that, the settings page shows what's
// missing instead of asking on every launch.
export async function requestPermissionsOnFirstLaunch(): Promise<void> {
  if (await AsyncStorage.getItem(PROMPTED_KEY)) {
    return;
  }
  await requestAllPermissions();
  await AsyncStorage.setItem(PROMPTED_KEY, "1");
}

export async function requestAllPermissions(): Promise<void> {
  const lang = await loadLanguage();
  // Foreground location
  try {
    const fgStatus = await Location.getForegroundPermissionsAsync();
    if (fgStatus.status !== "granted") {
      await new Promise<void>((resolve) => {
        Alert.alert(
          t(lang, "prompt.location.title"),
          t(lang, "prompt.location.body"),
          [
            {
              text: t(lang, "prompt.ok"),
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
      t(lang, "prompt.locationError.title"),
      t(lang, "prompt.locationError.body"),
    );
  }

  // Background location ("Always" on iOS): lets reminders and widgets follow
  // the user when they travel (Android: background task; iOS: a geofence).
  try {
    const bgStatus = await Location.getBackgroundPermissionsAsync();
    if (bgStatus.status !== "granted") {
      await new Promise<void>((resolve) => {
        Alert.alert(
          t(lang, "prompt.background.title"),
          Platform.OS === "ios"
            ? t(lang, "prompt.background.body.ios")
            : t(lang, "prompt.background.body.android"),
          [
            {
              text: t(lang, "prompt.ok"),
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
      t(lang, "prompt.backgroundError.title"),
      t(lang, "prompt.backgroundError.body"),
    );
  }

  // Notifications
  try {
    await notifee.requestPermission();
  } catch {
    Alert.alert(
      t(lang, "prompt.notificationError.title"),
      t(lang, "prompt.notificationError.body"),
    );
  }

  // Exact alarms (Android 12+)
  try {
    if (Platform.OS === "android") {
      const settings = await notifee.getNotificationSettings();
      if (settings.android.alarm !== AndroidNotificationSetting.ENABLED) {
        await new Promise<void>((resolve) => {
          Alert.alert(
            t(lang, "prompt.exactAlarm.title"),
            t(lang, "prompt.exactAlarm.body"),
            [
              {
                text: t(lang, "prompt.skip"),
                style: "cancel",
                onPress: () => resolve(),
              },
              {
                text: t(lang, "prompt.ok"),
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
            t(lang, "prompt.battery.title"),
            t(lang, "prompt.battery.body"),
            [
              {
                text: t(lang, "prompt.skip"),
                style: "cancel",
                onPress: () => resolve(),
              },
              {
                text: t(lang, "prompt.ok"),
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
