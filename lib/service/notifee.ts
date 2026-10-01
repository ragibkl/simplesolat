import notifee, {
  AlarmType,
  AndroidImportance,
  AuthorizationStatus,
  TriggerType,
} from "@notifee/react-native";

import { loadSettings } from "@/lib/data/settingsStore";
import { PrayerTime, WaktuSolat } from "@/lib/domain/prayerTime";
import { Zone, getZoneLocationText } from "@/lib/domain/zone";

export const WAKTU_SOLAT_CHANNEL = "waktu_solat";

// Bump when the notification data format changes. Notifications scheduled
// with an older version are cancelled and rescheduled.
const NOTIFICATION_VERSION = "v2";

function notificationIdPrefix(waktuSolat: WaktuSolat): string {
  return [
    WAKTU_SOLAT_CHANNEL,
    NOTIFICATION_VERSION,
    waktuSolat.year,
    waktuSolat.month,
    waktuSolat.date,
    waktuSolat.zone,
  ].join("::");
}

function notificationId(waktuSolat: WaktuSolat, waktu: keyof PrayerTime) {
  return `${notificationIdPrefix(waktuSolat)}::${waktu}`;
}

export function getEpochDate(epochSeconds: number): Date {
  const date = new Date(0);
  date.setUTCSeconds(epochSeconds);
  return date;
}

async function scheduleWaktuSolatNotification(
  waktuSolat: WaktuSolat,
  zone: Zone,
  waktu: keyof PrayerTime,
) {
  const epochSeconds = waktuSolat.prayerTime[waktu];
  if (epochSeconds === undefined) {
    return;
  }

  const date = getEpochDate(epochSeconds);
  const dateText = date.toLocaleString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  // skip if time already passed
  if (date.getTime() < Date.now()) {
    return;
  }

  // Create a channel (required for Android)
  const channelId = await notifee.createChannel({
    id: WAKTU_SOLAT_CHANNEL,
    name: "Prayer Times",
    sound: "default",
    importance: AndroidImportance.HIGH,
  });

  // Trigger a notification
  await notifee.createTriggerNotification(
    {
      id: notificationId(waktuSolat, waktu),
      title: `Waktu Solat - ${waktu} at ${dateText}`,
      body: `It is now ${waktu} in ${getZoneLocationText(zone)}`,
      android: {
        channelId,
        importance: AndroidImportance.HIGH,
      },
      // Plain strings only: notifee stores this as an Android Parcel, and
      // nested values have failed to read back (BadParcelableException).
      data: {
        waktuSolat: JSON.stringify(waktuSolat),
        waktu,
        zone: JSON.stringify(zone),
      },
    },
    {
      type: TriggerType.TIMESTAMP,
      timestamp: date.getTime(),
      alarmManager: {
        allowWhileIdle: true,
        // type: AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE,
        type: AlarmType.SET_ALARM_CLOCK,
      },
    },
  );
}

export async function sendTestNotification() {
  const channelId = await notifee.createChannel({
    id: WAKTU_SOLAT_CHANNEL,
    name: "Prayer Times",
    sound: "default",
    importance: AndroidImportance.HIGH,
  });
  await notifee.displayNotification({
    title: "simplesolat test",
    body: "Prayer time notifications are working.",
    android: { channelId, importance: AndroidImportance.HIGH },
  });
}

export async function scheduleAllWaktuSolatNotifications(
  waktuSolat: WaktuSolat,
  zone: Zone,
) {
  const settings = await notifee.getNotificationSettings();
  if (settings.authorizationStatus === AuthorizationStatus.DENIED) {
    return;
  }

  const { notifications: enabled } = await loadSettings();
  const existingNotifs = new Set<keyof PrayerTime>();

  // Only read the ids. getTriggerNotifications() unparcels every stored
  // notification, which crashes the app when one can't be read back.
  const ids = await notifee.getTriggerNotificationIds();
  const prefix = `${notificationIdPrefix(waktuSolat)}::`;
  for (const id of ids) {
    if (!id.startsWith(`${WAKTU_SOLAT_CHANNEL}::`)) {
      continue;
    }

    const waktu = id.slice(prefix.length) as keyof PrayerTime;
    if (id.startsWith(prefix) && enabled[waktu]) {
      existingNotifs.add(waktu);
    } else {
      await notifee.cancelTriggerNotification(id);
    }
  }

  const waktuKeys = Object.keys(waktuSolat.prayerTime) as (keyof PrayerTime)[];
  for (const waktu of waktuKeys) {
    // Schedule notification if turned on and not yet scheduled
    if (enabled[waktu] && !existingNotifs.has(waktu)) {
      await scheduleWaktuSolatNotification(waktuSolat, zone, waktu);
    }
  }
}
