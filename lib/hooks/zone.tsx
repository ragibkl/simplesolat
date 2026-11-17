import { useCallback, useEffect } from "react";

import { zoneCheckStore } from "@/lib/data/zoneCheckStore";
import { zoneStore } from "@/lib/data/zoneStore";
import { Zone } from "@/lib/domain/zone";
import { lookupZoneByGps, resolveZone } from "@/lib/service/zone";
import { useLocation } from "@/lib/hooks/location";

export function useZone() {
  const { data: zone, setData: setZone } = zoneStore.use();

  const updateZoneViaGps = useCallback(
    async (lat: number, lng: number): Promise<Zone | null> => {
      const zoneData = await lookupZoneByGps(lat, lng);
      setZone(zoneData);

      return zoneData;
    },
    [setZone],
  );

  return { zone, setZone, updateZoneViaGps };
}

// The zone, re-checked from the location whenever the app comes to the
// front; plus when it was last checked and why it can't be checked now (if
// it can't), for the stale-location notice.
export function useUpdatedZone() {
  const { location, problem } = useLocation();
  const { zone, setZone } = useZone();
  const { data: checkedAt, setData: setCheckedAt } = zoneCheckStore.use();

  useEffect(() => {
    let cancelled = false;
    async function effect() {
      if (!location) return;
      const zoneData = await resolveZone(location);
      if (cancelled) return;
      if (JSON.stringify(zoneData) !== JSON.stringify(zone)) setZone(zoneData);
      setCheckedAt(Date.now());
    }

    effect();
    return () => {
      cancelled = true;
    };
    // zone is read only to skip an unchanged save; re-run on new fixes only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, setZone, setCheckedAt]);

  return { zone, checkedAt, problem };
}
