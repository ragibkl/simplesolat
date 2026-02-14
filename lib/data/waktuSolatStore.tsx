import { createDataStore } from "./dataStore";

export type PrayerTime = {
  imsak: number;
  fajr: number;
  syuruk: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
};

export type WaktuSolat = {
  year: number;
  month: number;
  date: number;
  zone: string;
  prayerTime: PrayerTime;
};

export type WaktuSolatStore = {
  [key: string]: WaktuSolat;
};

export const waktuSolatStore = createDataStore<WaktuSolatStore>(
  "WAKTU_SOLAT_STORE_V3_KEY",
  {},
);
