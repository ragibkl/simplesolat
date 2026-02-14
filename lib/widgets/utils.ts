import { PrayerTime } from "@/lib/data/waktuSolatStore";

export function getTimeText(epochSeconds: number) {
  const date = new Date(0);
  date.setUTCSeconds(epochSeconds);
  return date.toLocaleString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const PRAYER_ORDER: (keyof PrayerTime)[] = [
  "imsak",
  "fajr",
  "syuruk",
  "dhuhr",
  "asr",
  "maghrib",
  "isha",
];

export function getNextPrayer(
  prayerTime: PrayerTime,
  currentEpoch: number,
  nextDayImsak?: number,
): { label: string; epochSeconds: number } | null {
  for (const key of PRAYER_ORDER) {
    if (prayerTime[key] > currentEpoch) {
      return {
        label: key.charAt(0).toUpperCase() + key.slice(1),
        epochSeconds: prayerTime[key],
      };
    }
  }

  if (nextDayImsak) {
    return { label: "Imsak", epochSeconds: nextDayImsak };
  }

  return null;
}
