import AsyncStorage from "@react-native-async-storage/async-storage";
import { startOfMinute } from "date-fns";
import { Appearance, Platform } from "react-native";

import { loadSettings } from "@/lib/data/settingsStore";

import { getSyurukEnd, PrayerTime, WaktuSolat } from "@/lib/domain/prayerTime";
import { getZoneCode, Zone } from "@/lib/domain/zone";
import { requestWaktuSolatWidgetUpdate } from "@/lib/widgets/WaktuSolat";
import { requestWaktuSolatCompactUpdate } from "@/lib/widgets/WaktuSolatCompact";
import { requestWaktuSolatImsakWidgetUpdate } from "@/lib/widgets/WaktuSolatImsak";
import { requestWaktuSolatTransparentUpdate } from "@/lib/widgets/WaktuSolatTransparent";
import { updateIosWidgets } from "@/lib/widgets/ios/updateIosWidgets";
import WidgetRefresh from "@/modules/widget-refresh";

import { scheduleAllWaktuSolatNotifications } from "./notifee";
import { GetLocationOptions } from "./location";
import { updatePinnedNotification } from "./pinnedNotification";
import { getPrayerData } from "./prayerData";
import { ensureTravelData } from "./travelData";
import { getUpcomingWaktuSolat } from "./waktuSolat";

const LAST_WIDGETS_KEY = "ANDROID_WIDGETS_LAST_REQUEST";

// Every moment a widget's bold can change: each time, and the end of Syuruk.
function widgetMoments(prayerTime: PrayerTime): number[] {
  const times = Object.values(prayerTime).filter(
    (t): t is number => typeof t === "number",
  );
  return [...times, getSyurukEnd(prayerTime)];
}

// What the Android widgets show: the day, the zone, its times, which of the
// day's times have passed (so the bold moves), the widget settings and light
// or dark. Each widget update starts a background job that loads React
// Native, which made slow phones report "not responding"; the app and the
// background task asked every few minutes although this changes only a few
// times a day. Android's own periodic update (updatePeriodMillis) still
// redraws them regardless, as a fallback.
async function widgetsKey(date: Date, zone: Zone, waktuSolat: WaktuSolat) {
  const now = date.getTime() / 1000;
  const times = widgetMoments(waktuSolat.prayerTime);
  const { widgetExtraTime, widgetExtraTimeChosen } = await loadSettings();
  return JSON.stringify([
    date.toDateString(),
    getZoneCode(zone),
    waktuSolat.prayerTime,
    times.filter((t) => t <= now).length,
    widgetExtraTime,
    widgetExtraTimeChosen ?? null,
    Appearance.getColorScheme() ?? null,
  ]);
}

export async function requestUpdateWaktuSolatWidgets(
  date: Date,
  zone: Zone,
  waktuSolat: WaktuSolat,
  force = false,
) {
  if (Platform.OS !== "android") return;
  const key = await widgetsKey(date, zone, waktuSolat);
  if (!force && (await AsyncStorage.getItem(LAST_WIDGETS_KEY)) === key) {
    return;
  }
  await AsyncStorage.setItem(LAST_WIDGETS_KEY, key);
  await Promise.all([
    requestWaktuSolatWidgetUpdate(date, zone, waktuSolat.prayerTime),
    requestWaktuSolatCompactUpdate(date, zone, waktuSolat.prayerTime),
    requestWaktuSolatImsakWidgetUpdate(date, zone, waktuSolat.prayerTime),
    requestWaktuSolatTransparentUpdate(date, zone, waktuSolat.prayerTime),
  ]);
  await scheduleWidgetRefresh(date);
}

// Android redraws the widgets at those moments (and midnight) by itself, so
// the bold moves on time even when no reminder fires (modules/widget-refresh).
async function scheduleWidgetRefresh(date: Date) {
  if (!WidgetRefresh) return;
  try {
    const days = await getUpcomingWaktuSolat(date, 2);
    const times = days.flatMap((ws) => [
      ...widgetMoments(ws.prayerTime).map((t) => t * 1000),
      new Date(ws.year, ws.month - 1, ws.date + 1).getTime(),
    ]);
    await WidgetRefresh.schedule(times);
  } catch (error) {
    console.error("Failed to schedule widget refresh:", error);
  }
}

// The days to schedule reminders for. Android reschedules from its frequent
// background task, so today is enough; iOS runs background work rarely, so
// schedule up to 12 days ahead (see scheduleAllWaktuSolatNotifications).
export async function getReminderDays(
  date: Date,
  waktuSolat: WaktuSolat,
): Promise<WaktuSolat[]> {
  if (Platform.OS !== "ios") {
    return [waktuSolat];
  }
  return getUpcomingWaktuSolat(date, 12);
}

export async function updateWaktuSolatAndWidgets(
  updateZone: boolean,
  updateNotifs: boolean,
  locationOptions: GetLocationOptions = {},
) {
  const date = startOfMinute(new Date());
  const data = await getPrayerData(date, updateZone, locationOptions);
  if (!data) {
    return;
  }

  const { zone, waktuSolat } = data;
  requestUpdateWaktuSolatWidgets(date, zone, waktuSolat);
  await updateIosWidgets(date, zone);
  await updatePinnedNotification(date, zone);

  if (updateNotifs) {
    await scheduleAllWaktuSolatNotifications(
      await getReminderDays(date, waktuSolat),
      zone,
    );
  }
  // Last, so it never delays the widgets: keep the country (and neighbours)
  // on the phone for travelling without a connection.
  if (zone.type === "official") {
    await ensureTravelData(zone.country, date);
  }
}
