import { startOfMinute } from "date-fns";
import { Platform } from "react-native";

import { WaktuSolat } from "@/lib/domain/prayerTime";
import { Zone } from "@/lib/domain/zone";
import { requestWaktuSolatWidgetUpdate } from "@/lib/widgets/WaktuSolat";
import { requestWaktuSolatCompactUpdate } from "@/lib/widgets/WaktuSolatCompact";
import { requestWaktuSolatImsakWidgetUpdate } from "@/lib/widgets/WaktuSolatImsak";
import { requestWaktuSolatTransparentUpdate } from "@/lib/widgets/WaktuSolatTransparent";
import { updateIosWidgets } from "@/lib/widgets/ios/updateIosWidgets";

import { scheduleAllWaktuSolatNotifications } from "./notifee";
import { GetLocationOptions } from "./location";
import { getPrayerData } from "./prayerData";
import { getUpcomingWaktuSolat } from "./waktuSolat";

export async function requestUpdateWaktuSolatWidgets(
  date: Date,
  zone: Zone,
  waktuSolat: WaktuSolat,
) {
  await Promise.all([
    requestWaktuSolatWidgetUpdate(date, zone, waktuSolat.prayerTime),
    requestWaktuSolatCompactUpdate(date, zone, waktuSolat.prayerTime),
    requestWaktuSolatImsakWidgetUpdate(date, zone, waktuSolat.prayerTime),
    requestWaktuSolatTransparentUpdate(date, zone, waktuSolat.prayerTime),
  ]);
}

// The days to schedule reminders for. Android reschedules from its frequent
// background task, so today is enough; iOS runs background work rarely, so
// schedule up to 12 days ahead (see scheduleAllWaktuSolatNotifications).
export async function getReminderDays(
  date: Date,
  waktuSolat: WaktuSolat,
): Promise<WaktuSolat[]> {
  if (Platform.OS !== "ios") {
    return [waktuSolat];
  }
  return getUpcomingWaktuSolat(date, 12);
}

export async function updateWaktuSolatAndWidgets(
  updateZone: boolean,
  updateNotifs: boolean,
  locationOptions: GetLocationOptions = {},
) {
  const date = startOfMinute(new Date());
  const data = await getPrayerData(date, updateZone, locationOptions);
  if (!data) {
    return;
  }

  const { zone, waktuSolat } = data;
  requestUpdateWaktuSolatWidgets(date, zone, waktuSolat);
  await updateIosWidgets(date, zone);

  if (updateNotifs) {
    await scheduleAllWaktuSolatNotifications(
      await getReminderDays(date, waktuSolat),
      zone,
    );
  }
}
