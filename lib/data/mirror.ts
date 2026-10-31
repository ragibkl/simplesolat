import { Directory, File, Paths } from "expo-file-system";
import { load as parseYaml } from "js-yaml";

import { coalesce } from "./coalesce";

// A copy of the simplesolat-data CDN on the phone, with the CDN's own paths
// (cdn/countries.yaml, cdn/zones/MY.yaml, cdn/geojson/...). Files are read
// from the phone when fresh enough; otherwise downloaded and kept. Freshness
// uses the CDN's ETags, so a check on an unchanged file costs a few hundred
// bytes (304). Offline, the copy on the phone is used however old it is.
// Design: side-project-notes simplesolat/design/2026-10-local-cdn-mirror.md

export const CDN_URL = "https://simplesolat-data.netlify.app";

const root = new Directory(Paths.document, "cdn");

// Why a file couldn't be loaded, so the screen can say what to do.
export type LoadFailure = "offline" | "notFound" | "server";

export class MirrorError extends Error {
  constructor(
    public reason: LoadFailure,
    path: string,
  ) {
    super(`${path}: ${reason}`);
    this.name = "MirrorError";
  }
}

// How often to ask the CDN whether a file changed; null = never (files whose
// name changes when their content does, like the dated maps).
export type Policy = { checkEveryMs: number | null };

export const WEEKLY: Policy = { checkEveryMs: 7 * 24 * 60 * 60 * 1000 };
export const NEVER: Policy = { checkEveryMs: null };

type Meta = { etag: string | null; checkedAt: number };

// "zones/MY.yaml" from a path or a full CDN URL (countries.yaml lists maps by
// URL).
export function toPath(pathOrUrl: string): string {
  return pathOrUrl.startsWith(CDN_URL)
    ? pathOrUrl.slice(CDN_URL.length + 1)
    : pathOrUrl;
}

const fileAt = (path: string, suffix = "") => {
  const parts = path.split("/");
  const name = parts.pop()! + suffix;
  return new File(root, ...parts, name);
};

function readMeta(path: string): Meta | null {
  try {
    const meta = fileAt(path, ".meta.json");
    return meta.exists ? (JSON.parse(meta.textSync()) as Meta) : null;
  } catch {
    return null;
  }
}

function writeMeta(path: string, meta: Meta) {
  try {
    const file = fileAt(path, ".meta.json");
    if (!file.exists) file.create({ intermediates: true });
    file.write(JSON.stringify(meta));
  } catch (error) {
    console.log("mirror meta write failed:", path, error);
  }
}

// Written beside the target and then moved over it, so another task (the
// Android widget runs separately) never reads half a file.
async function save(path: string, text: string) {
  const target = fileAt(path);
  const tmp = fileAt(path, ".tmp");
  if (tmp.exists) tmp.delete();
  tmp.create({ intermediates: true });
  tmp.write(text);
  await tmp.move(target, { overwrite: true });
}

export async function getText(pathOrUrl: string, policy: Policy) {
  const path = toPath(pathOrUrl);
  return coalesce(`mirror:${path}`, async () => {
    const file = fileAt(path);
    const have = file.exists;
    const meta = readMeta(path);
    const now = Date.now();
    const fresh =
      have &&
      (policy.checkEveryMs === null ||
        (meta !== null && now - meta.checkedAt < policy.checkEveryMs));
    if (fresh) return file.text();

    let response: Response;
    try {
      response = await fetch(`${CDN_URL}/${path}`, {
        headers: have && meta?.etag ? { "If-None-Match": meta.etag } : {},
      });
    } catch {
      if (have) return file.text();
      throw new MirrorError("offline", path);
    }

    if (response.status === 304 && have) {
      writeMeta(path, { etag: meta?.etag ?? null, checkedAt: now });
      return file.text();
    }
    if (!response.ok) {
      // Keep using the copy rather than fail on a server hiccup.
      if (have) return file.text();
      throw new MirrorError(
        response.status === 404 ? "notFound" : "server",
        path,
      );
    }

    const text = await response.text();
    await save(path, text);
    writeMeta(path, { etag: response.headers.get("etag"), checkedAt: now });
    return text;
  });
}

export async function getJson<T>(pathOrUrl: string, policy: Policy) {
  return JSON.parse(await getText(pathOrUrl, policy)) as T;
}

export async function getYaml<T>(pathOrUrl: string, policy: Policy) {
  return parseYaml(await getText(pathOrUrl, policy)) as T;
}

// Deletes files in a mirror folder (e.g. "geojson") that aren't in `keep`
// (paths or URLs), with their metadata.
export function removeOthers(folder: string, keep: string[]) {
  const dir = new Directory(root, ...folder.split("/"));
  if (!dir.exists) return;
  const names = new Set(keep.map((k) => toPath(k).split("/").pop()));
  for (const item of dir.list()) {
    if (!(item instanceof File)) continue;
    const base = item.name.replace(/\.(meta\.json|tmp)$/, "");
    if (!names.has(base)) item.delete();
  }
}

// Deletes month files (…/YYYY-MM.json) before `month` anywhere under a
// mirror folder (e.g. "prayer-times"), with their metadata.
export function removeMonthsBefore(folder: string, month: string) {
  const walk = (dir: Directory) => {
    for (const item of dir.list()) {
      if (item instanceof Directory) {
        walk(item);
        continue;
      }
      const m = item.name.match(/^(\d{4}-\d{2})\.json/)?.[1];
      if (m && m < month) item.delete();
    }
  };
  const dir = new Directory(root, ...folder.split("/"));
  if (dir.exists) walk(dir);
}

// Whether the mirror has a copy of this file (fresh or not).
export function hasFile(pathOrUrl: string): boolean {
  return fileAt(toPath(pathOrUrl)).exists;
}

// Size in bytes of the copy on the phone (0 if there's none).
export function fileSize(pathOrUrl: string): number {
  const file = fileAt(toPath(pathOrUrl));
  return file.exists ? (file.size ?? 0) : 0;
}
