import { PrayerTimes, Coordinates, Madhab } from "adhan";

import { methodFor, toParams } from "@/lib/domain/methods";
import { WaktuSolat } from "@/lib/domain/prayerTime";

// Which method a country uses, and its parameters, come from methods.yaml
// (lib/domain/methods.ts).

export function getCalculationMethod(countryIso: string | null): {
  method: string;
  label: string;
} {
  const { name, def } = methodFor(countryIso);
  return { method: name, label: def.label };
}

// --- Prayer time calculation ---

function toEpochSeconds(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}

export function calculateWaktuSolat(
  date: Date,
  zoneCode: string,
  lat: number,
  lng: number,
  country: string,
): WaktuSolat {
  const coordinates = new Coordinates(lat, lng);
  const params = toParams(methodFor(country).def);
  params.madhab = Madhab.Shafi;

  const pt = new PrayerTimes(coordinates, date, params);

  const fajr = toEpochSeconds(pt.fajr);

  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    date: date.getDate(),
    zone: zoneCode,
    prayerTime: {
      imsak: fajr - 10 * 60,
      fajr,
      syuruk: toEpochSeconds(pt.sunrise),
      dhuhr: toEpochSeconds(pt.dhuhr),
      asr: toEpochSeconds(pt.asr),
      maghrib: toEpochSeconds(pt.maghrib),
      isha: toEpochSeconds(pt.isha),
    },
  };
}
