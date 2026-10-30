import AsyncStorage from "@react-native-async-storage/async-storage";
import { Directory, File, Paths } from "expo-file-system";

import { WaktuSolat } from "@/lib/domain/prayerTime";

// The caches used before the CDN mirror (app 1.3.6 and older): AsyncStorage
// "CACHE:<key>" entries, files in file-cache/ and the prayer-times store.
// Only read as a fallback when the app is updated offline; each one is
// deleted as soon as the mirror has its replacement. This file can go in a
// later release, once phones have moved over.

export async function readLegacyEntry<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(`CACHE:${key}`);
    return raw ? ((JSON.parse(raw) as { data: T }).data ?? null) : null;
  } catch {
    return null;
  }
}

const legacyDir = new Directory(Paths.document, "file-cache");
const legacyFile = (url: string) => new File(legacyDir, url.split("/").pop()!);

export async function readLegacyFile<T>(url: string): Promise<T | null> {
  try {
    const file = legacyFile(url);
    return file.exists ? (JSON.parse(await file.text()) as T) : null;
  } catch {
    return null;
  }
}

export async function removeLegacyEntry(key: string) {
  await AsyncStorage.removeItem(`CACHE:${key}`);
}

export async function removeLegacyFile(url: string) {
  const file = legacyFile(url);
  if (file.exists) file.delete();
  if (legacyDir.exists && legacyDir.list().length === 0) legacyDir.delete();
}

// The mirror first; if it fails (offline with nothing in the mirror yet), the
// old cache. Once the mirror has it, the old copy is deleted.
export async function withLegacy<T>(
  fromMirror: () => Promise<T>,
  fromLegacy: () => Promise<T | null>,
  removeLegacy: () => Promise<void>,
): Promise<T> {
  try {
    const value = await fromMirror();
    removeLegacy().catch(() => {});
    return value;
  } catch (error) {
    const old = await fromLegacy();
    if (old !== null) return old;
    throw error;
  }
}

// The pre-mirror prayer-times store: converted days keyed "y::m::d::zone".
const LEGACY_TIMES_KEY = "WAKTU_SOLAT_STORE_V4_KEY";

export async function readLegacyTimes(
  zone: string,
  date: Date,
): Promise<WaktuSolat | null> {
  try {
    const raw = await AsyncStorage.getItem(LEGACY_TIMES_KEY);
    if (!raw) return null;
    const key = [
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate(),
      zone,
    ].join("::");
    return (JSON.parse(raw) as Record<string, WaktuSolat>)[key] ?? null;
  } catch {
    return null;
  }
}

// Called once today's times come from the mirror.
export async function removeLegacyTimes() {
  await AsyncStorage.removeItem(LEGACY_TIMES_KEY);
}
