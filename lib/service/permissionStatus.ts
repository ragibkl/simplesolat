import notifee, {
  AndroidNotificationSetting,
  AuthorizationStatus,
} from "@notifee/react-native";
import * as Location from "expo-location";
import { Linking } from "react-native";

export type PermissionCheck = {
  key: string;
  label: string;
  help: string;
  ok: boolean;
  fix: () => Promise<unknown>;
};

export async function getPermissionChecks(): Promise<PermissionCheck[]> {
  const settings = await notifee.getNotificationSettings();
  const batteryOptimized = await notifee.isBatteryOptimizationEnabled();
  const fg = await Location.getForegroundPermissionsAsync();
  const bg = await Location.getBackgroundPermissionsAsync();

  return [
    {
      key: "notifications",
      label: "Notifications",
      help: "Needed for prayer time reminders.",
      ok: settings.authorizationStatus === AuthorizationStatus.AUTHORIZED,
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
      label: "Exact alarms",
      help: "Lets reminders arrive right at the prayer time.",
      ok: settings.android.alarm === AndroidNotificationSetting.ENABLED,
      fix: () => notifee.openAlarmPermissionSettings(),
    },
    {
      key: "battery",
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
}
