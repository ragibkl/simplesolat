import { addDays } from "date-fns";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { waktuSolatStore } from "@/lib/data/waktuSolatStore";
import { calculateWaktuSolat } from "@/lib/domain/adhanCalculator";
import { WaktuSolat } from "@/lib/domain/prayerTime";
import { getZoneCode, OfficialZone } from "@/lib/domain/zone";
import {
  fetchAndMergePrayerTimes,
  getWaktuSolatFromStore,
} from "@/lib/service/waktuSolat";
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

export function useWaktuSolat() {
  const { data, setData } = waktuSolatStore.use();

  const dataRef = useRef(data);
  dataRef.current = data;

  const fetchWaktuSolat = useCallback(
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

        const newStore = await fetchAndMergePrayerTimes(
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

  return { setWaktuSolatData: setData, fetchWaktuSolat };
}

function useWaktuSolatForDate(date: Date) {
  const { fetchWaktuSolat } = useWaktuSolat();
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

      const w = await fetchWaktuSolat(zone, date);
      if (w) {
        setWaktuSolat(w);
      }
    }

    effect();
  }, [zone, fetchWaktuSolat, date]);

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
