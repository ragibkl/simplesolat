import { Directory, File, Paths } from "expo-file-system";

import { coalesce } from "./coalesce";
import { CDN_URL } from "./mirror";

// Whole countries kept on the phone for offline use (travelling): the CDN's
// monthly country files (prayer-times/<CC>/<YYYY-MM>.json, every zone in
// one file), stored apart from the per-zone mirror with their own ETag check.
//
//   offline/<CC>/<YYYY-MM>.json        the country file, as downloaded
//   offline/<CC>/<YYYY-MM>.meta.json   its ETag and last check
//   offline/<CC>/<YYYY-MM>/<ZONE>.json one zone cut from it, when needed
//
// Everything here is a cache: a zone is cut from the country file only when
// a lookup needs it (so daily reads stay one small file), and the cut zones
// are deleted whenever the country file changes.

const root = new Directory(Paths.document, "offline");
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

type Meta = { etag: string | null; checkedAt: number };

const countryDir = (cc: string) => new Directory(root, cc);
const countryFile = (cc: string, month: string) =>
  new File(countryDir(cc), `${month}.json`);
const metaFile = (cc: string, month: string) =>
  new File(countryDir(cc), `${month}.meta.json`);
const cutDir = (cc: string, month: string) =>
  new Directory(countryDir(cc), month);

function readMeta(cc: string, month: string): Meta | null {
  try {
    const file = metaFile(cc, month);
    return file.exists ? (JSON.parse(file.textSync()) as Meta) : null;
  } catch {
    return null;
  }
}

function writeText(file: File, text: string) {
  if (!file.exists) file.create({ intermediates: true });
  file.write(text);
}

// Written beside the target and moved over it, so a reader in another task
// (the Android widget) never sees half a file.
async function saveAtomically(file: File, text: string) {
  const tmp = new File(file.parentDirectory, `${file.name}.tmp`);
  if (tmp.exists) tmp.delete();
  tmp.create({ intermediates: true });
  tmp.write(text);
  await tmp.move(file, { overwrite: true });
}

export type SyncResult = "updated" | "unchanged" | "fresh" | "missing";

// Downloads (or checks) one country month. Fresh copies are left alone for a
// week unless `force`; a check of an unchanged file costs a 304. Throws when
// offline or the server fails (callers in the background ignore that).
export function syncCountryMonth(
  cc: string,
  month: string,
  force = false,
): Promise<SyncResult> {
  return coalesce(`country:${cc}:${month}`, async () => {
    const file = countryFile(cc, month);
    const meta = readMeta(cc, month);
    const now = Date.now();
    if (!force && file.exists && meta && now - meta.checkedAt < WEEK_MS) {
      return "fresh";
    }
    const response = await fetch(
      `${CDN_URL}/prayer-times/${cc}/${month}.json`,
      {
        headers:
          file.exists && meta?.etag ? { "If-None-Match": meta.etag } : {},
      },
    );
    if (response.status === 304 && file.exists) {
      writeText(
        metaFile(cc, month),
        JSON.stringify({ ...meta, checkedAt: now }),
      );
      return "unchanged";
    }
    // Not published yet (e.g. next year in December).
    if (response.status === 404) return "missing";
    if (!response.ok)
      throw new Error(`country ${cc} ${month}: HTTP ${response.status}`);

    const text = await response.text();
    await saveAtomically(file, text);
    // Zones cut from the old copy may be out of date now.
    const cut = cutDir(cc, month);
    if (cut.exists) cut.delete();
    writeText(
      metaFile(cc, month),
      JSON.stringify({ etag: response.headers.get("etag"), checkedAt: now }),
    );
    return "updated";
  });
}

// One zone's month from the phone's country store, or null if the country
// file isn't here (or doesn't have the zone). Cuts the zone out of the
// country file the first time and keeps it, so later reads are small.
export async function readZoneFromCountry(
  cc: string,
  zone: string,
  month: string,
): Promise<string | null> {
  return coalesce(`country-zone:${cc}:${zone}:${month}`, async () => {
    const cut = new File(cutDir(cc, month), `${zone}.json`);
    try {
      if (cut.exists) return await cut.text();
    } catch {}
    const file = countryFile(cc, month);
    if (!file.exists) return null;
    let entries: unknown;
    try {
      entries = (JSON.parse(await file.text()) as Record<string, unknown>)[
        zone
      ];
    } catch {
      return null;
    }
    if (!entries) return null;
    const text = JSON.stringify(entries);
    try {
      writeText(cut, text);
    } catch (error) {
      console.log("couldn't keep the cut zone:", error);
    }
    return text;
  });
}

export type CountryOffline = {
  months: string[];
  bytes: number;
  checkedAt: number | null;
};

// What's on the phone for a country (for Settings).
export function countryOffline(cc: string): CountryOffline {
  const dir = countryDir(cc);
  const result: CountryOffline = { months: [], bytes: 0, checkedAt: null };
  if (!dir.exists) return result;
  const walk = (d: Directory) => {
    for (const item of d.list()) {
      if (item instanceof Directory) walk(item);
      else result.bytes += item.size ?? 0;
    }
  };
  walk(dir);
  for (const item of dir.list()) {
    const m = item.name.match(/^(\d{4}-\d{2})\.json$/)?.[1];
    if (!m) continue;
    result.months.push(m);
    const checked = readMeta(cc, m)?.checkedAt ?? null;
    if (checked && (!result.checkedAt || checked > result.checkedAt)) {
      result.checkedAt = checked;
    }
  }
  result.months.sort();
  return result;
}

export function removeCountry(cc: string) {
  const dir = countryDir(cc);
  if (dir.exists) dir.delete();
}

// Deletes months before `month` (and their cut zones) for every country.
export function removeCountryMonthsBefore(month: string) {
  if (!root.exists) return;
  for (const dir of root.list()) {
    if (!(dir instanceof Directory)) continue;
    for (const item of dir.list()) {
      const m = item.name.match(/^(\d{4}-\d{2})/)?.[1];
      if (m && m < month) item.delete();
    }
  }
}
