import { Language, t } from "@/lib/i18n/translate";

import { getCalculationMethod } from "./adhanCalculator";

export type OfficialZone = {
  type: "official";
  zone: string;
  country: string;
  state: string;
  district: string;
  timezone: string;
  source: string;
};

export type CalculatedZone = {
  type: "calculated";
  lat: number;
  lng: number;
  country: string;
  countryName: string;
};

export type Zone = OfficialZone | CalculatedZone;

export function getZoneCode(zone: Zone): string {
  if (zone.type === "official") return zone.zone;
  return `CALC_${zone.lat.toFixed(2)}_${zone.lng.toFixed(2)}`;
}

export function getZoneDisplayName(zone: Zone): string {
  if (zone.type === "official") return zone.district;
  return zone.countryName;
}

export function getZoneLocationText(zone: Zone): string {
  if (zone.type === "official") return `${zone.district}, ${zone.state}`;
  return zone.countryName;
}

export function getZoneInfoText(zone: Zone, lang: Language = "en"): string {
  if (zone.type === "official") {
    return t(lang, "zone.source", { zone: zone.zone, source: zone.source });
  }
  return t(lang, "zone.calculated", {
    method: getCalculationMethod(zone.country).label,
  });
}
