import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";

const GH_CACHE_PREFIX = "GH_CACHE:";
const GH_FILE_DIR = `${FileSystem.documentDirectory}gh-cache/`;

// --- AsyncStorage-based cache (small data: countries.yaml, zones yaml) ---

type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

export async function getCachedOrFetch<T>(
  key: string,
  maxAgeMs: number,
  fetchFn: () => Promise<T>,
): Promise<T> {
  const cacheKey = `${GH_CACHE_PREFIX}${key}`;

  try {
    const raw = await AsyncStorage.getItem(cacheKey);
    if (raw) {
      const entry: CacheEntry<T> = JSON.parse(raw);
      if (Date.now() - entry.timestamp < maxAgeMs) {
        return entry.data;
      }
    }
  } catch {
    // Cache miss or parse error, fetch fresh
  }

  const data = await fetchFn();
  const entry: CacheEntry<T> = { data, timestamp: Date.now() };
  await AsyncStorage.setItem(cacheKey, JSON.stringify(entry));
  return data;
}

// --- Filesystem-based cache (large data: geojson, mappings) ---

function urlToFilename(url: string): string {
  // Use the last path segment as filename (already datestamped and unique)
  const segments = url.split("/");
  return segments[segments.length - 1];
}

async function ensureDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(GH_FILE_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(GH_FILE_DIR, { intermediates: true });
  }
}

export async function getCachedFileOrFetch<T>(
  url: string,
  fetchFn: () => Promise<T>,
): Promise<T> {
  await ensureDir();
  const filepath = `${GH_FILE_DIR}${urlToFilename(url)}`;

  try {
    const info = await FileSystem.getInfoAsync(filepath);
    if (info.exists) {
      const raw = await FileSystem.readAsStringAsync(filepath);
      return JSON.parse(raw) as T;
    }
  } catch {
    // Cache miss or read error, fetch fresh
  }

  const data = await fetchFn();
  await FileSystem.writeAsStringAsync(filepath, JSON.stringify(data));
  return data;
}

export async function clearStaleFiles(currentUrls: string[]): Promise<void> {
  await ensureDir();
  const currentFilenames = new Set(currentUrls.map(urlToFilename));

  const files = await FileSystem.readDirectoryAsync(GH_FILE_DIR);
  for (const file of files) {
    if (!currentFilenames.has(file)) {
      await FileSystem.deleteAsync(`${GH_FILE_DIR}${file}`, {
        idempotent: true,
      });
    }
  }
}
