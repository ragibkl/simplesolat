# App Store screenshots

From the iOS screenshots workflow (`.github/workflows/ios-screenshots.yml`),
taken on the iOS simulator at 6:20 am Malaysia time (Fajr current):

- `iphone-6.9/`: iPhone 17 Pro Max, 1320×2868 (the App Store's 6.9" size)
- `ipad-13/`: iPad Pro 13", 2064×2752 (the 13" size)

1. Home (light)
2. Medium widget on the home screen (light)
3. Settings (light)
4. Home (dark)
5. Medium widget on the home screen (dark)

PNGs without transparency (App Store Connect rejects an alpha channel; the
simulator's own screenshots have one).

To redo them: `gh workflow run ios-screenshots.yml`, around a time when the
prayer you want highlighted is current, and copy the PNGs from the run's
`ios-screenshots-*` artifacts (converted to RGB).
