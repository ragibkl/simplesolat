import * as Location from "expo-location";
import { useState, useEffect } from "react";

import { useLocation } from "@/lib/hooks/location";
import { getQiblaBearing } from "@/lib/service/qibla";

export function useCompass() {
  const { location } = useLocation();
  const [heading, setHeading] = useState<number | null>(null);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    async function start() {
      subscription = await Location.watchHeadingAsync((data) => {
        if (data.trueHeading >= 0) {
          setHeading(data.trueHeading);
        } else {
          setHeading(data.magHeading);
        }
      });
    }

    start();

    return () => {
      subscription?.remove();
    };
  }, []);

  const qiblaBearing =
    location != null
      ? getQiblaBearing(location.coords.latitude, location.coords.longitude)
      : null;

  const ready = qiblaBearing != null && heading != null;

  return { heading, qiblaBearing, ready };
}
