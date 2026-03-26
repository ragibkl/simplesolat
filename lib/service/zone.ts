import PolygonLookup from "polygon-lookup";

import {
  zoneStore,
  Zone,
  OfficialZone,
  CalculatedZone,
} from "@/lib/data/zoneStore";
import { getLocation } from "./location";

import countriesGeoData from "@/assets/geodata/countries-adm0.json";
import jakimGeoData from "@/assets/geodata/malaysia-district-jakim.json";
import singaporeGeoData from "@/assets/geodata/singapore-adm0.json";
import indonesiaGeoData from "@/assets/geodata/indonesia-adm2.json";
import indonesiaZoneMapping from "@/assets/geodata/adm2_zone_mapping_id.json";
import bruneiGeoData from "@/assets/geodata/brunei-adm1.json";
import bruneiZoneMapping from "@/assets/geodata/adm1_zone_mapping_bn.json";

const countriesLookup = new PolygonLookup(countriesGeoData as any);
const jakimLookup = new PolygonLookup(jakimGeoData as any);
const singaporeLookup = new PolygonLookup(singaporeGeoData as any);
const indonesiaLookup = new PolygonLookup(indonesiaGeoData as any);
const bruneiLookup = new PolygonLookup(bruneiGeoData as any);

function lookupCountry(
  lat: number,
  lng: number,
): { iso: string; name: string } | null {
  const result = countriesLookup.search(lng, lat);
  if (!result || !result.properties) return null;
  return {
    iso: result.properties.ISO_A2,
    name: result.properties.NAME,
  };
}

function lookupMalaysiaZone(lat: number, lng: number): OfficialZone | null {
  const result = jakimLookup.search(lng, lat);
  if (!result || !result.properties) return null;

  return {
    type: "official",
    zone: result.properties.jakim_code,
    country: "MY",
    state: result.properties.state,
    district: result.properties.name,
  };
}

function lookupSingaporeZone(): OfficialZone {
  return {
    type: "official",
    zone: "SGP01",
    country: "SG",
    state: "Singapore",
    district: "Singapore",
  };
}

function lookupBruneiZone(lat: number, lng: number): OfficialZone | null {
  const result = bruneiLookup.search(lng, lat);
  if (!result || !result.properties) return null;

  const shapeName = result.properties.shapeName;
  const mapping = (
    bruneiZoneMapping as Record<string, { zone: string; district: string }>
  )[shapeName];
  if (!mapping) return null;

  return {
    type: "official",
    zone: mapping.zone,
    country: "BN",
    state: "Brunei",
    district: mapping.district,
  };
}

function lookupIndonesiaZone(lat: number, lng: number): OfficialZone | null {
  const result = indonesiaLookup.search(lng, lat);
  if (!result || !result.properties) return null;

  const shapeName = result.properties.shapeName;
  const mapping = (
    indonesiaZoneMapping as Record<string, { zone: string; province: string }>
  )[shapeName];
  if (!mapping) return null;

  return {
    type: "official",
    zone: mapping.zone,
    country: "ID",
    state: mapping.province,
    district: shapeName,
  };
}

function buildCalculatedZone(
  lat: number,
  lng: number,
  countryIso: string | null,
  countryName: string | null,
): CalculatedZone {
  return {
    type: "calculated",
    lat,
    lng,
    country: countryIso ?? "XX",
    countryName: countryName ?? "Unknown",
  };
}

export function lookupZoneByGps(lat: number, lng: number): Zone {
  const country = lookupCountry(lat, lng);

  switch (country?.iso) {
    case "MY": {
      const zone = lookupMalaysiaZone(lat, lng);
      if (zone) return zone;
      break;
    }
    case "SG":
      return lookupSingaporeZone();
    case "BN": {
      const zone = lookupBruneiZone(lat, lng);
      if (zone) return zone;
      break;
    }
    case "ID": {
      const zone = lookupIndonesiaZone(lat, lng);
      if (zone) return zone;
      break;
    }
  }

  return buildCalculatedZone(
    lat,
    lng,
    country?.iso ?? null,
    country?.name ?? null,
  );
}

export async function updateZoneViaGps(
  lat: number,
  lng: number,
): Promise<Zone> {
  const existingZone = await zoneStore.load();
  const newZone = lookupZoneByGps(lat, lng);

  if (
    existingZone &&
    JSON.stringify(existingZone) === JSON.stringify(newZone)
  ) {
    return existingZone;
  }

  await zoneStore.save(newZone);
  return newZone;
}

export async function getUpdatedZone(): Promise<Zone | null> {
  const location = await getLocation();
  if (location) {
    return await updateZoneViaGps(
      location.coords.latitude,
      location.coords.longitude,
    );
  }

  return await zoneStore.load();
}
