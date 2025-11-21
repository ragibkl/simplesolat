import React from "react";
import {
  FlexWidget,
  requestWidgetUpdate,
  WidgetTaskHandlerProps,
} from "react-native-android-widget";

import { PrayerTime } from "@/lib/data/waktuSolatStore";
import { Zone } from "@/lib/data/zoneStore";
import { startOfMinute } from "date-fns";
import { ShadowTextWidget } from "../components/ShadowTextWidget";
import { getPrayerData } from "../service/waktuSolatWidget";
import { EmptyTransparent } from "./EmptyTransparent";

function getTimeText(epochSeconds: number) {
  const date = new Date(0);
  date.setUTCSeconds(epochSeconds);
  return date.toLocaleString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ColumnText(props: { children: string; bold: boolean }) {
  const fontWeight = props.bold ? "bold" : "regular";
  return (
    <FlexWidget
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <ShadowTextWidget fontWeight={fontWeight}>{props.children}</ShadowTextWidget>
    </FlexWidget>
  );
}


function Column(props: {
  date: Date;
  label: string;
  start: number;
  end?: number;
}) {
  const { date, label, start, end = Infinity } = props;
  const epoch = date.getTime() / 1000;
  const bold = epoch >= start && epoch < end;

  return (
    <FlexWidget
      style={{
        flex: 1,
        flexDirection: "column",
        height: "match_parent",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <ColumnText bold={bold}>{label}</ColumnText>
      <ColumnText bold={bold}>{getTimeText(start)}</ColumnText>
    </FlexWidget>
  );
}

type WaktuSolatWidgetProps = {
  date: Date;
  zone?: Zone;
  prayerTime?: PrayerTime;
};

export function WaktuSolatTransparent(props: WaktuSolatWidgetProps) {
  const {
    date,
    prayerTime: {
      fajr = 0,
      syuruk = 0,
      dhuhr = 0,
      asr = 0,
      maghrib = 0,
      isha = 0,
    } = {},
    zone,
  } = props;

  const zoneText = zone ? zone.district : "Location not set";

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        flex: 1,
        flexDirection: "column",
        height: "match_parent",
        width: "match_parent",
        justifyContent: "space-between",
        alignItems: "flex-start",
        borderRadius: 5,
        padding: 10,
      }}
    >
      <FlexWidget
        style={{
          flexDirection: "row",
          width: "match_parent",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <ShadowTextWidget>{date.toDateString()}</ShadowTextWidget>
        <ShadowTextWidget>{zoneText}</ShadowTextWidget>
      </FlexWidget>

      <FlexWidget
        clickAction="WAKTU_SOLAT_CLICK_ACTION"
        style={{
          flex: 2,
          flexDirection: "row",
          width: "match_parent",
        }}
      >
        <Column date={date} label="Fajr" start={fajr} end={syuruk} />
        <Column date={date} label="Syuruk" start={syuruk} end={dhuhr} />
        <Column date={date} label="Dhuhr" start={dhuhr} end={asr} />
        <Column date={date} label="Asr" start={asr} end={maghrib} />
        <Column date={date} label="Maghrib" start={maghrib} end={isha} />
        <Column date={date} label="Isha" start={isha} />
      </FlexWidget>
    </FlexWidget>
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
    <WaktuSolatTransparent date={date} zone={data.zone} prayerTime={data.waktuSolat.prayerTime} />,
  );
}

export async function waktuSolatTransparentTaskHandler(props: WidgetTaskHandlerProps) {
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
