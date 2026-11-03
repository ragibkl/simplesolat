import { loadSettings, useSettings } from "@/lib/data/settingsStore";
import type { PrayerTime } from "@/lib/domain/prayerTime";

import type { StringKey } from "./strings";
import { Language, prayerName, resolveLanguage, t } from "./translate";

export * from "./translate";

// For background work (widgets, notifications): reads the saved setting.
export async function loadLanguage(): Promise<Language> {
  return resolveLanguage((await loadSettings()).language);
}

// For screens: follows the setting as it changes.
export function useI18n() {
  const { settings } = useSettings();
  const lang = resolveLanguage(settings.language);
  return {
    lang,
    t: (key: StringKey, vars?: Record<string, string | number>) =>
      t(lang, key, vars),
    prayerName: (prayer: keyof PrayerTime) => prayerName(lang, prayer),
  };
}
