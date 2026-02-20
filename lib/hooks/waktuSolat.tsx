import { addDays } from "date-fns";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { WaktuSolat, waktuSolatStore } from "@/lib/data/waktuSolatStore";
import { getWaktuSolatByZone } from "@/lib/remote/simplesolat";
import {
  getWaktuSolatFromStore,
  mergeWaktuSolatResponseIntoStore,
} from "@/lib/service/waktuSolat";
import { useCurrentDate } from "./date";
import { useZone } from "./zone";

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

  const getOrRetrieveWaktuSolat = useCallback(
    async (zone: string, date: Date): Promise<WaktuSolat | null> => {
      const current = dataRef.current;
      const waktuSolat = getWaktuSolatFromStore(current, zone, date);
      if (waktuSolat) {
        console.log(`Found WaktuSolat from store. zone=${zone} date=${date}`);
        return waktuSolat;
      }

      console.log(`Fetch new WaktuSolat from api. zone=${zone} date=${date}`);
      const res = await getWaktuSolatByZone(date, zone);
      const newStore = mergeWaktuSolatResponseIntoStore(current, res);

      console.log(`Update WaktuSolat into store`);
      setData(newStore);

      return getWaktuSolatFromStore(newStore, zone, date);
    },
    [setData], // setData is stable (created with useCallback(fn, []) in Provider)
  );

  return { setWaktuSolatData: setData, getOrRetrieveWaktuSolat };
}

function useWaktuSolatForDate(date: Date) {
  const { getOrRetrieveWaktuSolat } = useWaktuSolat();
  const { zone } = useZone();

  const [waktuSolat, setWaktuSolat] = useState<WaktuSolat | null>(null);

  useEffect(() => {
    async function effect() {
      if (zone) {
        const w = await getOrRetrieveWaktuSolat(zone.zone, date);
        if (w) {
          setWaktuSolat(w);
        }
      } else {
        setWaktuSolat(null);
      }
    }

    effect();
  }, [zone, getOrRetrieveWaktuSolat, date]);

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
