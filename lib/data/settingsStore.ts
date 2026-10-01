import { createDataStore } from "./dataStore";
import { PrayerTime } from "@/lib/domain/prayerTime";

export type WidgetSecondColumn = "syuruk" | "dhuha";

export type Settings = {
  notifications: Record<keyof PrayerTime, boolean>;
  // Second column of the WaktuSolat and WaktuSolatTransparent widgets.
  // Dhuha falls back to Syuruk where there's no official dhuha.
  widgetSecondColumn: WidgetSecondColumn;
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
  widgetSecondColumn: "syuruk",
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
