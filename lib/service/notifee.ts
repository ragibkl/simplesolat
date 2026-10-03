import notifee, {
  AlarmType,
  AndroidImportance,
  AuthorizationStatus,
  TriggerType,
} from "@notifee/react-native";
import { Platform } from "react-native";

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

const PRAYER_NAMES: Record<keyof PrayerTime, string> = {
  imsak: "Imsak",
  fajr: "Fajr",
  syuruk: "Syuruk",
  dhuha: "Dhuha",
  dhuhr: "Dhuhr",
  asr: "Asr",
  maghrib: "Maghrib",
  isha: "Isha",
};

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
      title: `Waktu Solat - ${PRAYER_NAMES[waktu]} at ${dateText}`,
      body: `It is now ${PRAYER_NAMES[waktu]} in ${getZoneLocationText(zone)}`,
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

// iOS keeps at most 64 scheduled notifications per app.
// iOS keeps at most 64 scheduled notifications per app. Leave one for the
// "open the app" nudge.
const IOS_MAX_SCHEDULED = 59;
// On iOS, Imsak, Syuruk and Dhuha are scheduled only for the next two days,
// so the five daily prayers can be scheduled further ahead (about 12 days).
const IOS_EXTRAS_DAYS = 2;
const FIVE_PRAYERS: (keyof PrayerTime)[] = [
  "fajr",
  "dhuhr",
  "asr",
  "maghrib",
  "isha",
];

function nudgeId(epochMs: number): string {
  return `${WAKTU_SOLAT_CHANNEL}::${NOTIFICATION_VERSION}::nudge::${epochMs}`;
}

// After the last scheduled reminder, ask the user to open the app, so
// reminders don't stop silently if iOS never gave us background time.
async function scheduleNudge(epochMs: number) {
  await notifee.createTriggerNotification(
    {
      id: nudgeId(epochMs),
      title: "simplesolat",
      body: "Open simplesolat to keep your prayer time reminders coming.",
    },
    { type: TriggerType.TIMESTAMP, timestamp: epochMs },
  );
}

// Schedules reminders for the given days (Android: today, rescheduled by the
// background task; iOS: up to about 12 days, since background runs are rare)
// and cancels any others.
export async function scheduleAllWaktuSolatNotifications(
  days: WaktuSolat[],
  zone: Zone,
) {
  const settings = await notifee.getNotificationSettings();
  if (settings.authorizationStatus === AuthorizationStatus.DENIED) {
    return;
  }

  const isIos = Platform.OS === "ios";
  const { notifications: enabled } = await loadSettings();
  const now = Date.now();
  let candidates: {
    id: string;
    at: number;
    waktuSolat: WaktuSolat;
    waktu: keyof PrayerTime;
  }[] = [];
  days.forEach((waktuSolat, dayIndex) => {
    const waktuKeys = Object.keys(
      waktuSolat.prayerTime,
    ) as (keyof PrayerTime)[];
    for (const waktu of waktuKeys) {
      const epochSeconds = waktuSolat.prayerTime[waktu];
      if (!enabled[waktu] || epochSeconds === undefined) continue;
      if (epochSeconds * 1000 <= now) continue;
      if (isIos && dayIndex >= IOS_EXTRAS_DAYS && !FIVE_PRAYERS.includes(waktu))
        continue;
      candidates.push({
        id: notificationId(waktuSolat, waktu),
        at: epochSeconds * 1000,
        waktuSolat,
        waktu,
      });
    }
  });
  candidates.sort((a, b) => a.at - b.at);
  if (isIos) {
    candidates = candidates.slice(0, IOS_MAX_SCHEDULED);
  }
  const wanted = new Map(candidates.map((c) => [c.id, c]));

  // The nudge goes 10 minutes after the last reminder, only when several
  // days are scheduled (iOS).
  const last = candidates[candidates.length - 1];
  const nudgeAt =
    isIos && days.length > IOS_EXTRAS_DAYS && last
      ? last.at + 10 * 60 * 1000
      : null;
  const wantedNudge = nudgeAt === null ? null : nudgeId(nudgeAt);

  // Only read the ids. getTriggerNotifications() unparcels every stored
  // notification, which crashes the app when one can't be read back.
  const ids = await notifee.getTriggerNotificationIds();
  const existing = new Set<string>();
  for (const id of ids) {
    if (!id.startsWith(`${WAKTU_SOLAT_CHANNEL}::`)) {
      continue;
    }
    if (wanted.has(id) || id === wantedNudge) {
      existing.add(id);
    } else {
      await notifee.cancelTriggerNotification(id);
    }
  }

  for (const [id, { waktuSolat, waktu }] of wanted) {
    if (!existing.has(id)) {
      await scheduleWaktuSolatNotification(waktuSolat, zone, waktu);
    }
  }
  if (nudgeAt !== null && wantedNudge && !existing.has(wantedNudge)) {
    await scheduleNudge(nudgeAt);
  }
}
