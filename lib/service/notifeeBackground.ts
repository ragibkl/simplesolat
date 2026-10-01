import notifee, { EventType } from "@notifee/react-native";

import { WaktuSolat } from "@/lib/domain/prayerTime";
import { Zone } from "@/lib/domain/zone";
import {
  requestUpdateWaktuSolatWidgets,
  updateWaktuSolatAndWidgets,
} from "./waktuSolatWidget";

// Notifications scheduled before v2 carry objects; newer ones carry JSON.
function parseData<T>(value: unknown): T {
  return (typeof value === "string" ? JSON.parse(value) : value) as T;
}

notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.DELIVERED) {
    const data = detail?.notification?.data || {};

    if (data && "waktuSolat" in data && "zone" in data) {
      const waktuSolat = parseData<WaktuSolat>(data.waktuSolat);
      const zone = parseData<Zone>(data.zone);
      await requestUpdateWaktuSolatWidgets(new Date(), zone, waktuSolat);
    } else {
      await updateWaktuSolatAndWidgets(false, false);
    }
  }
});
