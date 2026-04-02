import { addDays, addMonths } from "date-fns";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  WaktuSolat,
  WaktuSolatStore,
  waktuSolatStore,
} from "@/lib/data/waktuSolatStore";
import { getZoneCode, OfficialZone } from "@/lib/data/zoneStore";
import { fetchPrayerTimesMonth } from "@/lib/remote/simplesolatData";
import { calculateWaktuSolat } from "@/lib/service/adhanCalculator";
import { localTimeToEpoch } from "@/lib/service/timeConvert";
import { getWaktuSolatFromStore } from "@/lib/service/waktuSolat";
import { useCurrentDate } from "./date";
import { useZone } from "./zone";

// Per-zone mutex to prevent concurrent fetches for the same zone.
const mutexByZone = new Map<string, Promise<void>>();

async function withLock<T>(zone: string, fn: () => Promise<T>): Promise<T> {
  let release!: () => void;
  const prev = mutexByZone.get(zone) ?? Promise.resolve();
  mutexByZone.set(zone, new Promise((r) => (release = r)));

  await prev;
  try {
    return await fn();
  } finally {
    release();
  }
}

/**
 * Fetch prayer times from GitHub Pages for current + next month,
 * convert HH:MM to epoch seconds, and merge into the waktuSolat store.
 */
async function fetchAndMergeGHPrayerTimes(
  store: WaktuSolatStore,
  zone: OfficialZone,
  date: Date,
): Promise<WaktuSolatStore> {
  const timezone = zone.timezone;
  if (!timezone) {
    // Zone was loaded from stale cache without timezone — skip fetch,
    // the zone resolver will re-resolve and trigger a re-render
    return store;
  }

  // Fetch current month + next month
  const months = [
    { year: date.getFullYear(), month: date.getMonth() + 1 },
    {
      year: addMonths(date, 1).getFullYear(),
      month: addMonths(date, 1).getMonth() + 1,
    },
  ];

  const newStore = { ...store };

  for (const { year, month } of months) {
    const entries = await fetchPrayerTimesMonth(
      zone.country,
      zone.zone,
      year,
      month,
    );

    for (const entry of entries) {
      const [y, m, d] = entry.date.split("-").map(Number);
      const key = `${y}::${m}::${d}::${zone.zone}`;

      newStore[key] = {
        year: y,
        month: m,
        date: d,
        zone: zone.zone,
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
    }
  }

  return newStore;
}

export function useWaktuSolat() {
  const { data, setData } = waktuSolatStore.use();

  const dataRef = useRef(data);
  dataRef.current = data;

  const fetchGHWaktuSolat = useCallback(
    async (zone: OfficialZone, date: Date): Promise<WaktuSolat | null> => {
      const cached = getWaktuSolatFromStore(dataRef.current, zone.zone, date);
      if (cached) {
        return cached;
      }

      return withLock(zone.zone, async () => {
        const cachedAfterWait = getWaktuSolatFromStore(
          dataRef.current,
          zone.zone,
          date,
        );
        if (cachedAfterWait) return cachedAfterWait;

        const newStore = await fetchAndMergeGHPrayerTimes(
          dataRef.current,
          zone,
          date,
        );
        setData(newStore);
        return getWaktuSolatFromStore(newStore, zone.zone, date);
      });
    },
    [setData],
  );

  return { setWaktuSolatData: setData, fetchGHWaktuSolat };
}

function useWaktuSolatForDate(date: Date) {
  const { fetchGHWaktuSolat } = useWaktuSolat();
  const { zone } = useZone();

  const [waktuSolat, setWaktuSolat] = useState<WaktuSolat | null>(null);

  useEffect(() => {
    async function effect() {
      if (!zone) {
        setWaktuSolat(null);
        return;
      }

      if (zone.type === "calculated") {
        const w = calculateWaktuSolat(
          date,
          getZoneCode(zone),
          zone.lat,
          zone.lng,
          zone.country,
        );
        setWaktuSolat(w);
        return;
      }

      const w = await fetchGHWaktuSolat(zone, date);
      if (w) {
        setWaktuSolat(w);
      }
    }

    effect();
  }, [zone, fetchGHWaktuSolat, date]);

  return { waktuSolat };
}

export function useWaktuSolatCurrent() {
  const { date } = useCurrentDate();
  return useWaktuSolatForDate(date);
}

export function useWaktuSolatTomorrow() {
  const { date } = useCurrentDate();
  const tomorrow = useMemo(() => addDays(date, 1), [date]);
  const { waktuSolat } = useWaktuSolatForDate(tomorrow);
  return { waktuSolatTomorrow: waktuSolat, tomorrow };
}
