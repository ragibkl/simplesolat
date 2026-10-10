import { useEffect } from "react";

import { scheduleAllWaktuSolatNotifications } from "@/lib/service/notifee";
import {
  getReminderDays,
  requestUpdateWaktuSolatWidgets,
} from "@/lib/service/waktuSolatWidget";
import { updatePinnedNotification } from "@/lib/service/pinnedNotification";
import { refreshTravelGeofence } from "@/lib/service/travelGeofence";
import { registerBackgroundTasks } from "@/lib/tasks/backgroundTasks";
import { updateIosWidgets } from "@/lib/widgets/ios/updateIosWidgets";

import { useCurrentDate } from "./date";
import { useWaktuSolatCurrent } from "./waktuSolat";
import { useUpdatedZone } from "./zone";

export function useWaktuSolatWidgetUpdate() {
  const { date } = useCurrentDate();
  const { zone } = useUpdatedZone();
  const { waktuSolat } = useWaktuSolatCurrent();

  useEffect(() => {
    async function effect() {
      await registerBackgroundTasks();
    }
    effect();
  }, []);

  // iOS: redraw the travel circle when the app opens and when the zone
  // changes (not every minute).
  const zoneKey = zone ? JSON.stringify(zone) : null;
  useEffect(() => {
    if (zoneKey) refreshTravelGeofence();
  }, [zoneKey]);

  // iOS widget timeline (40 days): rebuild when the zone or the day changes.
  const dayKey = date.toDateString();
  useEffect(() => {
    if (zone) {
      updateIosWidgets(new Date(), zone);
      updatePinnedNotification(new Date(), zone);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoneKey, dayKey]);

  useEffect(() => {
    async function effect() {
      if (zone && waktuSolat) {
        await requestUpdateWaktuSolatWidgets(date, zone, waktuSolat);
        await scheduleAllWaktuSolatNotifications(
          await getReminderDays(date, waktuSolat),
          zone,
        );
      }
    }
    effect();
  }, [date, zone, waktuSolat]);
}
