import { useCallback, useEffect, useState } from "react";

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

  const getOrRetrieveWaktuSolat = useCallback(
    async (zone: string, date: Date): Promise<WaktuSolat | null> => {
      const waktuSolat = getWaktuSolatFromStore(data, zone, date);
      if (waktuSolat) {
        console.log(`Found WaktuSolat from store. zone=${zone} date=${date}`);
        return waktuSolat;
      }

      console.log(`Fetch new WaktuSolat from api. zone=${zone} date=${date}`);
      const res = await getWaktuSolatByZone(date, zone);
      const newStore = mergeWaktuSolatResponseIntoStore(data, res);

      console.log(`Update WaktuSolat into store`);
      setData(newStore);

      return getWaktuSolatFromStore(newStore, zone, date);
    },
    [data, setData],
  );

  return { setWaktuSolatData: setData, getOrRetrieveWaktuSolat };
}

export function useWaktuSolatCurrent() {
  const { date } = useCurrentDate();
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
