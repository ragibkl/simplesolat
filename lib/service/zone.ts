import PolygonLookup from "polygon-lookup";

import { getCachedOrFetch } from "@/lib/data/asyncCacheStore";
import {
  getCachedFileOrFetch,
  clearStaleFiles,
} from "@/lib/data/fileCacheStore";
import { zoneStore } from "@/lib/data/zoneStore";
import { CalculatedZone, Zone } from "@/lib/domain/zone";
import {
  fetchCountries,
  fetchZones,
  fetchGeoJson,
  fetchMapping,
  CountryConfig,
  ZoneConfig,
} from "@/lib/remote/simplesolat";

import countriesGeoData from "@/assets/geodata/countries-adm0.json";

import { getLocation } from "./location";

const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;

// Bundled ADM0 for fast country detection
const countriesLookup = new PolygonLookup(countriesGeoData as any);

// In-memory cache for PolygonLookup instances (per country)
const lookupCache = new Map<
  string,
  { lookup: PolygonLookup; geojsonUrl: string }
>();

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

async function getCountries(): Promise<CountryConfig[]> {
  return getCachedOrFetch("countries", ONE_MONTH_MS, fetchCountries);
}

async function getZonesForCountry(countryCode: string): Promise<ZoneConfig[]> {
  return getCachedOrFetch(`zones:${countryCode}`, ONE_MONTH_MS, () =>
    fetchZones(countryCode),
  );
}

async function getPolygonLookup(
  country: CountryConfig,
): Promise<PolygonLookup> {
  const cached = lookupCache.get(country.code);
  if (cached && cached.geojsonUrl === country.geojson) {
    return cached.lookup;
  }

  const geojson = await getCachedFileOrFetch(country.geojson, () =>
    fetchGeoJson(country.geojson),
  );

  const lookup = new PolygonLookup(geojson as any);
  lookupCache.set(country.code, { lookup, geojsonUrl: country.geojson });
  return lookup;
}

async function getMapping(
  country: CountryConfig,
): Promise<Record<string, { zone: string; state: string }>> {
  return getCachedFileOrFetch(country.mapping, () =>
    fetchMapping(country.mapping),
  );
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

export async function lookupZoneByGps(lat: number, lng: number): Promise<Zone> {
  const country = lookupCountry(lat, lng);

  if (!country) {
    return buildCalculatedZone(lat, lng, null, null);
  }

  const countries = await getCountries();
  const countryConfig = countries.find((c) => c.code === country.iso);

  if (!countryConfig) {
    return buildCalculatedZone(lat, lng, country.iso, country.name);
  }

  // Clean up stale geojson/mapping files
  const allUrls = countries.flatMap((c) => [c.geojson, c.mapping]);
  clearStaleFiles(allUrls).catch(() => {});

  // Resolve zone via polygon lookup
  const lookup = await getPolygonLookup(countryConfig);
  const result = lookup.search(lng, lat);

  if (!result || !result.properties) {
    return buildCalculatedZone(lat, lng, country.iso, country.name);
  }

  const lookupKey = result.properties[countryConfig.shape_property];
  const district = result.properties.shapeName;
  if (!lookupKey) {
    return buildCalculatedZone(lat, lng, country.iso, country.name);
  }

  const mapping = await getMapping(countryConfig);
  const zoneEntry = mapping[lookupKey];

  if (!zoneEntry) {
    return buildCalculatedZone(lat, lng, country.iso, country.name);
  }

  const zones = await getZonesForCountry(country.iso);
  const zoneConfig = zones.find((z) => z.code === zoneEntry.zone);

  if (!zoneConfig) {
    return buildCalculatedZone(lat, lng, country.iso, country.name);
  }

  return {
    type: "official",
    zone: zoneEntry.zone,
    country: country.iso,
    state: zoneEntry.state,
    district,
    timezone: zoneConfig.timezone,
    source: countryConfig.source,
  };
}

export async function updateZoneViaGps(
  lat: number,
  lng: number,
): Promise<Zone> {
  const existingZone = await zoneStore.load();
  const newZone = await lookupZoneByGps(lat, lng);

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
