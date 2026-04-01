# simplesolat

Prayer times app for Malaysia, Singapore, Indonesia, Brunei, Sri Lanka, and worldwide. Widgets auto-update when you travel.

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

1. **Country detection** — GPS coordinates are checked against a global country boundary dataset (Natural Earth ADM0)
2. **Official zone lookup** (MY, SG, ID, BN, LK) — For supported countries, a local geojson polygon lookup resolves your exact zone:
   - **Malaysia**: JAKIM district boundaries → 60 zones (e.g., SGR01, WLY01)
   - **Singapore**: Country boundary → single zone (SGP01)
   - **Indonesia**: geoBoundaries ADM2 districts → 517 zones (e.g., DKI02, JTM38)
   - **Brunei**: geoBoundaries ADM1 districts → 4 zones (BRN01–BRN04)
   - **Sri Lanka**: geoBoundaries ADM2 districts → 13 zones (LK01–LK13)
3. **Prayer time source** — Official zones fetch from the [simplesolat API](https://api.simplesolat.com), which aggregates data from each country's official authority

## Calculation Fallback (Worldwide)

For countries without official data sources, prayer times are calculated client-side using [adhan-js](https://github.com/batoulapps/adhan-js) with region-appropriate methods:

| Region          | Calculation Method                   |
| --------------- | ------------------------------------ |
| Saudi Arabia    | Umm Al-Qura                          |
| Egypt           | Egyptian General Authority of Survey |
| Turkey          | Diyanet (Turkey)                     |
| Qatar           | Qatar                                |
| Kuwait          | Kuwait                               |
| Iran            | Tehran                               |
| Jordan          | Custom (Fajr 18°, Isha 18°)          |
| Algeria         | Custom (Fajr 18°, Isha 17°)          |
| Tunisia         | Custom (Fajr 18°, Isha 18°)          |
| France          | Custom UOIF (Fajr 12°, Isha 12°)     |
| Russia          | Custom (Fajr 16°, Isha 15°)          |
| UAE             | Dubai                                |
| Bahrain         | Umm Al-Qura                          |
| Oman            | Umm Al-Qura                          |
| Yemen           | Umm Al-Qura                          |
| Pakistan        | Karachi                              |
| US / Canada     | ISNA (North America)                 |
| Default / other | Muslim World League                  |

All calculations use Shafi madhab for Asr timing. Imsak is derived as Fajr minus 10 minutes.

## Development

```bash
npm install
npx expo start
```

## Data Sources

- Prayer times (Malaysia): [JAKIM e-Solat](https://www.e-solat.gov.my)
- Prayer times (Singapore): [MUIS](https://www.muis.gov.sg)
- Prayer times (Indonesia): [Kemenag](https://kemenag.go.id) via [equran.id](https://equran.id)
- Prayer times (Brunei): [KHEU](https://www.kheu.gov.bn)
- Prayer times (Sri Lanka): [ACJU](https://acju.lk)
- Prayer times (worldwide): [adhan-js](https://github.com/batoulapps/adhan-js) (client-side calculation)
- Zone boundaries (Malaysia): MPT Waktu Solat
- Zone boundaries (Singapore, Indonesia, Brunei, Sri Lanka): [geoBoundaries](https://www.geoboundaries.org) (CC-BY 4.0)
- Country boundaries: [Natural Earth](https://www.naturalearthdata.com) (public domain)
