import React from "react";
import {
  FlexWidget,
  requestWidgetUpdate,
  WidgetTaskHandlerProps,
} from "react-native-android-widget";

import { MonoTextWidget } from "@/lib/components/MonoTextWidget";
import { PrayerTime } from "@/lib/data/waktuSolatStore";
import { Zone } from "@/lib/data/zoneStore";
import { Appearance } from "react-native";

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
      <MonoTextWidget fontWeight={fontWeight}>{props.children}</MonoTextWidget>
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

export function WaktuSolatWidget(props: WaktuSolatWidgetProps) {
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

  const colorScheme = Appearance.getColorScheme();

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
        backgroundColor: colorScheme === "dark" ? "#000000" : "#ffffff",
        borderRadius: 2,
        padding: 5,
      }}
    >
      <FlexWidget
        style={{
          flexDirection: "row",
          width: "match_parent",
          justifyContent: "space-between",
        }}
      >
        <MonoTextWidget>{date.toDateString()}</MonoTextWidget>
        <MonoTextWidget>{zoneText}</MonoTextWidget>
      </FlexWidget>

      <FlexWidget
        clickAction="WAKTU_SOLAT_CLICK_ACTION"
        style={{
          flex: 2,
          flexDirection: "row",
          width: "match_parent",
          borderRadius: 4,
          borderColor: colorScheme === "dark" ? "#ffffff" : "#000000",
          borderWidth: 1,
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

export async function requestWaktuSolatWidgetUpdate(
  date: Date,
  zone: Zone,
  prayerTime: PrayerTime,
) {
  await requestWidgetUpdate({
    widgetName: "WaktuSolat",
    renderWidget: () => (
      <WaktuSolatWidget date={date} zone={zone} prayerTime={prayerTime} />
    ),
    widgetNotFound: () => {},
  });
}

export async function renderWaktuSolatWidget(
  date: Date,
  zone: Zone,
  prayerTime: PrayerTime,
  props: WidgetTaskHandlerProps,
) {
  props.renderWidget(
    <WaktuSolatWidget date={date} zone={zone} prayerTime={prayerTime} />,
  );
}
