import { WaktuSolat } from "@/lib/data/waktuSolatStore";
import { Zone, zoneStore } from "@/lib/data/zoneStore";

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

  const waktuSolat = await getOrRetrieveWaktuSolat(date);
  if (!waktuSolat) {
    return null;
  }

  return { zone, waktuSolat };
}
