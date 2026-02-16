import { Link } from "expo-router";
import { View } from "react-native";

import { MonoPager } from "@/lib/components/MonoPager";
import { MonoScrollPage } from "@/lib/components/MonoScrollPage";
import { MonoText } from "@/lib/components/MonoText";
import { MonoView } from "@/lib/components/MonoView";
import { WaktuSolat } from "@/lib/data/waktuSolatStore";
import { useCurrentDate } from "@/lib/hooks/date";
import {
  useWaktuSolatCurrent,
  useWaktuSolatTomorrow,
} from "@/lib/hooks/waktuSolat";
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
      style={{ width: 150, fontSize: 20 }}
      fontWeight={props.bold ? "extrabold" : "regular"}
    >
      {props.children}
    </MonoText>
  );
}

function ValueText(props: { children: string; bold: boolean }) {
  return (
    <MonoText
      style={{ width: 100, fontSize: 20 }}
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

function PrayerTimePage(props: {
  currentDate: Date;
  dateText: string;
  subtitle: string;
  waktuSolat: WaktuSolat | null;
}) {
  const { currentDate, dateText, subtitle, waktuSolat } = props;

  const {
    imsak = 0,
    fajr = 0,
    syuruk = 0,
    dhuhr = 0,
    asr = 0,
    maghrib = 0,
    isha = 0,
  } = waktuSolat?.prayerTime || {};

  return (
    <View>
      <View style={{ padding: 20 }}>
        <MonoText style={{ padding: 5, fontSize: 20 }}>{dateText}</MonoText>
        <MonoText style={{ paddingHorizontal: 5, fontSize: 14 }}>
          {subtitle}
        </MonoText>
      </View>

      <View>
        <PrayerTimeRow
          date={currentDate}
          label="Imsak"
          start={imsak}
          end={fajr}
        />
        <PrayerTimeRow
          date={currentDate}
          label="Fajr"
          start={fajr}
          end={syuruk}
        />
        <PrayerTimeRow
          date={currentDate}
          label="Syuruk"
          start={syuruk}
          end={dhuhr}
        />
        <PrayerTimeRow
          date={currentDate}
          label="Dhuhr"
          start={dhuhr}
          end={asr}
        />
        <PrayerTimeRow
          date={currentDate}
          label="Asr"
          start={asr}
          end={maghrib}
        />
        <PrayerTimeRow
          date={currentDate}
          label="Maghrib"
          start={maghrib}
          end={isha}
        />
        <PrayerTimeRow date={currentDate} label="Isha" start={isha} />
      </View>
    </View>
  );
}

export default function Index() {
  const { date } = useCurrentDate();
  const { zone } = useUpdatedZone();
  const { waktuSolat } = useWaktuSolatCurrent();
  const { waktuSolatTomorrow, tomorrow } = useWaktuSolatTomorrow();
  useWaktuSolatWidgetUpdate();

  const zoneText = zone
    ? `${zone.zone} - ${zone.district}, ${zone.state}`
    : "Location not set";

  return (
    <MonoScrollPage>
      <View style={{ padding: 20, paddingBottom: 0 }}>
        <MonoText style={{ padding: 5, fontSize: 20 }}>{zoneText}</MonoText>
      </View>

      <MonoPager>
        <PrayerTimePage
          currentDate={date}
          dateText={date.toDateString()}
          subtitle="Today"
          waktuSolat={waktuSolat}
        />
        <PrayerTimePage
          currentDate={date}
          dateText={tomorrow.toDateString()}
          subtitle="Tomorrow"
          waktuSolat={waktuSolatTomorrow}
        />
      </MonoPager>

      {__DEV__ && (
        <View style={{ padding: 20, alignItems: "center" }}>
          <Link href="/previews">
            <MonoView style={{ borderWidth: 1, borderRadius: 8, padding: 8 }}>
              <MonoText style={{ fontSize: 16 }}>Widget Previews</MonoText>
            </MonoView>
          </Link>
        </View>
      )}
    </MonoScrollPage>
  );
}
