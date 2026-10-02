import { createDataStore } from "./dataStore";
import { PrayerTime } from "@/lib/domain/prayerTime";

export type WidgetExtraTime = "imsak" | "syuruk" | "dhuha" | "none";

export type Settings = {
  notifications: Record<keyof PrayerTime, boolean>;
  // Extra time on the WaktuSolat and WaktuSolatTransparent widgets, next to
  // the five prayers, or none. Dhuha shows nothing where there's no official
  // dhuha (Syuruk is a different time, so it's no stand-in).
  widgetExtraTime: WidgetExtraTime;
  // Set once the user picks an extra time. Until then the old "with Imsak"
  // widget keeps showing Imsak.
  widgetExtraTimeChosen?: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  notifications: {
    imsak: true,
    fajr: true,
    syuruk: true,
    dhuha: false,
    dhuhr: true,
    asr: true,
    maghrib: true,
    isha: true,
  },
  widgetExtraTime: "syuruk",
};

export const settingsStore = createDataStore<Partial<Settings>>(
  "SETTINGS_V1_KEY",
  {},
);

// Stored settings may predate newer fields, so fill in the defaults.
export function withDefaults(stored: Partial<Settings>): Settings {
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    notifications: {
      ...DEFAULT_SETTINGS.notifications,
      ...stored.notifications,
    },
  };
}

// The old WaktuSolatImsak widget (hidden from the picker, still working where
// placed) follows the setting once the user has chosen one. Settings are saved
// whole, so a stored "syuruk" may just be the default; anything else was picked.
export function imsakWidgetExtraTime(settings: Settings): WidgetExtraTime {
  const chosen =
    settings.widgetExtraTimeChosen || settings.widgetExtraTime !== "syuruk";
  return chosen ? settings.widgetExtraTime : "imsak";
}

export async function loadSettings(): Promise<Settings> {
  try {
    return withDefaults(await settingsStore.load());
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function useSettings() {
  const { data } = settingsStore.use();
  return { settings: withDefaults(data) };
}

// Awaits the write, so the background services read the new settings.
export async function saveSettings(settings: Settings): Promise<void> {
  await settingsStore.save(settings);
}
