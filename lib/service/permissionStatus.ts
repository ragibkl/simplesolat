import notifee, {
  AndroidNotificationSetting,
  AuthorizationStatus,
} from "@notifee/react-native";
import * as Location from "expo-location";
import { Linking, Platform } from "react-native";

import { Language, t } from "@/lib/i18n/translate";

export type PermissionCheck = {
  key: string;
  label: string;
  help: string;
  ok: boolean;
  fix: () => Promise<unknown>;
};

export async function getPermissionChecks(
  lang: Language,
): Promise<PermissionCheck[]> {
  const settings = await notifee.getNotificationSettings();
  const isAndroid = Platform.OS === "android";
  const batteryOptimized =
    isAndroid && (await notifee.isBatteryOptimizationEnabled());
  const fg = await Location.getForegroundPermissionsAsync();
  const bg = await Location.getBackgroundPermissionsAsync();

  const checks: (PermissionCheck & { androidOnly?: boolean })[] = [
    {
      key: "notifications",
      label: t(lang, "permission.notifications"),
      help: t(lang, "permission.notifications.help"),
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
      label: t(lang, "permission.exactAlarms"),
      help: t(lang, "permission.exactAlarms.help"),
      ok: settings.android.alarm === AndroidNotificationSetting.ENABLED,
      fix: () => notifee.openAlarmPermissionSettings(),
    },
    {
      key: "battery",
      androidOnly: true,
      label: t(lang, "permission.battery"),
      help: t(lang, "permission.battery.help"),
      ok: !batteryOptimized,
      fix: () => notifee.openBatteryOptimizationSettings(),
    },
    {
      key: "location",
      label: t(lang, "permission.location"),
      help: t(lang, "permission.location.help"),
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
      label: t(
        lang,
        Platform.OS === "ios"
          ? "permission.locationAlways.ios"
          : "permission.locationAlways.android",
      ),
      help: t(lang, "permission.locationAlways.help"),
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

  // iOS has no exact-alarm or battery settings.
  return checks.filter((check) => isAndroid || !check.androidOnly);
}
