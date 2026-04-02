import AsyncStorage from "@react-native-async-storage/async-storage";
import { File, Directory, Paths } from "expo-file-system/next";

const GH_CACHE_PREFIX = "GH_CACHE:";
const ghCacheDir = new Directory(Paths.document, "gh-cache");

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
  const segments = url.split("/");
  return segments[segments.length - 1];
}

function ensureDir(): void {
  if (!ghCacheDir.exists) {
    ghCacheDir.create();
  }
}

export async function getCachedFileOrFetch<T>(
  url: string,
  fetchFn: () => Promise<T>,
): Promise<T> {
  ensureDir();
  const file = new File(ghCacheDir, urlToFilename(url));

  try {
    if (file.exists) {
      const raw = file.text();
      return JSON.parse(raw) as T;
    }
  } catch {
    // Cache miss or read error, fetch fresh
  }

  const data = await fetchFn();
  file.create();
  file.write(JSON.stringify(data));
  return data;
}

export async function clearStaleFiles(currentUrls: string[]): Promise<void> {
  ensureDir();
  const currentFilenames = new Set(currentUrls.map(urlToFilename));

  const contents = ghCacheDir.list();
  for (const item of contents) {
    if (!currentFilenames.has(item.name)) {
      item.delete();
    }
  }
}
