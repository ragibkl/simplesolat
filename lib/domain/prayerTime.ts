export type PrayerTime = {
  imsak: number;
  fajr: number;
  syuruk: number;
  // Only where the authority publishes it (JAKIM, KHEU, Kemenag).
  dhuha?: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
};

// Syuruk is sunrise: Subuh ends and prayer is forbidden until Dhuha starts.
// Where the authority publishes Dhuha (JAKIM, KHEU, Kemenag: 22 to 34
// minutes later) Syuruk ends there; elsewhere after a default of our own.
const SYURUK_DEFAULT_SECONDS = 15 * 60;

export function getSyurukEnd(prayerTime: PrayerTime): number {
  return prayerTime.dhuha ?? prayerTime.syuruk + SYURUK_DEFAULT_SECONDS;
}

export type WaktuSolat = {
  year: number;
  month: number;
  date: number;
  zone: string;
  prayerTime: PrayerTime;
};

export function getTimeText(epochSeconds: number): string {
  const date = new Date(0);
  date.setUTCSeconds(epochSeconds);
  return date.toLocaleString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}
