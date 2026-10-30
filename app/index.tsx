import { Link } from "expo-router";
import { Pressable, View } from "react-native";

import { getSyurukEnd, getTimeText, WaktuSolat } from "@/lib/domain/prayerTime";
import { getZoneInfoText, getZoneLocationText } from "@/lib/domain/zone";
import { LoadFailure } from "@/lib/data/mirror";

import { MonoPager } from "@/lib/components/MonoPager";
import { MonoScrollPage } from "@/lib/components/MonoScrollPage";
import { MonoText } from "@/lib/components/MonoText";
import { MonoView } from "@/lib/components/MonoView";
import { useCurrentDate } from "@/lib/hooks/date";
import {
  useWaktuSolatCurrent,
  useWaktuSolatTomorrow,
} from "@/lib/hooks/waktuSolat";
import { useWaktuSolatWidgetUpdate } from "@/lib/hooks/waktuSolatWidget";
import { useUpdatedZone } from "@/lib/hooks/zone";

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

const FAILURE_TEXT: Record<LoadFailure, string> = {
  offline: "Couldn't load the prayer times: no internet connection.",
  notFound: "This zone's timetable for this day isn't published yet.",
  server: "Couldn't load the prayer times: the server didn't answer.",
};

// Instead of empty times: loading, or why the times couldn't be loaded and a
// way to try again.
function NoTimes(props: { failure: LoadFailure | null; onRetry: () => void }) {
  const { failure, onRetry } = props;
  return (
    <View style={{ padding: 25, alignItems: "center", gap: 16 }}>
      <MonoText style={{ fontSize: 16, textAlign: "center" }}>
        {failure ? FAILURE_TEXT[failure] : "Loading prayer times…"}
      </MonoText>
      {failure && (
        <Pressable onPress={onRetry} accessibilityRole="button">
          <MonoView style={{ borderWidth: 1, borderRadius: 8, padding: 10 }}>
            <MonoText style={{ fontSize: 16 }}>Retry</MonoText>
          </MonoView>
        </Pressable>
      )}
    </View>
  );
}

function PrayerTimePage(props: {
  currentDate: Date;
  displayDate: Date;
  subtitle: string;
  waktuSolat: WaktuSolat | null;
  failure: LoadFailure | null;
  onRetry: () => void;
}) {
  const { currentDate, displayDate, subtitle, waktuSolat, failure, onRetry } =
    props;

  const {
    imsak = 0,
    fajr = 0,
    syuruk = 0,
    dhuha,
    dhuhr = 0,
    asr = 0,
    maghrib = 0,
    isha = 0,
  } = waktuSolat?.prayerTime || {};

  const dateText = displayDate.toDateString();

  return (
    <View>
      <View style={{ padding: 20 }}>
        <MonoText style={{ padding: 5, fontSize: 20 }}>{dateText}</MonoText>
        <MonoText style={{ paddingHorizontal: 5, fontSize: 14 }}>
          {subtitle}
        </MonoText>
      </View>

      {!waktuSolat ? (
        <NoTimes failure={failure} onRetry={onRetry} />
      ) : (
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
            end={waktuSolat ? getSyurukEnd(waktuSolat.prayerTime) : dhuhr}
          />
          {dhuha !== undefined && (
            <PrayerTimeRow
              date={currentDate}
              label="Dhuha"
              start={dhuha}
              end={dhuhr}
            />
          )}
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
      )}
    </View>
  );
}

export default function Index() {
  const { date } = useCurrentDate();
  const { zone } = useUpdatedZone();
  const { waktuSolat, failure, retry } = useWaktuSolatCurrent();
  const { waktuSolatTomorrow, tomorrowFailure, retryTomorrow, tomorrow } =
    useWaktuSolatTomorrow();
  useWaktuSolatWidgetUpdate();

  const locationText = zone ? getZoneLocationText(zone) : "Location not set";
  const zoneText = zone ? getZoneInfoText(zone) : "Location not set";

  return (
    <MonoScrollPage>
      <View style={{ padding: 20, paddingBottom: 0 }}>
        <MonoText style={{ padding: 5, fontSize: 20 }}>{locationText}</MonoText>
        <MonoText style={{ padding: 5, fontSize: 14 }}>{zoneText}</MonoText>
      </View>

      <MonoPager>
        <PrayerTimePage
          currentDate={date}
          displayDate={date}
          subtitle="Today"
          waktuSolat={waktuSolat}
          failure={failure}
          onRetry={retry}
        />
        <PrayerTimePage
          currentDate={date}
          displayDate={tomorrow}
          subtitle="Tomorrow"
          waktuSolat={waktuSolatTomorrow}
          failure={tomorrowFailure}
          onRetry={retryTomorrow}
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
