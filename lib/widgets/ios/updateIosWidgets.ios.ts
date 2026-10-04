import { loadSettings } from "@/lib/data/settingsStore";
import { getZoneDisplayName, Zone } from "@/lib/domain/zone";
import { getUpcomingWaktuSolat } from "@/lib/service/waktuSolat";

import { buildTimeline } from "./timeline";
import WaktuSolatWidget from "./WaktuSolatWidget";

// 7 days (about 50 entries). iOS renders every timeline entry ahead of time
// inside the widget extension's CPU budget: 40 days (276 entries) exceeded
// it ("80% cpu over 20 seconds"), so iOS kept showing a stale snapshot.
// Opening the app or a background refresh tops it up.
const WIDGET_DAYS = 7;

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

// Temporary, for TestFlight: what the widget has been given.
export async function getIosWidgetStatus(): Promise<string> {
  try {
    const entries = await WaktuSolatWidget.getTimeline();
    const future = entries.filter((e) => e.date.getTime() > Date.now());
    const hasShort = entries.some((e) => e.props.columns?.[0]?.short);
    const last = entries[entries.length - 1]?.date.toDateString() ?? "none";
    return `Widget: ${entries.length} entries (${future.length} upcoming, until ${last}), short times: ${hasShort ? "yes" : "no"}`;
  } catch (e) {
    return `Widget: error ${String(e)}`;
  }
}
