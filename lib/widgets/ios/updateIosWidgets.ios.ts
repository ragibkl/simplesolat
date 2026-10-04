import { loadSettings } from "@/lib/data/settingsStore";
import { getZoneDisplayName, Zone } from "@/lib/domain/zone";
import { getUpcomingWaktuSolat } from "@/lib/service/waktuSolat";

import { buildTimeline } from "./timeline";
import WaktuSolatWidget from "./WaktuSolatWidget";

// 3 days (about 20 entries). iOS renders every timeline entry ahead of time
// inside the widget extension's CPU budget: 40 days (276 entries) exceeded
// it ("80% cpu over 20 seconds"), and so did 7 days (45), so iOS kept
// showing a stale snapshot.
// Opening the app or a background refresh tops it up.
const WIDGET_DAYS = 3;

export async function updateIosWidgets(date: Date, zone: Zone): Promise<void> {
  const days = await getUpcomingWaktuSolat(date, WIDGET_DAYS);
  if (!days.length) return;
  const { widgetExtraTime } = await loadSettings();
  const entries = buildTimeline(
    days,
    getZoneDisplayName(zone),
    widgetExtraTime,
  );
  if (entries.length) {
    WaktuSolatWidget.updateTimeline(entries);
    WaktuSolatWidget.reload();
  }
}
