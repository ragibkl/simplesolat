import React from "react";
import {
  FlexWidget,
  requestWidgetUpdate,
  TextWidget,
  WidgetTaskHandlerProps,
} from "react-native-android-widget";

import { PrayerTime } from "@/lib/data/waktuSolatStore";
import { Zone } from "@/lib/data/zoneStore";

function getTimeText(epochSeconds: number) {
  const date = new Date(0);
  date.setUTCSeconds(epochSeconds);
  return date.toLocaleString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ColumnText(props: { children: string; bold: boolean }) {
  return (
    <FlexWidget
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <TextWidget
        text={props.children}
        style={{
          fontSize: 11,
          fontFamily: props.bold ? "JetBrainsMono_800ExtraBold" :"JetBrainsMono_400Regular",
        }}
      />
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
        backgroundColor: "#ffffff",
        borderRadius: 5,
        padding: 10,
      }}
    >
      <FlexWidget
        style={{
          flexDirection: "row",
          width: "match_parent",
          justifyContent: "space-between",
        }}
      >
        <TextWidget
          text={date.toDateString()}
          style={{
            fontSize: 11,
            color: "#000000",
            fontFamily: "JetBrainsMono_400Regular",
          }}
        />
        <TextWidget
          text={zoneText}
          style={{
            fontSize: 11,
            color: "#000000",
            fontFamily: "JetBrainsMono_400Regular",
          }}
        />
      </FlexWidget>

      <FlexWidget
        clickAction="WAKTU_SOLAT_CLICK_ACTION"
        style={{
          flex: 2,
          flexDirection: "row",
          width: "match_parent",
          borderRadius: 4,
          borderColor: "#000000",
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
