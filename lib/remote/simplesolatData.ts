import yaml from "js-yaml";

const BASE_URL = "https://ragibkl.github.io/simplesolat-data";

export type CountryConfig = {
  code: string;
  name: string;
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

export type GHPrayerTimeEntry = {
  date: string;
  imsak: string;
  fajr: string;
  syuruk: string;
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

export async function fetchPrayerTimesMonth(
  country: string,
  zone: string,
  year: number,
  month: number,
): Promise<GHPrayerTimeEntry[]> {
  const monthStr = month.toString().padStart(2, "0");
  const url = `${BASE_URL}/prayer-times/${country}/${zone}/${year}-${monthStr}.json`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return await response.json();
}
