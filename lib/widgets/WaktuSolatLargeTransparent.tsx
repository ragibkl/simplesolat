import { addDays, startOfMinute } from "date-fns";
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
import { WaktuRow, WaktuRowProps } from "./WaktuRow";
import { WidgetContainer } from "./WidgetContainer";
import { getNextPrayer, getTimeText } from "./utils";

const textStyle: TextWidgetStyle = {
  color: "#FFFFFF",
  textShadowColor: "#000000",
  textShadowRadius: 1,
  textShadowOffset: { height: 1, width: 1 },
};

function Row(props: WaktuRowProps) {
  return <WaktuRow textStyle={textStyle} {...props} />;
}

export type WaktuSolatLargeTransparentProps = {
  date: Date;
  zone: Zone;
  prayerTime: PrayerTime;
  nextDayImsak?: number;
};

function WaktuSolatLargeTransparent(props: WaktuSolatLargeTransparentProps) {
  const {
    date,
    prayerTime: { imsak, fajr, syuruk, dhuhr, asr, maghrib, isha },
    zone,
    nextDayImsak,
  } = props;

  const currentEpoch = date.getTime() / 1000;
  const nextPrayer = getNextPrayer(
    props.prayerTime,
    currentEpoch,
    nextDayImsak,
  );

  return (
    <WidgetContainer style={{ backgroundColor: "rgba(0, 0, 0, 0)" }}>
      <FlexWidget
        style={{
          flexDirection: "row",
          width: "match_parent",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <FlexWidget
          style={{
            flexDirection: "column",
            alignItems: "flex-start",
          }}
        >
          <MonoTextWidget style={textStyle}>{zone.district}</MonoTextWidget>
          <MonoTextWidget style={textStyle}>
            {date.toDateString()}
          </MonoTextWidget>
        </FlexWidget>

        {nextPrayer && (
          <FlexWidget
            style={{
              flexDirection: "column",
              alignItems: "flex-end",
            }}
          >
            <MonoTextWidget style={textStyle} fontWeight="extrabold">
              {nextPrayer.label}
            </MonoTextWidget>
            <MonoTextWidget style={textStyle} fontWeight="extrabold">
              {getTimeText(nextPrayer.epochSeconds)}
            </MonoTextWidget>
          </FlexWidget>
        )}
      </FlexWidget>

      <FlexWidget
        style={{
          flex: 1,
          flexDirection: "row",
          width: "match_parent",
          borderRadius: 4,
        }}
      >
        <FlexWidget
          style={{
            flex: 1,
            flexDirection: "column",
            height: "match_parent",
          }}
        >
          <Row date={date} label="Imsak" start={imsak} end={fajr} />
          <Row date={date} label="Fajr" start={fajr} end={syuruk} />
          <Row date={date} label="Syuruk" start={syuruk} end={dhuhr} />
        </FlexWidget>

        <FlexWidget
          style={{
            flex: 1,
            flexDirection: "column",
            height: "match_parent",
          }}
        >
          <Row date={date} label="Dhuhr" start={dhuhr} end={asr} />
          <Row date={date} label="Asr" start={asr} end={maghrib} />
          <Row date={date} label="Maghrib" start={maghrib} end={isha} />
          <Row date={date} label="Isha" start={isha} />
        </FlexWidget>
      </FlexWidget>
    </WidgetContainer>
  );
}

async function updateAndRender(props: WidgetTaskHandlerProps) {
  const date = startOfMinute(new Date());
  const data = await getPrayerData(date, false);
  if (!data) {
    console.log("Missing PrayerData, returning");
    return;
  }

  const tomorrow = addDays(date, 1);
  const tomorrowData = await getPrayerData(tomorrow, false);
  const nextDayImsak = tomorrowData?.waktuSolat.prayerTime.imsak;

  console.log("Found PrayerData, rendering large transparent widget");
  props.renderWidget(
    <WaktuSolatLargeTransparent
      date={date}
      zone={data.zone}
      prayerTime={data.waktuSolat.prayerTime}
      nextDayImsak={nextDayImsak}
    />,
  );
}

export async function waktuSolatLargeTransparentTaskHandler(
  props: WidgetTaskHandlerProps,
) {
  console.log(props.widgetAction, props.widgetInfo);

  switch (props.widgetAction) {
    case "WIDGET_ADDED":
      props.renderWidget(<EmptyTransparent />);
      await updateAndRender(props);
      break;

    case "WIDGET_UPDATE":
      await updateAndRender(props);
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

export async function requestWaktuSolatLargeTransparentUpdate(
  date: Date,
  zone: Zone,
  prayerTime: PrayerTime,
  nextDayImsak?: number,
) {
  await requestWidgetUpdate({
    widgetName: "WaktuSolatLargeTransparent",
    renderWidget: () => (
      <WaktuSolatLargeTransparent
        date={date}
        zone={zone}
        prayerTime={prayerTime}
        nextDayImsak={nextDayImsak}
      />
    ),
    widgetNotFound: () => {},
  });
}
