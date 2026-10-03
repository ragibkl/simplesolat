import notifee, {
  AndroidNotificationSetting,
  AuthorizationStatus,
} from "@notifee/react-native";
import * as Location from "expo-location";
import { Linking, Platform } from "react-native";

export type PermissionCheck = {
  key: string;
  label: string;
  help: string;
  ok: boolean;
  fix: () => Promise<unknown>;
};

export async function getPermissionChecks(): Promise<PermissionCheck[]> {
  const settings = await notifee.getNotificationSettings();
  const isAndroid = Platform.OS === "android";
  const batteryOptimized =
    isAndroid && (await notifee.isBatteryOptimizationEnabled());
  const fg = await Location.getForegroundPermissionsAsync();
  const bg = await Location.getBackgroundPermissionsAsync();

  const checks: (PermissionCheck & { androidOnly?: boolean })[] = [
    {
      key: "notifications",
      label: "Notifications",
      help: "Needed for prayer time reminders.",
      ok:
        settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
        settings.authorizationStatus === AuthorizationStatus.PROVISIONAL,
      fix: async () => {
        if (
          settings.authorizationStatus === AuthorizationStatus.NOT_DETERMINED
        ) {
          await notifee.requestPermission();
        } else {
          await notifee.openNotificationSettings();
        }
      },
    },
    {
      key: "alarms",
      androidOnly: true,
      label: "Exact alarms",
      help: "Lets reminders arrive right at the prayer time.",
      ok: settings.android.alarm === AndroidNotificationSetting.ENABLED,
      fix: () => notifee.openAlarmPermissionSettings(),
    },
    {
      key: "battery",
      androidOnly: true,
      label: "Battery unrestricted",
      help: 'Find "simplesolat" and choose "Unrestricted", so Android doesn\'t delay reminders and widget updates.',
      ok: !batteryOptimized,
      fix: () => notifee.openBatteryOptimizationSettings(),
    },
    {
      key: "location",
      label: "Location",
      help: "Used on your phone to find your prayer zone. It never leaves your phone.",
      ok: fg.granted,
      fix: async () => {
        if (fg.canAskAgain) {
          await Location.requestForegroundPermissionsAsync();
        } else {
          await Linking.openSettings();
        }
      },
    },
    {
      key: "backgroundLocation",
      androidOnly: true,
      label: "Location all the time",
      help: "Keeps widgets on the right zone when you travel.",
      ok: bg.granted,
      fix: async () => {
        if (fg.granted && bg.canAskAgain) {
          await Location.requestBackgroundPermissionsAsync();
        } else {
          await Linking.openSettings();
        }
      },
    },
  ];

  // iOS has no exact-alarm or battery settings, and simplesolat doesn't use
  // location in the background there (the zone updates when the app opens).
  return checks.filter((check) => isAndroid || !check.androidOnly);
}
