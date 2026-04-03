import AsyncStorage from "@react-native-async-storage/async-storage";

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
