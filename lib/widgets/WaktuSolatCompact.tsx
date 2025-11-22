import { startOfMinute } from "date-fns";
import React from "react";
import {
  FlexWidget,
  requestWidgetUpdate,
  WidgetTaskHandlerProps,
} from "react-native-android-widget";

import { MonoTextWidget } from "@/lib/components/MonoTextWidget";
import { getMonoStyle } from "@/lib/components/monoui";
import { PrayerTime } from "@/lib/data/waktuSolatStore";
import { Zone } from "@/lib/data/zoneStore";
import { getPrayerData } from "@/lib/service/waktuSolatWidget";

import { Empty } from "./Empty";
import { WaktuColumn, WaktuColumnProps } from "./WaktuColumn";
import { WaktuSolatWidgetProps } from "./WaktuSolat";
import { WidgetContainer } from "./WidgetContainer";

function Column(props: WaktuColumnProps) {
  return <WaktuColumn textStyle={{ fontSize: 10 }} {...props} />;
}

function WaktuSolatCompact(props: WaktuSolatWidgetProps) {
  const {
    date,
    prayerTime: { fajr, syuruk, dhuhr, asr, maghrib, isha },
    zone,
  } = props;

  const { backgroundColor } = getMonoStyle();

  return (
    <WidgetContainer style={{ backgroundColor, borderRadius: 0, padding: 5 }}>
      <FlexWidget
        style={{
          flexDirection: "row",
          width: "match_parent",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <MonoTextWidget style={{ fontSize: 10 }}>
          {date.toDateString()}
        </MonoTextWidget>
        <MonoTextWidget style={{ fontSize: 10 }}>
          {zone.district}
        </MonoTextWidget>
      </FlexWidget>

      <FlexWidget
        clickAction="WAKTU_SOLAT_CLICK_ACTION"
        style={{
          flex: 1,
          flexDirection: "row",
          width: "match_parent",
        }}
      >
        <Column date={date} label="Fajr" start={fajr} end={syuruk} />
        <Column date={date} label="Dhuhr" start={dhuhr} end={asr} />
        <Column date={date} label="Asr" start={asr} end={maghrib} />
        <Column date={date} label="Maghrib" start={maghrib} end={isha} />
        <Column date={date} label="Isha" start={isha} />
      </FlexWidget>
    </WidgetContainer>
  );
}

async function updateWaktuSolatAndRender(props: WidgetTaskHandlerProps) {
  const date = startOfMinute(new Date());
  const data = await getPrayerData(date, false);
  if (!data) {
    console.log("Missing PrayerData, returning");
    return;
  }

  console.log("Found PrayerData, rendering widget");
  props.renderWidget(
    <WaktuSolatCompact
      date={date}
      zone={data.zone}
      prayerTime={data.waktuSolat.prayerTime}
    />,
  );
}

export async function waktuSolatCompactTaskHandler(
  props: WidgetTaskHandlerProps,
) {
  console.log(props.widgetAction, props.widgetInfo);

  switch (props.widgetAction) {
    case "WIDGET_ADDED":
      props.renderWidget(<Empty />);
      await updateWaktuSolatAndRender(props);
      break;

    case "WIDGET_UPDATE":
      await updateWaktuSolatAndRender(props);
      break;

    case "WIDGET_RESIZED":
      // Not needed for now
      break;

    case "WIDGET_DELETED":
      // Not needed for now
      break;

    case "WIDGET_CLICK":
      // Not needed for now
      if (props.clickAction === "WAKTU_SOLAT_CLICK_ACTION") {
        await updateWaktuSolatAndRender(props);
      }
      break;

    default:
      break;
  }
}

export async function requestWaktuSolatCompactUpdate(
  date: Date,
  zone: Zone,
  prayerTime: PrayerTime,
) {
  await requestWidgetUpdate({
    widgetName: "WaktuSolatCompact",
    renderWidget: () => (
      <WaktuSolatCompact date={date} zone={zone} prayerTime={prayerTime} />
    ),
    widgetNotFound: () => {},
  });
}
