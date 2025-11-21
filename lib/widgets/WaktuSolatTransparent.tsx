import { startOfMinute } from "date-fns";
import React from "react";
import {
  FlexWidget,
  requestWidgetUpdate,
  TextWidgetStyle,
  WidgetTaskHandlerProps,
} from "react-native-android-widget";

import { MonoTextWidget } from "@/lib/components/MonoTextWidget";
import { PrayerTime } from "@/lib/data/waktuSolatStore";
import { Zone } from "@/lib/data/zoneStore";
import { getPrayerData } from "@/lib/service/waktuSolatWidget";

import { EmptyTransparent } from "./EmptyTransparent";
import { WaktuColumn, WaktuColumnProps } from "./WaktuColumn";
import { WaktuSolatWidgetProps } from "./WaktuSolat";
import { WidgetContainer } from "./WidgetContainer";

const textStyle: TextWidgetStyle = {
  color: "#FFFFFF",
  textShadowColor: "#000000",
  textShadowRadius: 1,
  textShadowOffset: { height: 1, width: 1 },
};

function Column(props: WaktuColumnProps) {
  return <WaktuColumn textStyle={textStyle} {...props} />;
}

function WaktuSolatTransparent(props: WaktuSolatWidgetProps) {
  const {
    date,
    prayerTime: { fajr, syuruk, dhuhr, asr, maghrib, isha },
    zone,
  } = props;

  return (
    <WidgetContainer style={{ backgroundColor: "rgba(0, 0, 0, 0)" }}>
      <FlexWidget
        style={{
          flex: 1,
          flexDirection: "row",
          width: "match_parent",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <MonoTextWidget style={textStyle}>{date.toDateString()}</MonoTextWidget>
        <MonoTextWidget style={textStyle}>{zone.district}</MonoTextWidget>
      </FlexWidget>

      <FlexWidget
        clickAction="WAKTU_SOLAT_CLICK_ACTION"
        style={{
          flex: 2,
          flexDirection: "row",
          width: "match_parent",
          borderRadius: 4,
        }}
      >
        <Column date={date} label="Fajr" start={fajr} end={syuruk} />
        <Column date={date} label="Syuruk" start={syuruk} end={dhuhr} />
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
    <WaktuSolatTransparent
      date={date}
      zone={data.zone}
      prayerTime={data.waktuSolat.prayerTime}
    />,
  );
}

export async function waktuSolatTransparentTaskHandler(
  props: WidgetTaskHandlerProps,
) {
  console.log(props.widgetAction, props.widgetInfo);

  switch (props.widgetAction) {
    case "WIDGET_ADDED":
      props.renderWidget(<EmptyTransparent />);
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

export async function requestWaktuSolatTransparentUpdate(
  date: Date,
  zone: Zone,
  prayerTime: PrayerTime,
) {
  await requestWidgetUpdate({
    widgetName: "WaktuSolatTransparent",
    renderWidget: () => (
      <WaktuSolatTransparent date={date} zone={zone} prayerTime={prayerTime} />
    ),
    widgetNotFound: () => {},
  });
}
