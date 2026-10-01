import { WidgetSecondColumn } from "@/lib/data/settingsStore";
import { PrayerTime } from "@/lib/domain/prayerTime";

// The second column shows Dhuha when it's chosen and the zone has an
// official dhuha time, and Syuruk otherwise.
export function getSecondColumn(
  prayerTime: PrayerTime,
  choice: WidgetSecondColumn = "syuruk",
): { label: string; start: number } {
  if (choice === "dhuha" && prayerTime.dhuha !== undefined) {
    return { label: "Dhuha", start: prayerTime.dhuha };
  }
  return { label: "Syuruk", start: prayerTime.syuruk };
}
