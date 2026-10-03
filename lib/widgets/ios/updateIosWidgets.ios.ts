import { loadSettings } from "@/lib/data/settingsStore";
import { getZoneDisplayName, Zone } from "@/lib/domain/zone";
import { getUpcomingWaktuSolat } from "@/lib/service/waktuSolat";

import { buildTimeline } from "./timeline";
import WaktuSolatWidget from "./WaktuSolatWidget";

// About 40 days: the widget keeps going for weeks without the app being opened.
const WIDGET_DAYS = 40;

export async function updateIosWidgets(date: Date, zone: Zone): Promise<void> {
  const days = await getUpcomingWaktuSolat(date, WIDGET_DAYS);
  if (!days.length) return;
  const { widgetExtraTime } = await loadSettings();
  const entries = buildTimeline(
    days,
    getZoneDisplayName(zone),
    widgetExtraTime,
  );
  if (entries.length) WaktuSolatWidget.updateTimeline(entries);
}
