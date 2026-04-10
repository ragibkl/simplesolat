import { File, Directory, Paths } from "expo-file-system/next";
import { coalesce } from "./coalesce";

const cacheDir = new Directory(Paths.document, "file-cache");

function urlToFilename(url: string): string {
  const segments = url.split("/");
  return segments[segments.length - 1];
}

function ensureDir(): void {
  if (!cacheDir.exists) {
    cacheDir.create();
  }
}

export async function getCachedFileOrFetch<T>(
  url: string,
  fetchFn: () => Promise<T>,
): Promise<T> {
  ensureDir();
  const file = new File(cacheDir, urlToFilename(url));

  try {
    if (file.exists) {
      const raw = await file.text();
      return JSON.parse(raw) as T;
    }
  } catch {
    // Cache miss or read error, fetch fresh
  }

  return coalesce(url, async () => {
    const data = await fetchFn();
    if (!file.exists) {
      file.create();
    }
    file.write(JSON.stringify(data));
    return data;
  });
}

export async function clearStaleFiles(currentUrls: string[]): Promise<void> {
  ensureDir();
  const currentFilenames = new Set(currentUrls.map(urlToFilename));

  const contents = cacheDir.list();
  for (const item of contents) {
    if (!currentFilenames.has(item.name)) {
      item.delete();
    }
  }
}
