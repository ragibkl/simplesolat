import { addDays, addMonths, subMonths } from "date-fns";

import { removeLegacyCaches } from "@/lib/data/legacyCache";
import { readZoneFromCountry } from "@/lib/data/countryStore";
import {
  getText,
  hasFile,
  removeMonthsBefore,
  WEEKLY,
} from "@/lib/data/mirror";
import { zoneStore } from "@/lib/data/zoneStore";
import { calculateWaktuSolat } from "@/lib/domain/adhanCalculator";
import { localTimeToEpoch } from "@/lib/domain/datetime";
import { WaktuSolat } from "@/lib/domain/prayerTime";
import { getZoneCode, OfficialZone } from "@/lib/domain/zone";
import { PrayerTimeEntry } from "@/lib/remote/simplesolat";
import { loadMethods } from "./methods";
import { syncCountryInBackground } from "./offlineCountries";

// Official prayer times are the CDN's month files, kept in the mirror on the
// phone (cdn/prayer-times/MY/SGR01/2026-11.json) and checked weekly, so
// corrections arrive. A zone with no file of its own is read from a whole
// country kept for offline use (lib/data/countryStore.ts). Calculated zones
// are worked out on the phone.

const monthKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const monthPath = (zone: OfficialZone, month: string) =>
  `prayer-times/${zone.country}/${zone.zone}/${month}.json`;

// The last converted month per file, so widget updates every minute don't
// redo the work: reused while the file's text is unchanged.
const converted = new Map<string, { text: string; days: WaktuSolat[] }>();

function toWaktuSolat(
  zone: OfficialZone,
  entries: PrayerTimeEntry[],
): WaktuSolat[] {
  const { timezone } = zone;
  return entries.map((entry) => {
    const [y, m, d] = entry.date.split("-").map(Number);
    return {
      year: y,
      month: m,
      date: d,
      zone: zone.zone,
      prayerTime: {
        imsak: localTimeToEpoch(entry.date, entry.imsak, timezone),
        fajr: localTimeToEpoch(entry.date, entry.fajr, timezone),
        syuruk: localTimeToEpoch(entry.date, entry.syuruk, timezone),
        ...(entry.dhuha && {
          dhuha: localTimeToEpoch(entry.date, entry.dhuha, timezone),
        }),
        dhuhr: localTimeToEpoch(entry.date, entry.dhuhr, timezone),
        asr: localTimeToEpoch(entry.date, entry.asr, timezone),
        maghrib: localTimeToEpoch(entry.date, entry.maghrib, timezone),
        isha: localTimeToEpoch(entry.date, entry.isha, timezone),
      },
    };
  });
}

// The zone's own file if the mirror has it; else the zone from a whole
// country on the phone; else download the zone's file (quick) and fetch the
// whole country afterwards, in the background, for offline use.
async function monthText(zone: OfficialZone, month: string): Promise<string> {
  const path = monthPath(zone, month);
  if (hasFile(path)) return getText(path, WEEKLY);
  const fromCountry = await readZoneFromCountry(zone.country, zone.zone, month);
  if (fromCountry) return fromCountry;
  const text = await getText(path, WEEKLY);
  syncCountryInBackground(zone.country);
  return text;
}

// A zone's month, converted. Throws MirrorError (with the reason) if it isn't
// on the phone and can't be downloaded.
export async function getMonth(
  zone: OfficialZone,
  month: string,
): Promise<WaktuSolat[]> {
  const path = monthPath(zone, month);
  const text = await monthText(zone, month);
  const memo = converted.get(path);
  if (memo && memo.text === text) return memo.days;
  const days = toWaktuSolat(zone, JSON.parse(text) as PrayerTimeEntry[]);
  converted.set(path, { text, days });
  return days;
}

let tidied = false;

// Once per run, after today's times came from the mirror: drop months before
// last month, and the caches from before the mirror.
function tidyUp(date: Date) {
  if (tidied) return;
  tidied = true;
  try {
    removeMonthsBefore("prayer-times", monthKey(subMonths(date, 1)));
  } catch {}
  removeLegacyCaches().catch(() => {});
}

export async function getOfficialWaktuSolat(
  zone: OfficialZone,
  date: Date,
): Promise<WaktuSolat | null> {
  const days = await getMonth(zone, monthKey(date));
  // Keep next month on the phone too, for offline use at the end of the
  // month. It may not be published yet (e.g. next year in December).
  getMonth(zone, monthKey(addMonths(date, 1))).catch(() => {});
  tidyUp(date);
  return days.find((d) => d.date === date.getDate()) ?? null;
}

export async function getOrRetrieveWaktuSolat(date: Date) {
  const zone = await zoneStore.load();
  if (!zone) return null;

  if (zone.type === "calculated") {
    await loadMethods();
    return calculateWaktuSolat(
      date,
      getZoneCode(zone),
      zone.lat,
      zone.lng,
      zone.country,
    );
  }

  return getOfficialWaktuSolat(zone, date);
}

// Today and the following days, for reminders, widgets and the pinned
// notification. Stops at the first day it can't get (e.g. next month not
// published yet), keeping the days before it.
export async function getUpcomingWaktuSolat(
  date: Date,
  days: number,
): Promise<WaktuSolat[]> {
  const result: WaktuSolat[] = [];
  for (let i = 0; i < days; i++) {
    let waktuSolat: WaktuSolat | null;
    try {
      waktuSolat = await getOrRetrieveWaktuSolat(addDays(date, i));
    } catch (error) {
      if (i === 0) throw error;
      break;
    }
    if (!waktuSolat) break;
    result.push(waktuSolat);
  }
  return result;
}
