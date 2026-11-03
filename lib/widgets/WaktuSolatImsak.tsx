import { startOfMinute } from "date-fns";
import React from "react";
import {
  requestWidgetUpdate,
  WidgetTaskHandlerProps,
} from "react-native-android-widget";

import { imsakWidgetExtraTime, loadSettings } from "@/lib/data/settingsStore";
import { resolveLanguage } from "@/lib/i18n/translate";
import { PrayerTime } from "@/lib/domain/prayerTime";
import { Zone } from "@/lib/domain/zone";
import { getPrayerData } from "@/lib/service/prayerData";

import { Empty } from "./Empty";
import { WaktuSolat } from "./WaktuSolat";

// The old "Waktu Solat with Imsak" widget. It's hidden from the widget picker
// (plugins/withHiddenWidgets.js) but keeps working where it's already placed.
// It looks like the Waktu Solat widget: Imsak until the user picks an extra
// time in Settings, then whatever they picked.

async function updateWaktuSolatImsakAndRender(props: WidgetTaskHandlerProps) {
  const date = startOfMinute(new Date());
  const data = await getPrayerData(date, false);
  if (!data) {
    return;
  }
  const settings = await loadSettings();
  const extraTime = imsakWidgetExtraTime(settings);

  props.renderWidget(
    <WaktuSolat
      date={date}
      zone={data.zone}
      prayerTime={data.waktuSolat.prayerTime}
      extraTime={extraTime}
      lang={resolveLanguage(settings.language)}
    />,
  );
}

export async function waktuSolatImsakWidgetTaskHandler(
  props: WidgetTaskHandlerProps,
) {
  switch (props.widgetAction) {
    case "WIDGET_ADDED":
      props.renderWidget(<Empty />);
      await updateWaktuSolatImsakAndRender(props);
      break;

    case "WIDGET_UPDATE":
      await updateWaktuSolatImsakAndRender(props);
      break;

    case "WIDGET_RESIZED":
      // Not needed for now
      break;

    case "WIDGET_DELETED":
      // Not needed for now
      break;

    default:
      break;
  }
}

export async function requestWaktuSolatImsakWidgetUpdate(
  date: Date,
  zone: Zone,
  prayerTime: PrayerTime,
) {
  const settings = await loadSettings();
  const extraTime = imsakWidgetExtraTime(settings);
  await requestWidgetUpdate({
    widgetName: "WaktuSolatImsak",
    renderWidget: () => (
      <WaktuSolat
        date={date}
        zone={zone}
        prayerTime={prayerTime}
        extraTime={extraTime}
        lang={resolveLanguage(settings.language)}
      />
    ),
    widgetNotFound: () => {},
  });
}
