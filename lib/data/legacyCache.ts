import AsyncStorage from "@react-native-async-storage/async-storage";
import { Directory, File, Paths } from "expo-file-system";

// Read-only access to the caches used before the CDN mirror (app 1.3.6 and
// older): AsyncStorage "CACHE:<key>" entries and files in file-cache/. Only
// a fallback for a phone that updates the app while offline, so it can still
// find its zone; once the mirror has the file it's never read. Remove in a
// later release, together with the old data.

export async function readLegacyEntry<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(`CACHE:${key}`);
    return raw ? ((JSON.parse(raw) as { data: T }).data ?? null) : null;
  } catch {
    return null;
  }
}

export async function readLegacyFile<T>(url: string): Promise<T | null> {
  try {
    const file = new File(
      new Directory(Paths.document, "file-cache"),
      url.split("/").pop()!,
    );
    return file.exists ? (JSON.parse(await file.text()) as T) : null;
  } catch {
    return null;
  }
}

// The mirror first; if it fails (offline with nothing in the mirror yet), the
// old cache.
export async function withLegacy<T>(
  fromMirror: () => Promise<T>,
  fromLegacy: () => Promise<T | null>,
): Promise<T> {
  try {
    return await fromMirror();
  } catch (error) {
    const old = await fromLegacy();
    if (old !== null) return old;
    throw error;
  }
}
