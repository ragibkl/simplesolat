import { format } from "date-fns";
import { Platform } from "react-native";

import PinnedNotification from "@/modules/pinned-notification";
import { loadSettings } from "@/lib/data/settingsStore";
import { getTimeText, WaktuSolat } from "@/lib/domain/prayerTime";
import { getZoneDisplayName, Zone } from "@/lib/domain/zone";
import { Language, prayerName, resolveLanguage, t } from "@/lib/i18n/translate";

import { getUpcomingWaktuSolat } from "./waktuSolat";

// Days handed to the native side, so it keeps working through midnight and
// for a while if the background task doesn't run.
const PINNED_DAYS = 3;

function dayColumns(waktuSolat: WaktuSolat, lang: Language) {
  const { fajr, syuruk, dhuhr, asr, maghrib, isha } = waktuSolat.prayerTime;
  // Same bold rule as the widgets: Fajr until Syuruk, Isha until midnight.
  return [
    { label: prayerName(lang, "fajr"), start: fajr, end: syuruk },
    { label: prayerName(lang, "dhuhr"), start: dhuhr, end: asr },
    { label: prayerName(lang, "asr"), start: asr, end: maghrib },
    { label: prayerName(lang, "maghrib"), start: maghrib, end: isha },
    { label: prayerName(lang, "isha"), start: isha },
  ].map(({ label, start, end }) => ({
    label,
    // No am/pm, so five columns fit across a phone.
    time: getTimeText(start).replace(/\s*[ap]\.?\s?m\.?$/i, ""),
    start: start * 1000,
    end: end === undefined ? null : end * 1000,
  }));
}

// Android: shows (or removes) the pinned notification with the five prayer
// times, following the setting. No-op on iOS.
export async function updatePinnedNotification(date: Date, zone: Zone) {
  if (Platform.OS !== "android" || !PinnedNotification) return;

  const { pinnedNotification, language } = await loadSettings();
  const lang = resolveLanguage(language);
  if (!pinnedNotification) {
    await PinnedNotification.stop();
    return;
  }

  const days = await getUpcomingWaktuSolat(date, PINNED_DAYS);
  await PinnedNotification.update(
    JSON.stringify({
      subText: getZoneDisplayName(zone),
      // The native side's own texts, in the app language.
      texts: {
        channel: t(lang, "pinned.channel"),
        channelDescription: t(lang, "pinned.channelDescription"),
        title: t(lang, "pinned.title"),
        openToUpdate: t(lang, "pinned.openToUpdate"),
        nextIn: t(lang, "pinned.nextIn"),
      },
      days: days.map((waktuSolat) => ({
        date: format(
          new Date(waktuSolat.year, waktuSolat.month - 1, waktuSolat.date),
          "yyyy-MM-dd",
        ),
        columns: dayColumns(waktuSolat, lang),
      })),
    }),
  );
}
