import { getLocales } from "expo-localization";

import type { PrayerTime } from "@/lib/domain/prayerTime";

import { en, ms, StringKey } from "./strings";

// Pure translation helpers (no settings): safe to use from lib/domain.

// The app's languages. "system" follows the phone: Malay if the phone's first
// language is Malay, English otherwise.
export type Language = "en" | "ms";
export type LanguageSetting = "system" | Language;

export const LANGUAGES: { key: LanguageSetting; label?: string }[] = [
  { key: "system" },
  { key: "en", label: "English" },
  { key: "ms", label: "Bahasa Melayu" },
];

const TABLES: Record<Language, Record<StringKey, string>> = { en, ms };

export function resolveLanguage(
  setting: LanguageSetting | undefined,
): Language {
  if (setting === "en" || setting === "ms") return setting;
  try {
    return getLocales()[0]?.languageCode === "ms" ? "ms" : "en";
  } catch {
    return "en";
  }
}

export function t(
  lang: Language,
  key: StringKey,
  vars?: Record<string, string | number>,
): string {
  let text = TABLES[lang][key] ?? en[key];
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.split(`{${name}}`).join(String(value));
    }
  }
  return text;
}

export function prayerName(lang: Language, prayer: keyof PrayerTime): string {
  return t(lang, `prayer.${prayer}` as StringKey);
}

const MS_DAYS = ["Ahd", "Isn", "Sel", "Rab", "Kha", "Jum", "Sab"];
const MS_MONTHS = [
  "Jan",
  "Feb",
  "Mac",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Ogo",
  "Sep",
  "Okt",
  "Nov",
  "Dis",
];

// The date line on the home screen and the widgets: "Sat Oct 31 2026" in
// English (as before), "Sab 31 Okt 2026" in Malay.
export function dateText(lang: Language, date: Date): string {
  if (lang === "en") return date.toDateString();
  return `${MS_DAYS[date.getDay()]} ${date.getDate()} ${MS_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

// A short date for Settings ("31 Oct", "31 Okt").
export function shortDateText(lang: Language, date: Date): string {
  if (lang === "en") {
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  }
  return `${date.getDate()} ${MS_MONTHS[date.getMonth()]}`;
}
