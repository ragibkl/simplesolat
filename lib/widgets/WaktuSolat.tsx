import { startOfMinute } from "date-fns";
import React from "react";
import {
  FlexWidget,
  requestWidgetUpdate,
  WidgetTaskHandlerProps,
} from "react-native-android-widget";

import { MonoTextWidget } from "@/lib/components/MonoTextWidget";
import { getMonoStyle } from "@/lib/components/monoui";
import { PrayerTime } from "@/lib/domain/prayerTime";
import { getZoneDisplayName, Zone } from "@/lib/domain/zone";
import { loadSettings, WidgetSecondColumn } from "@/lib/data/settingsStore";
import { getPrayerData } from "@/lib/service/prayerData";

import { Empty } from "./Empty";
import { getSecondColumn } from "./secondColumn";
import { WaktuColumn } from "./WaktuColumn";
import { WidgetContainer } from "./WidgetContainer";

export type WaktuSolatWidgetProps = {
  date: Date;
  zone: Zone;
  prayerTime: PrayerTime;
  secondColumn?: WidgetSecondColumn;
};

export function WaktuSolat(props: WaktuSolatWidgetProps) {
  const { date, prayerTime, zone, secondColumn } = props;
  const { fajr, syuruk, dhuhr, asr, maghrib, isha } = prayerTime;
  const second = getSecondColumn(prayerTime, secondColumn);

  const { borderColor } = getMonoStyle();

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
          borderRadius: 4,
          borderColor,
          borderWidth: 1,
          marginTop: 4,
        }}
      >
        <WaktuColumn date={date} label="Fajr" start={fajr} end={syuruk} />
        <WaktuColumn
          date={date}
          label={second.label}
          start={second.start}
          end={dhuhr}
        />
        <WaktuColumn date={date} label="Dhuhr" start={dhuhr} end={asr} />
        <WaktuColumn date={date} label="Asr" start={asr} end={maghrib} />
        <WaktuColumn date={date} label="Maghrib" start={maghrib} end={isha} />
        <WaktuColumn date={date} label="Isha" start={isha} />
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
  const { widgetSecondColumn } = await loadSettings();

  props.renderWidget(
    <WaktuSolat
      date={date}
      zone={data.zone}
      prayerTime={data.waktuSolat.prayerTime}
      secondColumn={widgetSecondColumn}
    />,
  );
}

export async function waktuSolatWidgetTaskHandler(
  props: WidgetTaskHandlerProps,
) {
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

    default:
      break;
  }
}

export async function requestWaktuSolatWidgetUpdate(
  date: Date,
  zone: Zone,
  prayerTime: PrayerTime,
) {
  const { widgetSecondColumn } = await loadSettings();
  await requestWidgetUpdate({
    widgetName: "WaktuSolat",
    renderWidget: () => (
      <WaktuSolat
        date={date}
        zone={zone}
        prayerTime={prayerTime}
        secondColumn={widgetSecondColumn}
      />
    ),
    widgetNotFound: () => {},
  });
}
