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
import { loadSettings, WidgetExtraTime } from "@/lib/data/settingsStore";
import { getPrayerData } from "@/lib/service/prayerData";

import { Empty } from "./Empty";
import { WaktuColumn } from "./WaktuColumn";
import { getWidgetColumns } from "./widgetColumns";
import { WidgetContainer } from "./WidgetContainer";

export type WaktuSolatWidgetProps = {
  date: Date;
  zone: Zone;
  prayerTime: PrayerTime;
  extraTime?: WidgetExtraTime;
};

export function WaktuSolat(props: WaktuSolatWidgetProps) {
  const { date, prayerTime, zone, extraTime } = props;
  const columns = getWidgetColumns(prayerTime, extraTime);

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
        {columns.map((column) => (
          <WaktuColumn
            key={column.label}
            date={date}
            label={column.label}
            start={column.start}
            end={column.end}
          />
        ))}
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
  const { widgetExtraTime } = await loadSettings();

  props.renderWidget(
    <WaktuSolat
      date={date}
      zone={data.zone}
      prayerTime={data.waktuSolat.prayerTime}
      extraTime={widgetExtraTime}
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
  const { widgetExtraTime } = await loadSettings();
  await requestWidgetUpdate({
    widgetName: "WaktuSolat",
    renderWidget: () => (
      <WaktuSolat
        date={date}
        zone={zone}
        prayerTime={prayerTime}
        extraTime={widgetExtraTime}
      />
    ),
    widgetNotFound: () => {},
  });
}
