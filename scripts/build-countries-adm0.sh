#!/bin/sh
# Rebuilds assets/geodata/countries-adm0.json, the bundled world map the app
# uses to tell which country a location is in (lib/service/zone.ts).
# Natural Earth 1:10m countries, simplified to 20% with coordinates rounded to
# ~10 m: about 2.2 MB. Bigger versions (50%: 5 MB, full: 10 MB) still miss
# shores and are much slower to load; zone.ts covers shores with fallbacks.
set -eu
src=$(mktemp -d)
curl -sL -o "$src/ne10.geojson" \
  https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries.geojson
# ISO_A2 is -99 for France, Norway and a few others; ISO_A2_EH has the code.
npx -y mapshaper "$src/ne10.geojson" \
  -each 'ISO_A2 = ISO_A2_EH' -filter-fields ISO_A2,NAME \
  -simplify 20% keep-shapes \
  -o precision=0.0001 format=geojson "$(dirname "$0")/../assets/geodata/countries-adm0.json"
rm -r "$src"
