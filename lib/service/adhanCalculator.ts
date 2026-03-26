import {
  PrayerTimes,
  Coordinates,
  CalculationMethod,
  Madhab,
  CalculationParameters,
} from "adhan";

import { WaktuSolat } from "@/lib/data/waktuSolatStore";
import { getCalculationMethod } from "./calculationMethod";

function customMethod(fajrAngle: number, ishaAngle: number) {
  return () => {
    const params = CalculationMethod.Other();
    params.fajrAngle = fajrAngle;
    params.ishaAngle = ishaAngle;
    return params;
  };
}

function customMethodIshaOffset(fajrAngle: number, ishaOffsetMinutes: number) {
  return () => {
    const params = CalculationMethod.Other();
    params.fajrAngle = fajrAngle;
    params.ishaInterval = ishaOffsetMinutes;
    return params;
  };
}

const METHODS: Record<string, () => CalculationParameters> = {
  // Built-in methods
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
  // Custom methods
  Jordan: customMethod(18, 18),
  Algeria: customMethod(18, 17),
  Tunisia: customMethod(18, 18),
  France: customMethod(12, 12),
  Russia: customMethod(16, 15),
  Morocco: customMethod(19, 17),
  Portugal: customMethodIshaOffset(18, 77),
};

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
  const { method } = getCalculationMethod(country);
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
