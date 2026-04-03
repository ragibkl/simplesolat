# Architecture

## Design Principles

- **Privacy-first zone resolution** — GPS-to-zone lookup happens entirely on-device using geojson polygon data. No location data is sent to any server. The CDN only receives the zone code in the prayer times URL path.
- **Minimal network calls** — Geojson and zone config are cached to disk (indefinite / 1 month). Prayer times cached for 2 months. Most days require zero network requests.
- **Offline-capable** — Official zones cache 2 months of prayer times per visited zone. Calculated zones (adhan-js) work entirely offline with no network access needed.
- **Fully automatic widgets** — Home screen widgets update automatically in the background every 15 minutes. When you cross a zone boundary (e.g., driving from KL to Johor), the widget detects the new zone via GPS and refreshes with the correct prayer times — no need to open the app or manually select a zone.
- **Dynamic country support** — Supported countries and zone data are driven by upstream `countries.yaml`. Adding a new country requires no app update.

## App Startup

1. `app/_layout.tsx` mounts, wraps app in `zoneStore.Provider` and `waktuSolatStore.Provider`
2. `requestAllPermissions()` runs once — requests foreground/background location, notifications, exact alarms, battery optimization
3. Main screen (`app/index.tsx`) renders and triggers hooks

## Data Flow

```
GPS → Country Detection (bundled ADM0) → Zone Resolution (fetched geojson) → Prayer Times (CDN, HH:MM) → Timezone Conversion → Display / Notifications / Widgets
```

### 1. Location Polling

- `useLocation()` fetches GPS on app resume and date change
- Parameters: maxAge 15min, required accuracy 3km
- Falls back to cached location if GPS fails

### 2. Zone Resolution

`lookupZoneByGps(lat, lng)` in `lib/service/zone.ts`:

1. **Country detection** — Bundled Natural Earth ADM0 geojson (729KB) → country ISO code (sync, instant)
2. **Country config** — Fetch `countries.yaml` from CDN (cached 1 month) → check if country is officially supported
3. **Zone lookup** — Fetch country's geojson + mapping from CDN (cached indefinitely by URL) → `PolygonLookup.search()` → shapeName → mapping → zone code
4. **Zone timezone** — Fetch `zones/{CC}.yaml` from CDN (cached 1 month) → IANA timezone for the zone
5. **Result** — `OfficialZone { zone, country, state, district, timezone, source }` or `CalculatedZone` for unsupported countries
6. Zone is persisted to AsyncStorage via `zoneStore`

### 3. Prayer Time Fetching

`fetchAndMergePrayerTimes()` in `lib/service/waktuSolat.ts`:

1. Check local cache: `waktuSolatStore[year::month::date::zone]`
2. If cached → return immediately
3. If not cached:
   - Acquire per-zone mutex lock (prevents duplicate fetches)
   - Double-check cache after acquiring lock (previous holder may have fetched)
   - **Official zones**: fetch monthly JSON from CDN (`prayer-times/{CC}/{zone}/{year}-{month}.json`), convert HH:MM → epoch using zone's IANA timezone via `date-fns-tz`
   - **Calculated zones**: compute locally via adhan-js
   - Merge into cache, trim entries older than yesterday
   - Release lock

### 4. Display

Main screen uses:

- `useWaktuSolatCurrent()` — today's prayer times
- `useWaktuSolatTomorrow()` — tomorrow's (swipe to view)
- `useUpdatedZone()` — current zone from GPS

## Background Task

Registered in `lib/tasks/backgroundTasks.ts`. OS triggers every ~15 minutes.

Each run:

1. Fetch GPS → resolve zone
2. Load/fetch prayer times for today
3. Update all widget styles (parallel)
4. Reschedule prayer time notifications

## Notifications

`lib/service/notifee.ts`:

- **7 notifications** scheduled per day (one per prayer time)
- **Deterministic IDs**: `waktu_solat::prayer::year::month::date::zone` — same ID replaces, preventing duplicates
- **Trigger**: `SET_ALARM_CLOCK` with `allowWhileIdle: true` (survives Doze mode)
- **Channel**: single `waktu_solat` channel with `AndroidImportance.HIGH`
- On notification delivery → widget update triggered immediately (`lib/service/notifeeBackground.ts`)

## Widgets

`lib/service/waktuSolatWidget.ts`:

- Multiple widget styles: Standard, Compact, Imsak, Large, Transparent
- All update in parallel via `Promise.all`
- Updated on: date/zone/prayer time change, notification delivery, background task

## Caching

| Data            | Storage           | TTL                        | Abstraction                           |
| --------------- | ----------------- | -------------------------- | ------------------------------------- |
| countries.yaml  | AsyncStorage      | 1 month                    | `asyncCacheStore.getCachedOrFetch`    |
| zones/{CC}.yaml | AsyncStorage      | 1 month                    | `asyncCacheStore.getCachedOrFetch`    |
| GeoJSON         | documentDirectory | Indefinite (by URL)        | `fileCacheStore.getCachedFileOrFetch` |
| Mappings        | documentDirectory | Indefinite (by URL)        | `fileCacheStore.getCachedFileOrFetch` |
| Prayer times    | AsyncStorage      | Trimmed daily (>24h old)   | `waktuSolatStore` (React context)     |
| Zone            | AsyncStorage      | Until GPS detects new zone | `zoneStore` (React context)           |

GeoJSON/mapping invalidation: URLs in `countries.yaml` are datestamped. New date = new URL = cache miss → fetch. `clearStaleFiles()` removes old files.

## Per-Zone Mutex

Module-level `Map<string, Promise<void>>` in `lib/hooks/waktuSolat.tsx`.

Prevents race conditions when multiple hooks (today + tomorrow) request the same zone simultaneously. The second caller waits for the first fetch to complete, then reads from cache.

## Calculated Prayer Times

For zones outside officially supported countries, `lib/domain/adhanCalculator.ts` uses adhan-js:

- Calculation method determined by country ISO code
- Shafi madhab for Asr timing
- Imsak = Fajr minus 10 minutes
- All computation is offline

## Project Structure

```
lib/
├── domain/              # Pure types + business logic (no I/O)
│   ├── zone.ts          # Zone types, display helpers
│   ├── prayerTime.ts    # PrayerTime/WaktuSolat types, getTimeText
│   ├── adhanCalculator.ts  # Country→method mapping + adhan calculation
│   └── datetime.ts      # HH:MM + timezone → epoch conversion
├── data/                # Persistence (AsyncStorage, filesystem)
│   ├── dataStore.tsx     # Generic React context + AsyncStorage factory
│   ├── zoneStore.ts
│   ├── waktuSolatStore.ts
│   ├── asyncCacheStore.ts  # TTL-based AsyncStorage cache
│   └── fileCacheStore.ts   # URL-keyed filesystem cache
├── service/             # Side effects + orchestration
│   ├── zone.ts          # GPS → zone resolution (fetches geojson on demand)
│   ├── waktuSolat.ts    # Prayer time fetch + merge + cache
│   ├── waktuSolatWidget.ts  # Widget update orchestration
│   ├── prayerData.ts    # Zone + prayer time aggregation
│   ├── notifee.ts       # Notification scheduling
│   ├── notifeeBackground.ts  # Notification delivery handler
│   ├── location.ts      # GPS access
│   └── permissions.ts   # Permission requests
├── remote/              # Network fetch
│   └── simplesolat.ts   # CDN fetch (countries, zones, geojson, prayer times)
├── hooks/               # React hooks
├── widgets/             # Android home screen widget components
└── tasks/               # Background task registration
```
