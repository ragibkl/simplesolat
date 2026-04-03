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

export function getTimeText(epochSeconds: number): string {
  const date = new Date(0);
  date.setUTCSeconds(epochSeconds);
  return date.toLocaleString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}
