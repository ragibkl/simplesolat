import { startOfMinute } from "date-fns";
import React from "react";
import {
  FlexWidget,
  requestWidgetUpdate,
  WidgetTaskHandlerProps,
} from "react-native-android-widget";

import { MonoTextWidget } from "@/lib/components/MonoTextWidget";
import { PrayerTime } from "@/lib/data/waktuSolatStore";
import { Zone, getZoneDisplayName } from "@/lib/data/zoneStore";
import { getPrayerData } from "@/lib/service/waktuSolatWidget";

import { Empty } from "./Empty";
import { WaktuColumn } from "./WaktuColumn";
import { WidgetContainer } from "./WidgetContainer";

export type WaktuSolatLargeWidgetProps = {
  date: Date;
  zone: Zone;
  prayerTime: PrayerTime;
};

export function WaktuSolatLarge(props: WaktuSolatLargeWidgetProps) {
  const {
    date,
    prayerTime: { fajr, dhuhr, asr, maghrib, isha },
    zone,
  } = props;

  const textStyle = { fontSize: 16 };

  return (
    <WidgetContainer>
      <FlexWidget
        style={{
          flexDirection: "row",
          width: "match_parent",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <MonoTextWidget>{date.toDateString()}</MonoTextWidget>
        <MonoTextWidget>{getZoneDisplayName(zone)}</MonoTextWidget>
      </FlexWidget>

      <FlexWidget
        style={{
          flex: 1,
          flexDirection: "row",
          width: "match_parent",
        }}
      >
        <WaktuColumn
          date={date}
          label="Fajr"
          start={fajr}
          end={dhuhr}
          textStyle={textStyle}
        />
        <WaktuColumn
          date={date}
          label="Dhuhr"
          start={dhuhr}
          end={asr}
          textStyle={textStyle}
        />
        <WaktuColumn
          date={date}
          label="Asr"
          start={asr}
          end={maghrib}
          textStyle={textStyle}
        />
        <WaktuColumn
          date={date}
          label="Maghrib"
          start={maghrib}
          end={isha}
          textStyle={textStyle}
        />
        <WaktuColumn
          date={date}
          label="Isha"
          start={isha}
          textStyle={textStyle}
        />
      </FlexWidget>
    </WidgetContainer>
  );
}

async function updateWaktuSolatLargeAndRender(props: WidgetTaskHandlerProps) {
  const date = startOfMinute(new Date());
  const data = await getPrayerData(date, false);
  if (!data) {
    console.log("Missing PrayerData, returning");
    return;
  }

  console.log("Found PrayerData, rendering large widget");
  props.renderWidget(
    <WaktuSolatLarge
      date={date}
      zone={data.zone}
      prayerTime={data.waktuSolat.prayerTime}
    />,
  );
}

export async function waktuSolatLargeTaskHandler(
  props: WidgetTaskHandlerProps,
) {
  console.log(props.widgetAction, props.widgetInfo);

  switch (props.widgetAction) {
    case "WIDGET_ADDED":
      props.renderWidget(<Empty />);
      await updateWaktuSolatLargeAndRender(props);
      break;

    case "WIDGET_UPDATE":
      await updateWaktuSolatLargeAndRender(props);
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

export async function requestWaktuSolatLargeUpdate(
  date: Date,
  zone: Zone,
  prayerTime: PrayerTime,
) {
  await requestWidgetUpdate({
    widgetName: "WaktuSolatLarge",
    renderWidget: () => (
      <WaktuSolatLarge date={date} zone={zone} prayerTime={prayerTime} />
    ),
    widgetNotFound: () => {},
  });
}
