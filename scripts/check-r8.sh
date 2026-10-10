#!/usr/bin/env bash
# Checks an Android release APK built with R8 (minify) for code R8 removed but
# the app still needs. Run it after every Expo SDK or native library upgrade.
#
#   scripts/check-r8.sh <release.apk>            # static checks only
#   scripts/check-r8.sh <release.apk> --device   # also run the background jobs on a phone
#
# R8 keeps what the code references directly. It can't see classes loaded by
# name at runtime, so those need keep rules (expo-build-properties
# extraProguardRules in app.json). This script looks for the usual victims:
#
#   1. Every activity/service/receiver/provider in the manifest exists in the dex.
#   2. Every class named in manifest <meta-data> exists (androidx.startup
#      initializers, and values such as expo-modules-core's headless app loader).
#   3. With --device: the APK must already be installed on the phone (adb, one
#      device or ADB_SERIAL set). Opens the app, closes it, force-runs its
#      scheduled jobs (widget updates, background task) and scans its log for
#      missing-class errors. A failure there often logs a warning and carries
#      on, so the app looks fine while background work silently does nothing.
#
# Needs the Android SDK build-tools (aapt2, dexdump) under ANDROID_HOME.
set -euo pipefail

apk=$(realpath "${1:?usage: $0 <release.apk> [--device]}")
device=${2:-}
pkg=com.simplesolat.app

sdk=${ANDROID_HOME:-${ANDROID_SDK_ROOT:-$HOME/Android/Sdk}}
tools=$(ls -d "$sdk"/build-tools/*/ 2>/dev/null | sort -V | tail -1)
aapt2=$tools/aapt2
dexdump=$tools/dexdump
[ -x "$aapt2" ] && [ -x "$dexdump" ] || { echo "aapt2/dexdump not found under $sdk/build-tools" >&2; exit 2; }

work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
failures=0

echo "APK: $apk ($(du -h "$apk" | cut -f1))"

# All classes in the APK, as dotted names.
unzip -q -o "$apk" 'classes*.dex' -d "$work"
for dex in "$work"/classes*.dex; do
  "$dexdump" "$dex" 2>/dev/null | sed -n "s/^ *Class descriptor *: 'L\(.*\);'$/\1/p"
done | tr / . | sort -u > "$work/classes.txt"
echo "Classes in dex: $(wc -l < "$work/classes.txt")"

"$aapt2" dump xmltree "$apk" --file AndroidManifest.xml > "$work/manifest.txt"

# Prints "<kind> <class>" for manifest components, meta-data class values and
# androidx.startup initializers.
python3 - "$work/manifest.txt" > "$work/needed.txt" <<'EOF'
import re, sys
components = {"activity", "activity-alias", "service", "receiver", "provider", "application"}
name_re = re.compile(r'android:name\(0x01010003\)="([^"]+)"')
value_re = re.compile(r'android:value\(0x01010024\)="([^"]+)"')
class_re = re.compile(r"^[a-z][\w]*(\.[\w$]+)+$")
element, meta_name = None, None
for line in open(sys.argv[1]):
    m = re.match(r"\s*E: ([\w-]+)", line)
    if m:
        element, meta_name = m.group(1), None
        continue
    m = name_re.search(line)
    if m:
        if element in components:
            print(element, m.group(1))
        elif element == "meta-data":
            meta_name = m.group(1)
        continue
    m = value_re.search(line)
    if m and element == "meta-data":
        value = m.group(1)
        if value == "androidx.startup" and meta_name:
            print("startup-initializer", meta_name)
        elif class_re.match(value) and value.split(".")[-1][:1].isupper():
            print("meta-data", value)
EOF

checked=0
while read -r kind cls; do
  checked=$((checked + 1))
  if ! grep -qFx "$cls" "$work/classes.txt"; then
    echo "MISSING ($kind): $cls"
    failures=$((failures + 1))
  fi
done < <(sort -u "$work/needed.txt")
echo "Manifest classes checked: $checked, missing: $failures"

if [ "$device" = "--device" ]; then
  adb=(adb ${ADB_SERIAL:+-s "$ADB_SERIAL"})
  uid=$("${adb[@]}" shell pm list packages -U "$pkg" | sed -n "s/^package:$pkg uid:\([0-9]*\).*/\1/p")
  [ -n "$uid" ] || { echo "$pkg is not installed on the device" >&2; exit 2; }

  echo "Device: opening the app, closing it, then running its scheduled jobs"
  "${adb[@]}" shell monkey -p "$pkg" -c android.intent.category.LAUNCHER 1 > /dev/null 2>&1
  sleep 8
  "${adb[@]}" shell input keyevent HOME
  sleep 2
  # am kill, not force-stop: a force-stopped app can't run its jobs.
  "${adb[@]}" shell am kill "$pkg"
  sleep 2
  "${adb[@]}" logcat -c
  jobs=$("${adb[@]}" shell dumpsys jobscheduler "$pkg" | sed -n "s/.*JOB #u[0-9]*a[0-9]*\/\([0-9]*\).*/\1/p" | sort -u)
  for job in $jobs; do
    "${adb[@]}" shell cmd jobscheduler run -f "$pkg" "$job" > /dev/null
  done
  echo "Ran jobs: $(echo ${jobs:-none} | tr "\n" " ")"
  sleep 25

  "${adb[@]}" logcat -d --uid "$uid" > "$work/log.txt" 2>/dev/null || "${adb[@]}" logcat -d > "$work/log.txt"
  errors=$(grep -E "ClassNotFoundException|NoClassDefFoundError|NoSuchMethodError|NoSuchFieldError|Cannot initialize app loader|FATAL EXCEPTION|Fatal signal" "$work/log.txt" \
    | grep -E "$pkg|expo\.|com\.facebook|app\.notifee|com\.reactnativeandroidwidget|FATAL|Fatal signal|app loader" || true)
  if [ -n "$errors" ]; then
    echo "Errors in the app's log:"
    echo "$errors" | sed 's/^/  /' | sort -u | head -20
    failures=$((failures + 1))
  else
    echo "No missing-class errors in the app's log"
  fi
  if grep -q "Finished task 'update-waktu-solat-widget'" "$work/log.txt" && ! grep -q "Cannot initialize app loader" "$work/log.txt"; then
    echo "Background task ran its JS"
  else
    echo "WARNING: didn't see the background task run (job not due, or JS failed to start)"
  fi
fi

if [ "$failures" -gt 0 ]; then
  echo "FAILED: add keep rules for the classes above (extraProguardRules in app.json)"
  exit 1
fi
echo "OK"
