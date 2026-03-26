import { compareAsc, startOfYesterday } from "date-fns";

import {
  WaktuSolat,
  WaktuSolatStore,
  waktuSolatStore,
} from "@/lib/data/waktuSolatStore";
import { zoneStore, getZoneCode } from "@/lib/data/zoneStore";
import {
  getWaktuSolatByZone,
  WaktuSolatResponse,
} from "@/lib/remote/simplesolat";
import { calculateWaktuSolat } from "./adhanCalculator";

function getWaktuSolatKey(waktuSolat: WaktuSolat): string {
  return [
    waktuSolat.year,
    waktuSolat.month,
    waktuSolat.date,
    waktuSolat.zone,
  ].join("::");
}

function getWaktuSolatKeyFromDate(date: Date, zone: string): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();

  return [y, m, d, zone].join("::");
}

export function getWaktuSolatFromStore(
  store: WaktuSolatStore,
  zone: string,
  date: Date,
): WaktuSolat | null {
  const key = getWaktuSolatKeyFromDate(date, zone);
  return store[key] || null;
}

function trimWaktuSolatStore(store: WaktuSolatStore): WaktuSolatStore {
  const cutoff = startOfYesterday();
  const newStore: WaktuSolatStore = {};

  for (const key in store) {
    const waktuSolat = store[key];
    const dt = new Date(waktuSolat.year, waktuSolat.month - 1, waktuSolat.date);

    if (compareAsc(dt, cutoff) >= 0) {
      newStore[key] = waktuSolat;
    }
  }

  return newStore;
}

export function mergeWaktuSolatResponseIntoStore(
  store: WaktuSolatStore,
  res: WaktuSolatResponse,
): WaktuSolatStore {
  const trimmedStore = trimWaktuSolatStore(store);
  const newStore: WaktuSolatStore = {};

  res.data.forEach((p) => {
    const [year, month, day] = p.date.split("-") as [string, string, string];
    const waktuSolat: WaktuSolat = {
      year: parseInt(year),
      month: parseInt(month),
      date: parseInt(day),
      zone: p.zone,
      prayerTime: {
        imsak: p.imsak,
        fajr: p.fajr,
        syuruk: p.syuruk,
        dhuhr: p.dhuhr,
        asr: p.asr,
        maghrib: p.maghrib,
        isha: p.isha,
      },
    };
    const key = getWaktuSolatKey(waktuSolat);
    newStore[key] = waktuSolat;
  });

  return { ...trimmedStore, ...newStore };
}

export async function getOrRetrieveWaktuSolat(date: Date) {
  const zone = await zoneStore.load();
  if (!zone) return null;

  if (zone.type === "calculated") {
    return calculateWaktuSolat(
      date,
      getZoneCode(zone),
      zone.lat,
      zone.lng,
      zone.country,
    );
  }

  const store = await waktuSolatStore.load();
  const waktuSolat = getWaktuSolatFromStore(store, zone.zone, date);
  if (waktuSolat) {
    console.log(`Found WaktuSolat from store. zone=${zone.zone} date=${date}`);
    return waktuSolat;
  }

  const res = await getWaktuSolatByZone(date, zone.zone);
  const newStore = mergeWaktuSolatResponseIntoStore(store, res);
  console.log(`Update WaktuSolat into store`);
  await waktuSolatStore.save(newStore);

  return getWaktuSolatFromStore(newStore, zone.zone, date);
}
