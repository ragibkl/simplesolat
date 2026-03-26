import { createDataStore } from "./dataStore";

export type OfficialZone = {
  type: "official";
  zone: string;
  country: string;
  state: string;
  district: string;
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

export const zoneStore = createDataStore<Zone | null>(
  "ZONE_STORE_V3_KEY",
  null,
);
