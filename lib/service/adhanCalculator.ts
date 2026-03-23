import {
  PrayerTimes,
  Coordinates,
  CalculationMethod,
  Madhab,
  CalculationParameters,
} from "adhan";

import { WaktuSolat } from "@/lib/data/waktuSolatStore";

const METHODS: Record<string, () => CalculationParameters> = {
  MuslimWorldLeague: () => CalculationMethod.MuslimWorldLeague(),
  UmmAlQura: () => CalculationMethod.UmmAlQura(),
  Egyptian: () => CalculationMethod.Egyptian(),
  Karachi: () => CalculationMethod.Karachi(),
  NorthAmerica: () => CalculationMethod.NorthAmerica(),
  Dubai: () => CalculationMethod.Dubai(),
  Qatar: () => CalculationMethod.Qatar(),
  Kuwait: () => CalculationMethod.Kuwait(),
  Turkey: () => CalculationMethod.Turkey(),
  Tehran: () => CalculationMethod.Tehran(),
  Singapore: () => CalculationMethod.Singapore(),
};

function toEpochSeconds(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}

export function calculateWaktuSolat(
  date: Date,
  zoneCode: string,
  lat: number,
  lng: number,
  method: string,
): WaktuSolat {
  const coordinates = new Coordinates(lat, lng);
  const params = (METHODS[method] ?? METHODS.MuslimWorldLeague)();
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
