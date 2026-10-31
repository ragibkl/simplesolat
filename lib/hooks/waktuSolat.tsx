import { addDays } from "date-fns";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppState } from "react-native";

import { calculateWaktuSolat } from "@/lib/domain/adhanCalculator";
import { WaktuSolat } from "@/lib/domain/prayerTime";
import { getZoneCode } from "@/lib/domain/zone";
import { LoadFailure, MirrorError } from "@/lib/data/mirror";
import { loadMethods } from "@/lib/service/methods";
import { getOfficialWaktuSolat } from "@/lib/service/waktuSolat";
import { useCurrentDate } from "./date";
import { useZone } from "./zone";

function useWaktuSolatForDate(date: Date) {
  const { zone } = useZone();

  const [waktuSolat, setWaktuSolat] = useState<WaktuSolat | null>(null);
  // Why the times couldn't be loaded, shown instead of empty times.
  const [failure, setFailure] = useState<LoadFailure | null>(null);
  // Bumped to try again: the Retry button, or the app coming back.
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function effect() {
      if (!zone) {
        setWaktuSolat(null);
        return;
      }

      if (zone.type === "calculated") {
        await loadMethods();
        if (cancelled) return;
        const w = calculateWaktuSolat(
          date,
          getZoneCode(zone),
          zone.lat,
          zone.lng,
          zone.country,
        );
        setWaktuSolat(w);
        setFailure(null);
        return;
      }

      try {
        const w = await getOfficialWaktuSolat(zone, date);
        if (cancelled) return;
        setWaktuSolat(w);
        setFailure(w ? null : "notFound");
      } catch (error) {
        if (cancelled) return;
        // Don't keep showing another zone's or day's times.
        setWaktuSolat(null);
        setFailure(error instanceof MirrorError ? error.reason : "server");
      }
    }

    effect();
    return () => {
      cancelled = true;
    };
  }, [zone, date, attempt]);

  // Try again when the app comes back to the front, if it failed.
  useEffect(() => {
    if (!failure) return;
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") retry();
    });
    return () => sub.remove();
  }, [failure, retry]);

  return { waktuSolat, failure, retry };
}

export function useWaktuSolatCurrent() {
  const { date } = useCurrentDate();
  return useWaktuSolatForDate(date);
}

export function useWaktuSolatTomorrow() {
  const { date } = useCurrentDate();
  const tomorrow = useMemo(() => addDays(date, 1), [date]);
  const { waktuSolat, failure, retry } = useWaktuSolatForDate(tomorrow);
  return {
    waktuSolatTomorrow: waktuSolat,
    tomorrowFailure: failure,
    retryTomorrow: retry,
    tomorrow,
  };
}
