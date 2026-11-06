import { WidgetExtraTime } from "@/lib/data/settingsStore";
import { getSyurukEnd, PrayerTime } from "@/lib/domain/prayerTime";
import { Language, prayerName } from "@/lib/i18n/translate";

export type WidgetColumn = { label: string; start: number; end?: number };

// Columns for the WaktuSolat and WaktuSolatTransparent widgets: the five
// prayers plus an optional extra time (Imsak, Syuruk or Dhuha). Where the zone
// has no official dhuha, Dhuha shows just the five prayers: Syuruk is not the
// start of Dhuha, so it mustn't stand in for it.
export function getWidgetColumns(
  prayerTime: PrayerTime,
  extraTime: WidgetExtraTime = "syuruk",
  lang: Language = "en",
): WidgetColumn[] {
  const { imsak, fajr, syuruk, dhuha, dhuhr, asr, maghrib, isha } = prayerTime;
  const name = (prayer: keyof PrayerTime) => prayerName(lang, prayer);

  let head: WidgetColumn[];
  if (extraTime === "none" || (extraTime === "dhuha" && dhuha === undefined)) {
    head = [{ label: name("fajr"), start: fajr, end: syuruk }];
  } else if (extraTime === "imsak") {
    head = [
      { label: name("imsak"), start: imsak, end: fajr },
      { label: name("fajr"), start: fajr, end: syuruk },
    ];
  } else if (extraTime === "dhuha" && dhuha !== undefined) {
    head = [
      { label: name("fajr"), start: fajr, end: syuruk },
      { label: name("dhuha"), start: dhuha, end: dhuhr },
    ];
  } else {
    head = [
      { label: name("fajr"), start: fajr, end: syuruk },
      { label: name("syuruk"), start: syuruk, end: getSyurukEnd(prayerTime) },
    ];
  }

  return [
    ...head,
    { label: name("dhuhr"), start: dhuhr, end: asr },
    { label: name("asr"), start: asr, end: maghrib },
    { label: name("maghrib"), start: maghrib, end: isha },
    { label: name("isha"), start: isha },
  ];
}
