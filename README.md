# simplesolat

Prayer times app with auto-updating widgets. Works worldwide.

Free, no ads.

## Features

- All 7 prayer times including Imsak and Syuruk
- Swipe to see tomorrow's prayer times
- Qibla compass
- Home screen widgets (multiple styles, dark mode)
- Automatic zone detection via GPS
- Official prayer time data for supported countries
- Client-side calculation fallback for unsupported regions
- Works offline after initial setup

See [Architecture](docs/architecture.md) for details on how the app works internally.

## How Zone Resolution Works

When the app detects your GPS location, it determines your prayer zone using a country-first approach:

1. **Country detection** — Bundled Natural Earth ADM0 geojson → country ISO code
2. **Official zone lookup** — For supported countries (driven by [countries.yaml](https://github.com/ragibkl/simplesolat-data)), geojson + mapping files are fetched from CDN and cached locally. Point-in-polygon lookup resolves the exact zone.
3. **Calculated fallback** — For unsupported countries, prayer times are calculated locally using adhan-js with region-appropriate methods.

Supported countries are managed in the [simplesolat-data](https://github.com/ragibkl/simplesolat-data) repo. Adding a new country requires no app update.

## Calculation Fallback (Worldwide)

For countries without official data sources, prayer times are calculated client-side using [adhan-js](https://github.com/batoulapps/adhan-js). See [simplesolat-data README](https://github.com/ragibkl/simplesolat-data#calculation-methods) for the full method table.

All calculations use Shafi madhab for Asr timing. Imsak is derived as Fajr minus 10 minutes.

## Development

```bash
npm install
npx expo start
```

## Data Sources

- Prayer times (official): [simplesolat-data](https://github.com/ragibkl/simplesolat-data) — aggregates from JAKIM, MUIS, Kemenag, KHEU, ACJU, and more
- Prayer times (worldwide): [adhan-js](https://github.com/batoulapps/adhan-js) (client-side calculation)
- Zone boundaries: [geoBoundaries](https://www.geoboundaries.org) (CC-BY 4.0)
- Country boundaries: [Natural Earth](https://www.naturalearthdata.com) (public domain)
