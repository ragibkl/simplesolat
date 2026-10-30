import yaml from "js-yaml";

const BASE_URL = "https://simplesolat-data.netlify.app";

export type CountryConfig = {
  code: string;
  name: string;
  source: string;
  geojson: string;
  mapping: string;
  shape_property: string;
};

export type ZoneConfig = {
  code: string;
  country: string;
  state: string;
  location: string;
  timezone: string;
  shapes: string[];
};

export type PrayerTimeEntry = {
  date: string;
  imsak: string;
  fajr: string;
  syuruk: string;
  dhuha?: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
};

export async function fetchCountries(): Promise<CountryConfig[]> {
  const response = await fetch(`${BASE_URL}/countries.yaml`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const text = await response.text();
  const parsed = yaml.load(text) as { countries: CountryConfig[] };
  return parsed.countries;
}

export async function fetchZones(countryCode: string): Promise<ZoneConfig[]> {
  const response = await fetch(`${BASE_URL}/zones/${countryCode}.yaml`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const text = await response.text();
  const parsed = yaml.load(text) as { zones: ZoneConfig[] };
  return parsed.zones;
}

export async function fetchGeoJson(url: string): Promise<any> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return await response.json();
}

export async function fetchMapping(
  url: string,
): Promise<Record<string, { zone: string; state: string }>> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return await response.json();
}

// Why a month's times couldn't be loaded: no connection, not published yet,
// or the servers failed. Shown to the user, so they know what to do.
export type LoadFailure = "offline" | "notFound" | "server";

export class PrayerTimesError extends Error {
  constructor(public reason: LoadFailure) {
    super(`Prayer times not loaded: ${reason}`);
    this.name = "PrayerTimesError";
  }
}

// Fetches JSON, or says why it couldn't: "offline" when the request never
// got an answer.
async function tryFetchJson(
  url: string,
): Promise<{ data: unknown } | { failure: LoadFailure }> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    return { failure: "offline" };
  }
  if (response.status === 404) return { failure: "notFound" };
  if (!response.ok) return { failure: "server" };
  try {
    return { data: await response.json() };
  } catch {
    return { failure: "server" };
  }
}

// A month of times from the data CDN.
export async function fetchPrayerTimesMonth(
  country: string,
  zone: string,
  year: number,
  month: number,
): Promise<PrayerTimeEntry[]> {
  const monthStr = `${year}-${month.toString().padStart(2, "0")}`;
  const result = await tryFetchJson(
    `${BASE_URL}/prayer-times/${country}/${zone}/${monthStr}.json`,
  );
  if ("data" in result) return result.data as PrayerTimeEntry[];
  throw new PrayerTimesError(result.failure);
}
