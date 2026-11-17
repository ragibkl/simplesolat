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
  // The zone's own authority when it differs from the country's (Selangor's
  // 2027 district zones MFSGR01-09: "Mufti Selangor").
  source?: string;
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
