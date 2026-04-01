# Architecture

## Design Principles

- **Privacy-first zone resolution** — GPS-to-zone lookup happens entirely on-device using embedded geojson data. No location data is sent to any server. The API only receives the zone code (e.g., `WLY01`), never your coordinates.
- **Minimal API calls** — Local zone resolution means the only network request is for prayer time data. With 2-month caching, most days require zero API calls.
- **Offline-capable** — Official zones cache 2 months of prayer times per visited zone. Calculated zones (adhan-js) work entirely offline with no network access needed.
- **Fully automatic widgets** — Home screen widgets update automatically in the background every 15 minutes. When you cross a zone boundary (e.g., driving from KL to Johor), the widget detects the new zone via GPS and refreshes with the correct prayer times — no need to open the app or manually select a zone. As the day progresses, the widget always shows the current prayer time context.

## App Startup

1. `app/_layout.tsx` mounts, wraps app in `zoneStore.Provider` and `waktuSolatStore.Provider`
2. `requestAllPermissions()` runs once — requests foreground/background location, notifications, exact alarms, battery optimization
3. Main screen (`app/index.tsx`) renders and triggers hooks

## Data Flow

```
GPS → Zone Resolution → Prayer Times → Display / Notifications / Widgets
```

### 1. Location Polling

- `useLocation()` fetches GPS on app resume and date change
- Parameters: maxAge 15min, required accuracy 3km
- Falls back to cached location if GPS fails

### 2. Zone Resolution

`lookupZoneByGps(lat, lng)` in `lib/service/zone.ts`:

1. **Country detection** — Natural Earth ADM0 global geojson → country ISO code
2. **Switch by country**:
   - `MY` → JAKIM district geojson → 60 zones
   - `SG` → returns SGP01 (single zone)
   - `ID` → geoBoundaries ADM2 → mapping file → 517 zones
   - `BN` → geoBoundaries ADM1 → mapping file → 4 zones
   - `LK` → geoBoundaries ADM2 → mapping file → 13 zones
   - Other → `CalculatedZone` (lat/lng stored, adhan-js used at calculation time)
3. Zone is persisted to AsyncStorage via `zoneStore`

### 3. Prayer Time Fetching

`useWaktuSolatForDate(date)` in `lib/hooks/waktuSolat.tsx`:

1. Check local cache: `waktuSolatStore[year::month::date::zone]`
2. If cached → return immediately
3. If not cached:
   - Acquire per-zone mutex lock (prevents duplicate fetches)
   - Double-check cache after acquiring lock (previous holder may have fetched)
   - **Official zones**: fetch from API (`current month + next month` range)
   - **Calculated zones**: compute locally via adhan-js
   - Merge response into cache, trim entries older than yesterday
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
3. Update all 3 home screen widgets (parallel)
4. Reschedule prayer time notifications

## Notifications

`lib/service/notifee.ts`:

- **7 notifications** scheduled per day (one per prayer time)
- **Deterministic IDs**: `waktu_solat::prayer::year::month::date::zone` — same ID replaces, preventing duplicates
- **Trigger**: `SET_ALARM_CLOCK` with `allowWhileIdle: true` (survives Doze mode)
- **Channel**: single `waktu_solat` channel with `AndroidImportance.HIGH`
- On notification delivery → widget update triggered immediately

## Widgets

`lib/service/waktuSolatWidget.ts`:

- 3 widget styles: Standard, Compact, Imsak
- All update in parallel via `Promise.all`
- Updated on: date/zone/prayer time change, notification delivery, background task

## Caching

Two AsyncStorage-backed stores (`lib/data/dataStore.tsx`):

| Store             | Key                        | Contents                                        |
| ----------------- | -------------------------- | ----------------------------------------------- |
| `zoneStore`       | `ZONE_STORE_V3_KEY`        | Current zone (OfficialZone or CalculatedZone)   |
| `waktuSolatStore` | `WAKTU_SOLAT_STORE_V3_KEY` | Prayer times keyed by `year::month::date::zone` |

- Prayer time cache is trimmed on each merge (removes entries >24h old)
- Zone cache is overwritten when GPS detects a new zone

## Per-Zone Mutex

Module-level `Map<string, Promise<void>>` in `lib/hooks/waktuSolat.tsx`.

Prevents race conditions when multiple hooks (today + tomorrow) request the same zone simultaneously. The second caller waits for the first fetch to complete, then reads from cache.

## Calculated Prayer Times

For zones outside MY/SG/ID/BN/LK, `lib/service/adhanCalculator.ts` uses adhan-js:

- Calculation method determined by country ISO code (`lib/service/calculationMethod.ts`)
- Shafi madhab for Asr timing
- Imsak = Fajr minus 10 minutes
- All computation is offline
