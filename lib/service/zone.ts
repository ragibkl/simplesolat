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

import { getLocation, GetLocationOptions } from "./location";

const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;

// Bundled ADM0 for fast country detection: Natural Earth 1:10m countries,
// simplified to 20% with coordinates rounded to ~10 m (2.2 MB)
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
  const result = countriesLookup.search(lng, lat) ?? nearbyCountry(lat, lng);
  if (!result || !result.properties) return null;
  return {
    iso: result.properties.ISO_A2,
    name: result.properties.NAME,
  };
}

// Even a detailed world map leaves small islands and some shores in the
// sea (Manama, Malé): take the nearest country within about 20 km. Its
// name and calculation method then apply; open sea stays unknown.
const COUNTRY_NEARBY_STEPS_DEG = [0.02, 0.05, 0.1, 0.2];

function nearbyCountry(lat: number, lng: number) {
  for (const step of COUNTRY_NEARBY_STEPS_DEG) {
    for (const [dLat, dLng] of DIRECTIONS) {
      const result = countriesLookup.search(
        lng + dLng * step,
        lat + dLat * step,
      );
      if (result) return result;
    }
  }
  return undefined;
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

// The bundled country map is coarse (Natural Earth: Singapore is 5 points,
// Brunei 21), so coasts and islands such as Colombo, George Town, Muara or
// Changi fall outside every country. So it only suggests candidates: the
// country it finds, then every country whose outline box, widened by this
// margin, holds the point. Each candidate's detailed zone map decides.
const COUNTRY_MARGIN_DEG = 0.5;
// About 1, 2 and 4 km, in eight directions.
const NEARBY_STEPS_DEG = [0.01, 0.02, 0.04];
const DIRECTIONS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];

type BBox = { minLng: number; minLat: number; maxLng: number; maxLat: number };

function boxesByCountry(): Map<string, BBox> {
  const boxes = new Map<string, BBox>();
  for (const feature of (countriesGeoData as any).features) {
    const iso: string | undefined = feature.properties?.ISO_A2;
    const geometry = feature.geometry;
    if (!iso || !geometry) continue;
    const polygons: number[][][][] =
      geometry.type === "Polygon"
        ? [geometry.coordinates]
        : geometry.coordinates;
    const box = boxes.get(iso) ?? {
      minLng: Infinity,
      minLat: Infinity,
      maxLng: -Infinity,
      maxLat: -Infinity,
    };
    for (const [lng, lat] of polygons.flat(2)) {
      box.minLng = Math.min(box.minLng, lng);
      box.minLat = Math.min(box.minLat, lat);
      box.maxLng = Math.max(box.maxLng, lng);
      box.maxLat = Math.max(box.maxLat, lat);
    }
    boxes.set(iso, box);
  }
  return boxes;
}

const countryBoxes = boxesByCountry();

function nearbyCountries(lat: number, lng: number): string[] {
  const m = COUNTRY_MARGIN_DEG;
  return [...countryBoxes.entries()]
    .filter(
      ([, b]) =>
        lng >= b.minLng - m &&
        lng <= b.maxLng + m &&
        lat >= b.minLat - m &&
        lat <= b.maxLat + m,
    )
    .map(([iso]) => iso);
}

// The official zone containing the point in this country's detailed map.
async function lookupOfficialZone(
  countryConfig: CountryConfig,
  lat: number,
  lng: number,
): Promise<Zone | null> {
  const lookup = await getPolygonLookup(countryConfig);
  const result = lookup.search(lng, lat);
  if (!result || !result.properties) return null;

  const lookupKey = result.properties[countryConfig.shape_property];
  const district = result.properties.shapeName;
  if (!lookupKey) return null;

  const mapping = await getMapping(countryConfig);
  const zoneEntry = mapping[lookupKey];
  if (!zoneEntry) return null;

  const zones = await getZonesForCountry(countryConfig.code);
  const zoneConfig = zones.find((z) => z.code === zoneEntry.zone);
  if (!zoneConfig) return null;

  return {
    type: "official",
    zone: zoneEntry.zone,
    country: countryConfig.code,
    state: zoneEntry.state,
    district,
    timezone: zoneConfig.timezone,
    source: countryConfig.source,
  };
}

export async function lookupZoneByGps(lat: number, lng: number): Promise<Zone> {
  const country = lookupCountry(lat, lng);
  const candidates = [
    ...new Set([
      ...(country ? [country.iso] : []),
      ...nearbyCountries(lat, lng),
    ]),
  ];

  let countries: CountryConfig[];
  try {
    countries = await getCountries();
  } catch (error) {
    // Offline with nothing cached: an ocean point used to skip this fetch.
    if (!country) return buildCalculatedZone(lat, lng, null, null);
    throw error;
  }

  // Clean up stale geojson/mapping files
  const allUrls = countries.flatMap((c) => [c.geojson, c.mapping]);
  clearStaleFiles(allUrls).catch(() => {});

  const configs = candidates
    .map((iso) => countries.find((c) => c.code === iso))
    .filter((c): c is CountryConfig => c !== undefined);

  for (const countryConfig of configs) {
    const zone = await lookupOfficialZone(countryConfig, lat, lng);
    if (zone) return zone;
  }

  // On a beach or a pier the point can sit just outside the district maps
  // (Port Dickson): take the nearest district within about 4 km.
  for (const step of NEARBY_STEPS_DEG) {
    for (const [dLat, dLng] of DIRECTIONS) {
      for (const countryConfig of configs) {
        const zone = await lookupOfficialZone(
          countryConfig,
          lat + dLat * step,
          lng + dLng * step,
        );
        if (zone) return zone;
      }
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

export async function getUpdatedZone(
  options: GetLocationOptions = {},
): Promise<Zone | null> {
  const location = await getLocation(options);
  if (location) {
    return await updateZoneViaGps(
      location.coords.latitude,
      location.coords.longitude,
    );
  }

  return await zoneStore.load();
}
