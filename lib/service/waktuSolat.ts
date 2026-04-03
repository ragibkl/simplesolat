import { addMonths, compareAsc, startOfYesterday } from "date-fns";

import { WaktuSolatStore, waktuSolatStore } from "@/lib/data/waktuSolatStore";
import { zoneStore } from "@/lib/data/zoneStore";
import { WaktuSolat } from "@/lib/domain/prayerTime";
import { getZoneCode } from "@/lib/domain/zone";
import { localTimeToEpoch } from "@/lib/domain/datetime";
import { fetchPrayerTimesMonth } from "@/lib/remote/simplesolat";
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

async function fetchAndMergeGHPrayerTimes(
  store: WaktuSolatStore,
  zoneCode: string,
  country: string,
  timezone: string,
  date: Date,
): Promise<WaktuSolatStore> {
  const trimmedStore = trimWaktuSolatStore(store);
  const newStore: WaktuSolatStore = {};

  const months = [
    { year: date.getFullYear(), month: date.getMonth() + 1 },
    {
      year: addMonths(date, 1).getFullYear(),
      month: addMonths(date, 1).getMonth() + 1,
    },
  ];

  for (const { year, month } of months) {
    const entries = await fetchPrayerTimesMonth(country, zoneCode, year, month);

    for (const entry of entries) {
      const [y, m, d] = entry.date.split("-").map(Number);
      const ws: WaktuSolat = {
        year: y,
        month: m,
        date: d,
        zone: zoneCode,
        prayerTime: {
          imsak: localTimeToEpoch(entry.date, entry.imsak, timezone),
          fajr: localTimeToEpoch(entry.date, entry.fajr, timezone),
          syuruk: localTimeToEpoch(entry.date, entry.syuruk, timezone),
          dhuhr: localTimeToEpoch(entry.date, entry.dhuhr, timezone),
          asr: localTimeToEpoch(entry.date, entry.asr, timezone),
          maghrib: localTimeToEpoch(entry.date, entry.maghrib, timezone),
          isha: localTimeToEpoch(entry.date, entry.isha, timezone),
        },
      };
      newStore[getWaktuSolatKey(ws)] = ws;
    }
  }

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
    return waktuSolat;
  }

  const newStore = await fetchAndMergeGHPrayerTimes(
    store,
    zone.zone,
    zone.country,
    zone.timezone,
    date,
  );
  await waktuSolatStore.save(newStore);

  return getWaktuSolatFromStore(newStore, zone.zone, date);
}
