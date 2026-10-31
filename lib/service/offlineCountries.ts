import { addMonths } from "date-fns";

import {
  removeCountry,
  removeCountryMonthsBefore,
  syncCountryMonth,
  SyncResult,
} from "@/lib/data/countryStore";
import { loadSettings, saveSettings } from "@/lib/data/settingsStore";
import { Zone } from "@/lib/domain/zone";
import { syncCountryMaps } from "@/lib/service/zone";

// Which countries are kept on the phone for offline use, and keeping them up
// to date (this month and next). The country you're in is added when you
// arrive; others are added in Settings → Offline data.

const monthKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const months = (date: Date) => [monthKey(date), monthKey(addMonths(date, 1))];

// The country's map files first (so its zones can be found offline), then
// the prayer times.
async function syncCountry(cc: string, date: Date, force = false) {
  await syncCountryMaps(cc);
  const results: SyncResult[] = [];
  for (const month of months(date)) {
    results.push(await syncCountryMonth(cc, month, force));
  }
  return results;
}

// After a zone file was downloaded for a lookup: fetch the whole country too,
// in the background, so the rest of it works offline.
export function syncCountryInBackground(cc: string) {
  syncCountry(cc, new Date()).catch((error) =>
    console.log(`country ${cc} not downloaded:`, error),
  );
}

// From the background update and when the app opens. Adds the country you're
// in (once per arrival), then checks every kept country. Never throws.
export async function syncOfflineCountries(date: Date, zone: Zone | null) {
  try {
    let settings = await loadSettings();
    const kept = new Set(settings.offlineCountries ?? []);
    if (
      zone?.type === "official" &&
      settings.offlineAutoCountry !== zone.country
    ) {
      kept.add(zone.country);
      settings = {
        ...settings,
        offlineCountries: [...kept],
        offlineAutoCountry: zone.country,
      };
      await saveSettings(settings);
    }
    removeCountryMonthsBefore(monthKey(date));
    for (const cc of kept) {
      try {
        await syncCountry(cc, date);
      } catch (error) {
        console.log(`country ${cc} not synced:`, error);
      }
    }
  } catch (error) {
    console.log("offline countries not synced:", error);
  }
}

// Settings → Download: keep the country and download it now. Throws if it
// can't be downloaded (shown to the user).
export async function downloadCountryNow(cc: string) {
  const settings = await loadSettings();
  const kept = new Set(settings.offlineCountries ?? []);
  kept.add(cc);
  await saveSettings({ ...settings, offlineCountries: [...kept] });
  const results = await syncCountry(cc, new Date(), true);
  if (results[0] === "missing") throw new Error("not published");
}

// Settings → Remove: stop keeping the country and delete its prayer times
// from the phone. Its maps and zone files for places you've been stay in the
// mirror.
export async function removeOfflineCountry(cc: string) {
  const settings = await loadSettings();
  await saveSettings({
    ...settings,
    offlineCountries: (settings.offlineCountries ?? []).filter((c) => c !== cc),
  });
  removeCountry(cc);
}
