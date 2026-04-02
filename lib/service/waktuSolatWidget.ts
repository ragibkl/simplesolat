import { startOfMinute } from "date-fns";

import { WaktuSolat } from "@/lib/data/waktuSolatStore";
import { Zone } from "@/lib/data/zoneStore";
import { requestWaktuSolatWidgetUpdate } from "@/lib/widgets/WaktuSolat";
import { requestWaktuSolatCompactUpdate } from "@/lib/widgets/WaktuSolatCompact";
import { requestWaktuSolatImsakWidgetUpdate } from "@/lib/widgets/WaktuSolatImsak";
import { requestWaktuSolatLargeUpdate } from "@/lib/widgets/WaktuSolatLarge";
import { requestWaktuSolatTransparentUpdate } from "@/lib/widgets/WaktuSolatTransparent";

import { scheduleAllWaktuSolatNotifications } from "./notifee";
import { getPrayerData } from "./prayerData";

export async function requestUpdateWaktuSolatWidgets(
  date: Date,
  zone: Zone,
  waktuSolat: WaktuSolat,
) {
  await Promise.all([
    requestWaktuSolatWidgetUpdate(date, zone, waktuSolat.prayerTime),
    requestWaktuSolatCompactUpdate(date, zone, waktuSolat.prayerTime),
    requestWaktuSolatImsakWidgetUpdate(date, zone, waktuSolat.prayerTime),
    requestWaktuSolatLargeUpdate(date, zone, waktuSolat.prayerTime),
    requestWaktuSolatTransparentUpdate(date, zone, waktuSolat.prayerTime),
  ]);
}

export async function updateWaktuSolatAndWidgets(
  updateZone: boolean,
  updateNotifs: boolean,
) {
  const date = startOfMinute(new Date());
  const data = await getPrayerData(date, updateZone);
  if (!data) {
    return;
  }

  const { zone, waktuSolat } = data;
  requestUpdateWaktuSolatWidgets(date, zone, waktuSolat);

  if (updateNotifs) {
    await scheduleAllWaktuSolatNotifications(waktuSolat, zone);
  }
}
