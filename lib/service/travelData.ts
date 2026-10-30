import { addMonths } from "date-fns";
import { Directory, File, Paths } from "expo-file-system";

import { getCachedOrFetch } from "@/lib/data/asyncCacheStore";
import {
  fetchPrayerTimesMonth,
  PrayerTimeEntry,
} from "@/lib/remote/simplesolat";

import { cacheCountryForTravel } from "./zone";

// Prayer times kept on the phone for travelling without a connection: every
// zone in the country the user is in, and its close neighbours, for this
// month and next. A zone's month is about 6 KB (all of Malaysia ~400 KB a
// month), so it's downloaded quietly, once a month.

// Countries people often cross into by road from each country.
const NEIGHBOURS: Record<string, string[]> = {
  BN: ["MY"],
  MY: ["BN", "SG"],
  SG: ["MY"],
};

// Own folder: the file cache in fileCacheStore deletes files it doesn't know.
const dir = new Directory(Paths.document, "travel-cache");

const monthKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

function monthFile(country: string, zone: string, month: string): File {
  if (!dir.exists) dir.create();
  return new File(dir, `${country}-${zone}-${month}.json`);
}

// A zone's month: from the phone if it was downloaded before, otherwise from
// the data CDN (and kept for next time). Throws PrayerTimesError if it isn't
// on the phone and can't be downloaded.
export async function getPrayerTimesMonth(
  country: string,
  zone: string,
  year: number,
  month: number,
): Promise<PrayerTimeEntry[]> {
  const key = `${year}-${String(month).padStart(2, "0")}`;
  const file = monthFile(country, zone, key);
  try {
    if (file.exists) return JSON.parse(await file.text());
  } catch {
    // Unreadable: download it again.
  }
  const entries = await fetchPrayerTimesMonth(country, zone, year, month);
  try {
    if (!file.exists) file.create();
    file.write(JSON.stringify(entries));
  } catch (error) {
    console.log("travel cache write failed:", error);
  }
  return entries;
}

// Deletes months before the current one.
function removeOldMonths(current: string) {
  if (!dir.exists) return;
  for (const item of dir.list()) {
    const month = item.name.match(/(\d{4}-\d{2})\.json$/)?.[1];
    if (month && month < current) item.delete();
  }
}

async function downloadCountry(country: string, months: string[]) {
  const zones = await cacheCountryForTravel(country);
  if (!zones) return;
  const jobs = zones.flatMap((z) =>
    months.map((m) => ({ zone: z.code, month: m })),
  );
  let missingThisMonth = 0;
  // A few at a time, so it stays light on a slow connection.
  for (let i = 0; i < jobs.length; i += 4) {
    await Promise.all(
      jobs.slice(i, i + 4).map(async ({ zone, month }) => {
        const [y, m] = month.split("-").map(Number);
        try {
          await getPrayerTimesMonth(country, zone, y, m);
        } catch {
          // Next month may not be published yet, so only this month counts.
          if (month === months[0]) missingThisMonth++;
        }
      }),
    );
  }
  if (missingThisMonth)
    throw new Error(`${missingThisMonth} zones missing for ${months[0]}`);
}

// Makes sure this country and its neighbours are on the phone for this month
// and next. Cheap to call often: it only downloads once a month per country
// (files already on the phone are skipped). Errors are ignored; it tries
// again on a later call.
export async function ensureTravelData(country: string, date: Date) {
  const months = [monthKey(date), monthKey(addMonths(date, 1))];
  removeOldMonths(months[0]);
  for (const code of [country, ...(NEIGHBOURS[country] ?? [])]) {
    try {
      // Marks the country done for the month; a failed run isn't marked.
      await getCachedOrFetch(
        `travel:${code}:${months[0]}`,
        31 * 24 * 60 * 60 * 1000,
        async () => {
          await downloadCountry(code, months);
          return true;
        },
      );
    } catch (error) {
      console.log(`travel data for ${code} not downloaded:`, error);
    }
  }
}
