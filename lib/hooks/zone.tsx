import { useCallback, useEffect } from "react";

import { zoneStore } from "@/lib/data/zoneStore";
import { Zone } from "@/lib/domain/zone";
import { lookupZoneByGps } from "@/lib/service/zone";
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

export function useUpdatedZone() {
  const { location } = useLocation();
  const { zone, updateZoneViaGps } = useZone();

  useEffect(() => {
    async function effect() {
      if (location) {
        await updateZoneViaGps(
          location.coords.latitude,
          location.coords.longitude,
        );
      }
    }

    effect();
  }, [location, updateZoneViaGps]);

  return { zone };
}
