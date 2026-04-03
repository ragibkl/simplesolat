import { zoneStore } from "@/lib/data/zoneStore";
import { WaktuSolat } from "@/lib/domain/prayerTime";
import { Zone } from "@/lib/domain/zone";

import { getOrRetrieveWaktuSolat } from "./waktuSolat";
import { getUpdatedZone } from "./zone";

export type PrayerData = {
  zone: Zone;
  waktuSolat: WaktuSolat;
};

export async function getPrayerData(
  date: Date,
  updateZone: boolean,
): Promise<PrayerData | null> {
  const zone = updateZone ? await getUpdatedZone() : await zoneStore.load();
  if (!zone) {
    return null;
  }

  const waktuSolat = await getOrRetrieveWaktuSolat(date);
  if (!waktuSolat) {
    return null;
  }

  return { zone, waktuSolat };
}
