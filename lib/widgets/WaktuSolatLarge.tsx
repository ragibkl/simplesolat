import { addDays, startOfMinute } from "date-fns";
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
import { WaktuRow } from "./WaktuRow";
import { WidgetContainer } from "./WidgetContainer";
import { getNextPrayer, getTimeText } from "./utils";

export type WaktuSolatLargeWidgetProps = {
  date: Date;
  zone: Zone;
  prayerTime: PrayerTime;
  nextDayImsak?: number;
};

function WaktuSolatLarge(props: WaktuSolatLargeWidgetProps) {
  const {
    date,
    prayerTime: { imsak, fajr, syuruk, dhuhr, asr, maghrib, isha },
    zone,
    nextDayImsak,
  } = props;

  const { borderColor } = getMonoStyle();
  const currentEpoch = date.getTime() / 1000;
  const nextPrayer = getNextPrayer(
    props.prayerTime,
    currentEpoch,
    nextDayImsak,
  );

  return (
    <WidgetContainer>
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
          <MonoTextWidget>{zone.district}</MonoTextWidget>
          <MonoTextWidget>{date.toDateString()}</MonoTextWidget>
        </FlexWidget>

        {nextPrayer && (
          <FlexWidget
            style={{
              flexDirection: "column",
              alignItems: "flex-end",
            }}
          >
            <MonoTextWidget fontWeight="extrabold">
              {nextPrayer.label}
            </MonoTextWidget>
            <MonoTextWidget fontWeight="extrabold">
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
          borderColor,
          borderWidth: 1,
        }}
      >
        <FlexWidget
          style={{
            flex: 1,
            flexDirection: "column",
            height: "match_parent",
          }}
        >
          <WaktuRow date={date} label="Imsak" start={imsak} end={fajr} />
          <WaktuRow date={date} label="Fajr" start={fajr} end={syuruk} />
          <WaktuRow date={date} label="Syuruk" start={syuruk} end={dhuhr} />
        </FlexWidget>

        <FlexWidget
          style={{
            flex: 1,
            flexDirection: "column",
            height: "match_parent",
          }}
        >
          <WaktuRow date={date} label="Dhuhr" start={dhuhr} end={asr} />
          <WaktuRow date={date} label="Asr" start={asr} end={maghrib} />
          <WaktuRow date={date} label="Maghrib" start={maghrib} end={isha} />
          <WaktuRow date={date} label="Isha" start={isha} />
        </FlexWidget>
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

  const tomorrow = addDays(date, 1);
  const tomorrowData = await getPrayerData(tomorrow, false);
  const nextDayImsak = tomorrowData?.waktuSolat.prayerTime.imsak;

  console.log("Found PrayerData, rendering large widget");
  props.renderWidget(
    <WaktuSolatLarge
      date={date}
      zone={data.zone}
      prayerTime={data.waktuSolat.prayerTime}
      nextDayImsak={nextDayImsak}
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
  nextDayImsak?: number,
) {
  await requestWidgetUpdate({
    widgetName: "WaktuSolatLarge",
    renderWidget: () => (
      <WaktuSolatLarge
        date={date}
        zone={zone}
        prayerTime={prayerTime}
        nextDayImsak={nextDayImsak}
      />
    ),
    widgetNotFound: () => {},
  });
}
