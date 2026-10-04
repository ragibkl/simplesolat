import { File, Paths } from "expo-file-system";

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

// Temporary, for TestFlight: what the widget has been given.
export async function getIosWidgetStatus(): Promise<string> {
  try {
    const entries = await WaktuSolatWidget.getTimeline();
    const future = entries.filter((e) => e.date.getTime() > Date.now());
    const hasShort = entries.some((e) => e.props.columns?.[0]?.short);
    const last = entries[entries.length - 1]?.date.toDateString() ?? "none";
    return `Widget: ${entries.length} entries (${future.length} upcoming, until ${last}), short times: ${hasShort ? "yes" : "no"}. ${readStoredLayout()}`;
  } catch (e) {
    return `Widget: error ${String(e)}`;
  }
}

// Temporary, for TestFlight: what the widget extension actually reads. The
// shared UserDefaults live in the App Group container as a plist.
function readStoredLayout(): string {
  try {
    const group = "group.com.simplesolat.app";
    const dir = Paths.appleSharedContainers[group];
    if (!dir) return "Store: no app group container";
    const file = new File(dir, "Library", "Preferences", `${group}.plist`);
    if (!file.exists) return "Store: no plist";
    const bytes = (file as any).bytesSync() as Uint8Array;
    let text = "";
    for (let i = 0; i < bytes.length; i++)
      text += String.fromCharCode(bytes[i]);
    const keys = [
      ...new Set(text.match(/__expo_widgets_[A-Za-z0-9_]+/g) ?? []),
    ];
    const layouts = (text.match(/function\(props,env\)/g) ?? []).length;
    const design = text.includes("maxWidth")
      ? "NEW (equal columns)"
      : text.includes("minimumScaleFactor")
        ? "OLD"
        : "unknown";
    const modified = (file as any).modificationTime;
    const when = modified ? new Date(modified).toLocaleTimeString() : "?";
    return `Store: ${bytes.length} bytes, modified ${when}, layouts ${layouts}, design ${design}, keys ${keys.join(" ")}`;
  } catch (e) {
    return `Store: error ${String(e)}`;
  }
}
