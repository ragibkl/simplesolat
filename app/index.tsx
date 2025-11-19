import { View } from "react-native";

import { MonoText } from "@/lib/components/MonoText";
import { MonoView } from "@/lib/components/MonoView";
import { useCurrentDate } from "@/lib/hooks/date";
import { useWaktuSolatCurrent } from "@/lib/hooks/waktuSolat";
import { useWaktuSolatWidgetUpdate } from "@/lib/hooks/waktuSolatWidget";
import { useUpdatedZone } from "@/lib/hooks/zone";

function getTimeText(epochSeconds: number) {
  const date = new Date(0);
  date.setUTCSeconds(epochSeconds);
  return date.toLocaleString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function LabelText(props: { children: string; bold: boolean }) {
  return (
    <MonoText
      style={{ width: 150, fontSize: 20}}
      fontWeight={props.bold ? "extrabold" : "regular"}
    >
      {props.children}
    </MonoText>
  );
}

function ValueText(props: { children: string; bold: boolean }) {
  return (
    <MonoText
      style={{ width: 100, fontSize: 20}}
      fontWeight={props.bold ? "extrabold" : "regular"}
    >
      {props.children}
    </MonoText>
  );
}

function PrayerTimeRow(props: {
  date: Date;
  label: string;
  start: number;
  end?: number;
}) {
  const { date, label, start, end = Infinity } = props;
  const epoch = date.getTime() / 1000;
  const bold = epoch >= start && epoch < end;

  return (
    <View
      style={{
        paddingVertical: 10,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <LabelText bold={bold}>{label}</LabelText>
      <ValueText bold={bold}>{getTimeText(start)}</ValueText>
    </View>
  );
}

export default function Index() {
  const { date } = useCurrentDate();
  const { zone } = useUpdatedZone();
  const { waktuSolat } = useWaktuSolatCurrent();
  useWaktuSolatWidgetUpdate();

  const dateText = date.toDateString();

  const {
    fajr = 0,
    syuruk = 0,
    dhuhr = 0,
    asr = 0,
    maghrib = 0,
    isha = 0,
  } = waktuSolat?.prayerTime || {};

  const zoneText = zone
    ? `${zone.zone} - ${zone.district}, ${zone.state}`
    : "Location not set";

  return (
    <MonoView style={{ flex: 1 }}>
      <View style={{ padding: 20 }}>
        <MonoText style={{ padding: 5, fontSize: 20}}>
          {dateText}
        </MonoText>
        <MonoText style={{ padding: 5, fontSize: 20}}>
          {zoneText}
        </MonoText>
      </View>

      <View>
        <PrayerTimeRow date={date} label="Fajr" start={fajr} end={syuruk} />
        <PrayerTimeRow date={date} label="Syuruk" start={syuruk} end={dhuhr} />
        <PrayerTimeRow date={date} label="Dhuhr" start={dhuhr} end={asr} />
        <PrayerTimeRow date={date} label="Asr" start={asr} end={maghrib} />
        <PrayerTimeRow date={date} label="Maghrib" start={maghrib} end={isha} />
        <PrayerTimeRow date={date} label="Isha" start={isha} />
      </View>
    </MonoView>
  );
}
