import PolygonLookup from "polygon-lookup";

import { OfficialZone, CalculatedZone, Zone } from "@/lib/data/zoneStore";
import {
  getCachedOrFetch,
  getCachedFileOrFetch,
  clearStaleFiles,
} from "@/lib/data/ghCacheStore";
import {
  fetchCountries,
  fetchZones,
  fetchGeoJson,
  fetchMapping,
  CountryConfig,
  ZoneConfig,
} from "@/lib/remote/simplesolatData";

import countriesGeoData from "@/assets/geodata/countries-adm0.json";

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
  // Check in-memory cache first
  const cached = lookupCache.get(country.code);
  if (cached && cached.geojsonUrl === country.geojson) {
    return cached.lookup;
  }

  // Fetch geojson (cached to filesystem by URL)
  const geojson = await getCachedFileOrFetch(country.geojson, () =>
    fetchGeoJson(country.geojson),
  );

  const lookup = new PolygonLookup(geojson);
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

export async function lookupZoneByGpsGH(
  lat: number,
  lng: number,
): Promise<Zone> {
  const country = lookupCountry(lat, lng);

  if (!country) {
    return buildCalculatedZone(lat, lng, null, null);
  }

  // Check if this country is officially supported
  const countries = await getCountries();
  const countryConfig = countries.find((c) => c.code === country.iso);

  if (!countryConfig) {
    return buildCalculatedZone(lat, lng, country.iso, country.name);
  }

  // Clean up stale geojson/mapping files
  const allUrls = countries.flatMap((c) => [c.geojson, c.mapping]);
  clearStaleFiles(allUrls).catch(() => {}); // fire and forget

  // Resolve zone via polygon lookup
  const lookup = await getPolygonLookup(countryConfig);
  const result = lookup.search(lng, lat);

  if (!result || !result.properties) {
    return buildCalculatedZone(lat, lng, country.iso, country.name);
  }

  const shapeName = result.properties[countryConfig.shape_property];
  if (!shapeName) {
    return buildCalculatedZone(lat, lng, country.iso, country.name);
  }

  const mapping = await getMapping(countryConfig);
  const zoneEntry = mapping[shapeName];

  if (!zoneEntry) {
    return buildCalculatedZone(lat, lng, country.iso, country.name);
  }

  // Get timezone from zones yaml
  const zones = await getZonesForCountry(country.iso);
  const zoneConfig = zones.find((z) => z.code === zoneEntry.zone);

  const officialZone: OfficialZone = {
    type: "official",
    zone: zoneEntry.zone,
    country: country.iso,
    state: zoneEntry.state,
    district: shapeName,
    timezone: zoneConfig?.timezone,
  };

  return officialZone;
}

/** Export for use in prayer time fetching */
export { getZonesForCountry };
