import notifee, { EventType } from "@notifee/react-native";

import { WaktuSolat } from "@/lib/domain/prayerTime";
import { Zone } from "@/lib/domain/zone";
import {
  requestUpdateWaktuSolatWidgets,
  updateWaktuSolatAndWidgets,
} from "./waktuSolatWidget";

notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.DELIVERED) {
    const data = detail?.notification?.data || {};

    if (data && "waktuSolat" in data && "zone" in data) {
      const waktuSolat = data.waktuSolat as WaktuSolat;
      const zone = data.zone as Zone;
      await requestUpdateWaktuSolatWidgets(new Date(), zone, waktuSolat);
    } else {
      await updateWaktuSolatAndWidgets(false, false);
    }
  }
});
