import AsyncStorage from "@react-native-async-storage/async-storage";
import { coalesce } from "./coalesce";

const CACHE_PREFIX = "CACHE:";

type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

export async function getCachedOrFetch<T>(
  key: string,
  maxAgeMs: number,
  fetchFn: () => Promise<T>,
): Promise<T> {
  const cacheKey = `${CACHE_PREFIX}${key}`;

  let stale: CacheEntry<T> | null = null;
  try {
    const raw = await AsyncStorage.getItem(cacheKey);
    if (raw) {
      const entry: CacheEntry<T> = JSON.parse(raw);
      if (Date.now() - entry.timestamp < maxAgeMs) {
        return entry.data;
      }
      stale = entry;
    }
  } catch {
    // Cache miss or parse error, fetch fresh
  }

  return coalesce(cacheKey, async () => {
    let data: T;
    try {
      data = await fetchFn();
    } catch (error) {
      // Offline (e.g. travelling): an old copy beats nothing.
      if (stale) return stale.data;
      throw error;
    }
    const entry: CacheEntry<T> = { data, timestamp: Date.now() };
    await AsyncStorage.setItem(cacheKey, JSON.stringify(entry));
    return data;
  });
}
