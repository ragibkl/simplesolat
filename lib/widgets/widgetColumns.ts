import { WidgetExtraTime } from "@/lib/data/settingsStore";
import { PrayerTime } from "@/lib/domain/prayerTime";

export type WidgetColumn = { label: string; start: number; end?: number };

// Columns for the WaktuSolat and WaktuSolatTransparent widgets. The extra
// time is Syuruk, Dhuha or Imsak; Dhuha falls back to Syuruk where the zone
// has no official dhuha time.
export function getWidgetColumns(
  prayerTime: PrayerTime,
  extraTime: WidgetExtraTime = "syuruk",
): WidgetColumn[] {
  const { imsak, fajr, syuruk, dhuha, dhuhr, asr, maghrib, isha } = prayerTime;

  let head: WidgetColumn[];
  if (extraTime === "imsak") {
    head = [
      { label: "Imsak", start: imsak, end: fajr },
      { label: "Fajr", start: fajr, end: syuruk },
    ];
  } else if (extraTime === "dhuha" && dhuha !== undefined) {
    head = [
      { label: "Fajr", start: fajr, end: syuruk },
      { label: "Dhuha", start: dhuha, end: dhuhr },
    ];
  } else {
    head = [
      { label: "Fajr", start: fajr, end: syuruk },
      { label: "Syuruk", start: syuruk, end: dhuhr },
    ];
  }

  return [
    ...head,
    { label: "Dhuhr", start: dhuhr, end: asr },
    { label: "Asr", start: asr, end: maghrib },
    { label: "Maghrib", start: maghrib, end: isha },
    { label: "Isha", start: isha },
  ];
}
