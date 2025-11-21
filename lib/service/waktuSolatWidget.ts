import { startOfMinute } from "date-fns";

import { WaktuSolat } from "@/lib/data/waktuSolatStore";
import { Zone, zoneStore } from "@/lib/data/zoneStore";
import { requestWaktuSolatWidgetUpdate } from "@/lib/widgets/WaktuSolat";
import { requestWaktuSolatTransparentUpdate } from "@/lib/widgets/WaktuSolatTransparent";

import { scheduleAllWaktuSolatNotifications } from "./notifee";
import { getOrRetrieveWaktuSolat } from "./waktuSolat";
import { getUpdatedZone } from "./zone";

export async function getPrayerData(
  date: Date,
  updateZone: boolean,
): Promise<{ zone: Zone; waktuSolat: WaktuSolat } | null> {
  const zone = updateZone ? await getUpdatedZone() : await zoneStore.load();
  if (!zone) {
    return null;
  }

  const waktuSolat = await getOrRetrieveWaktuSolat(zone.zone, date);
  if (!waktuSolat) {
    return null;
  }

  return { zone, waktuSolat };
}

export async function requestUpdateWaktuSolatWidgets(
  date: Date,
  zone: Zone,
  waktuSolat: WaktuSolat,
) {
  await requestWaktuSolatWidgetUpdate(date, zone, waktuSolat.prayerTime);
  await requestWaktuSolatTransparentUpdate(date, zone, waktuSolat.prayerTime);
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
