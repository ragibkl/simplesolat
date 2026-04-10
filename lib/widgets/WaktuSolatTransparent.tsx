import { startOfMinute } from "date-fns";
import React from "react";
import {
  FlexWidget,
  requestWidgetUpdate,
  TextWidgetStyle,
  WidgetTaskHandlerProps,
} from "react-native-android-widget";

import { MonoTextWidget } from "@/lib/components/MonoTextWidget";
import { PrayerTime } from "@/lib/domain/prayerTime";
import { Zone, getZoneDisplayName } from "@/lib/domain/zone";
import { getPrayerData } from "@/lib/service/prayerData";

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

export function WaktuSolatTransparent(props: WaktuSolatWidgetProps) {
  const {
    date,
    prayerTime: { fajr, syuruk, dhuhr, asr, maghrib, isha },
    zone,
  } = props;

  return (
    <WidgetContainer transparent>
      <FlexWidget
        style={{
          flexDirection: "row",
          width: "match_parent",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <MonoTextWidget style={textStyle}>{date.toDateString()}</MonoTextWidget>
        <MonoTextWidget style={textStyle}>
          {getZoneDisplayName(zone)}
        </MonoTextWidget>
      </FlexWidget>

      <FlexWidget
        style={{
          flex: 1,
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
    return;
  }

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
