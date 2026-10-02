import { WidgetExtraTime } from "@/lib/data/settingsStore";
import { PrayerTime } from "@/lib/domain/prayerTime";

export type WidgetColumn = { label: string; start: number; end?: number };

// Columns for the WaktuSolat and WaktuSolatTransparent widgets: the five
// prayers plus an optional extra time (Imsak, Syuruk or Dhuha). Where the zone
// has no official dhuha, Dhuha shows just the five prayers: Syuruk is not the
// start of Dhuha, so it mustn't stand in for it.
export function getWidgetColumns(
  prayerTime: PrayerTime,
  extraTime: WidgetExtraTime = "syuruk",
): WidgetColumn[] {
  const { imsak, fajr, syuruk, dhuha, dhuhr, asr, maghrib, isha } = prayerTime;

  let head: WidgetColumn[];
  if (extraTime === "none" || (extraTime === "dhuha" && dhuha === undefined)) {
    head = [{ label: "Fajr", start: fajr, end: syuruk }];
  } else if (extraTime === "imsak") {
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
