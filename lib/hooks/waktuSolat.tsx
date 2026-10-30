import { addDays } from "date-fns";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";

import { waktuSolatStore } from "@/lib/data/waktuSolatStore";
import { calculateWaktuSolat } from "@/lib/domain/adhanCalculator";
import { WaktuSolat } from "@/lib/domain/prayerTime";
import { getZoneCode, OfficialZone } from "@/lib/domain/zone";
import { LoadFailure, PrayerTimesError } from "@/lib/remote/simplesolat";
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
        const w = await fetchWaktuSolat(zone, date);
        if (cancelled) return;
        setWaktuSolat(w);
        setFailure(w ? null : "notFound");
      } catch (error) {
        if (cancelled) return;
        // Don't keep showing another zone's or day's times.
        setWaktuSolat(null);
        setFailure(error instanceof PrayerTimesError ? error.reason : "server");
      }
    }

    effect();
    return () => {
      cancelled = true;
    };
  }, [zone, fetchWaktuSolat, date, attempt]);

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
