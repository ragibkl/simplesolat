import {
  PrayerTimes,
  Coordinates,
  CalculationMethod,
  Madhab,
  CalculationParameters,
} from "adhan";

import { WaktuSolat } from "@/lib/domain/prayerTime";

// --- Country → calculation method mapping ---

const COUNTRY_METHODS: Record<string, { method: string; label: string }> = {
  // Built-in adhan methods
  SA: { method: "UmmAlQura", label: "Umm Al-Qura" },
  AE: { method: "Dubai", label: "Dubai" },
  EG: { method: "Egyptian", label: "Egyptian" },
  TR: { method: "Turkey", label: "Turkey" },
  PK: { method: "Karachi", label: "Karachi" },
  QA: { method: "Qatar", label: "Qatar" },
  KW: { method: "Kuwait", label: "Kuwait" },
  US: { method: "NorthAmerica", label: "ISNA" },
  CA: { method: "NorthAmerica", label: "ISNA" },
  IR: { method: "Tehran", label: "Tehran" },
  // Custom methods
  JO: { method: "Jordan", label: "Jordan" },
  DZ: { method: "Algeria", label: "Algeria" },
  TN: { method: "Tunisia", label: "Tunisia" },
  FR: { method: "France", label: "UOIF" },
  RU: { method: "Russia", label: "Russia" },
  MA: { method: "Morocco", label: "Morocco" },
  PT: { method: "Portugal", label: "Lisbon" },
  // Gulf region (Bahrain, Oman, Yemen) — follows Umm Al-Qura
  BH: { method: "UmmAlQura", label: "Umm Al-Qura" },
  OM: { method: "UmmAlQura", label: "Umm Al-Qura" },
  YE: { method: "UmmAlQura", label: "Umm Al-Qura" },
};

const DEFAULT_METHOD = {
  method: "MuslimWorldLeague",
  label: "Muslim World League",
};

export function getCalculationMethod(countryIso: string | null): {
  method: string;
  label: string;
} {
  if (!countryIso) return DEFAULT_METHOD;
  return COUNTRY_METHODS[countryIso] ?? DEFAULT_METHOD;
}

// --- Adhan calculation parameters ---

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
  Jordan: customMethod(18, 18),
  Algeria: customMethod(18, 17),
  Tunisia: customMethod(18, 18),
  France: customMethod(12, 12),
  Russia: customMethod(16, 15),
  Morocco: customMethod(19, 17),
  Portugal: customMethodIshaOffset(18, 77),
};

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
