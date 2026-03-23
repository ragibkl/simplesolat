import { addDays } from "date-fns";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { WaktuSolat, waktuSolatStore } from "@/lib/data/waktuSolatStore";
import { getZoneCode } from "@/lib/data/zoneStore";
import { getWaktuSolatByZone } from "@/lib/remote/simplesolat";
import { calculateWaktuSolat } from "@/lib/service/adhanCalculator";
import {
  getWaktuSolatFromStore,
  mergeWaktuSolatResponseIntoStore,
} from "@/lib/service/waktuSolat";
import { useCurrentDate } from "./date";
import { useZone } from "./zone";

// Per-zone mutex to prevent concurrent fetches for the same zone.
// Must be module-level so it is shared across all hook instances.
// useRef is per-component, so useWaktuSolatCurrent and useWaktuSolatTomorrow
// would each get their own ref and the mutex would not work.
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

  // We use a ref to hold the latest `data` so that getOrRetrieveWaktuSolat
  // can read it without needing `data` as a useCallback dependency.
  //
  // The problem with having `data` as a dep: every time a fetch completes and
  // setData is called, `data` changes → getOrRetrieveWaktuSolat recreates →
  // all useEffects that depend on it re-run → potential duplicate API calls.
  //
  // By reading from dataRef.current inside the callback instead, the callback
  // identity stays stable. Effects only re-run when zone or date actually
  // change — which is the correct trigger.
  const dataRef = useRef(data);
  dataRef.current = data;

  const fetchOfficialWaktuSolat = useCallback(
    async (zoneCode: string, date: Date): Promise<WaktuSolat | null> => {
      const cached = getWaktuSolatFromStore(dataRef.current, zoneCode, date);
      if (cached) {
        console.log(
          `Found WaktuSolat from store. zone=${zoneCode} date=${date}`,
        );
        return cached;
      }

      return withLock(zoneCode, async () => {
        // Re-check after acquiring lock — a previous waiter may have already fetched
        const cachedAfterWait = getWaktuSolatFromStore(
          dataRef.current,
          zoneCode,
          date,
        );
        if (cachedAfterWait) return cachedAfterWait;

        console.log(
          `Fetch new WaktuSolat from api. zone=${zoneCode} date=${date}`,
        );
        const res = await getWaktuSolatByZone(date, zoneCode);
        const newStore = mergeWaktuSolatResponseIntoStore(dataRef.current, res);
        console.log(`Update WaktuSolat into store`);
        setData(newStore);
        return getWaktuSolatFromStore(newStore, zoneCode, date);
      });
    },
    [setData], // setData is stable (created with useCallback(fn, []) in Provider)
  );

  return { setWaktuSolatData: setData, fetchOfficialWaktuSolat };
}

function useWaktuSolatForDate(date: Date) {
  const { fetchOfficialWaktuSolat } = useWaktuSolat();
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
          zone.method,
        );
        setWaktuSolat(w);
        return;
      }

      const w = await fetchOfficialWaktuSolat(zone.zone, date);
      if (w) {
        setWaktuSolat(w);
      }
    }

    effect();
  }, [zone, fetchOfficialWaktuSolat, date]);

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
