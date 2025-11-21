import notifee, { EventType, TriggerType } from "@notifee/react-native";

import { PrayerTime, WaktuSolat } from "@/lib/data/waktuSolatStore";
import { Zone } from "@/lib/data/zoneStore";

import { requestUpdateWaktuSolatWidgets, updateWaktuSolatAndWidgets } from "./waktuSolatWidget";

export const WAKTU_SOLAT_PREFIX = "waktu_solat";

function sameWaktuSolat(left: WaktuSolat, right: WaktuSolat): boolean {
  return (
    left.year === right.year &&
    left.month === right.month &&
    left.date === right.date &&
    left.zone === right.zone
  );
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
  const date = getEpochDate(epochSeconds);
  const dateText = date.toLocaleString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  // skip if time already passed
  if (date.getTime() < Date.now()) {
    return;
  }

  // Request permissions (required for iOS)
  await notifee.requestPermission();

  // Create a channel (required for Android)
  const channelId = await notifee.createChannel({
    id: `${WAKTU_SOLAT_PREFIX}_${waktu}`,
    name: waktu,
    sound: "default",
  });

  // Trigger a notification
  await notifee.createTriggerNotification(
    {
      title: `Waktu Solat - ${waktu} at ${dateText}`,
      body: `It is now ${waktu} in ${zone.district}, ${zone.state}`,
      android: {
        channelId,
      },
      data: {
        waktuSolat,
        waktu,
        zone,
      },
    },
    {
      type: TriggerType.TIMESTAMP,
      timestamp: date.getTime(),
    },
  );
}

export async function scheduleAllWaktuSolatNotifications(
  waktuSolat: WaktuSolat,
  zone: Zone,
) {
  const existingNotifs: {
    [k in keyof PrayerTime]: boolean;
  } = {
    fajr: false,
    syuruk: false,
    dhuhr: false,
    asr: false,
    maghrib: false,
    isha: false,
  };

  const notifications = await notifee.getTriggerNotifications();
  for (const n of notifications) {
    // Assert notification trigger channel is waktu_solat_*
    if (
      !n.notification.android?.channelId ||
      !n.notification.android.channelId.startsWith("waktu_solat")
    ) {
      continue;
    }

    // Check if notification matches the current WaktuSolat zone and date
    if (
      sameWaktuSolat(n.notification?.data?.waktuSolat as WaktuSolat, waktuSolat)
    ) {
      existingNotifs[n.notification?.data?.waktu as keyof PrayerTime] = true;
    } else if (n.notification.id) {
      await notifee.cancelTriggerNotification(n.notification.id);
    }
  }

  const waktuKeys = Object.keys(waktuSolat.prayerTime) as (keyof PrayerTime)[];
  for (const waktu of waktuKeys) {
    // Schedule notification if not yet scheduled
    if (!existingNotifs[waktu]) {
      await scheduleWaktuSolatNotification(waktuSolat, zone, waktu);
    }
  }
}

notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.DELIVERED) {
    const data = detail?.notification?.data || {};

    if (data && "waktuSolat" in data && "zone" in data) {
      const waktuSolat = data.waktuSolat as WaktuSolat;
      const zone = data.zone as Zone;
      await requestUpdateWaktuSolatWidgets(new Date(), zone, waktuSolat)
    } else {
      await updateWaktuSolatAndWidgets(false, false);
    }
  }
});
