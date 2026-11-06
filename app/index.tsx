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
import { dateText as formatDate, useI18n } from "@/lib/i18n";

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

// Instead of empty times: loading, or why the times couldn't be loaded and a
// way to try again.
function NoTimes(props: { failure: LoadFailure | null; onRetry: () => void }) {
  const { failure, onRetry } = props;
  const { t } = useI18n();
  return (
    <View style={{ padding: 25, alignItems: "center", gap: 16 }}>
      <MonoText style={{ fontSize: 16, textAlign: "center" }}>
        {failure ? t(`home.failure.${failure}`) : t("home.loading")}
      </MonoText>
      {failure && (
        <Pressable onPress={onRetry} accessibilityRole="button">
          <MonoView style={{ borderWidth: 1, borderRadius: 8, padding: 10 }}>
            <MonoText style={{ fontSize: 16 }}>{t("home.retry")}</MonoText>
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

  const { lang, prayerName } = useI18n();
  const dateText = formatDate(lang, displayDate);

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
            label={prayerName("imsak")}
            start={imsak}
            end={fajr}
          />
          <PrayerTimeRow
            date={currentDate}
            label={prayerName("fajr")}
            start={fajr}
            end={syuruk}
          />
          <PrayerTimeRow
            date={currentDate}
            label={prayerName("syuruk")}
            start={syuruk}
            end={waktuSolat ? getSyurukEnd(waktuSolat.prayerTime) : dhuhr}
          />
          {dhuha !== undefined && (
            <PrayerTimeRow
              date={currentDate}
              label={prayerName("dhuha")}
              start={dhuha}
              end={dhuhr}
            />
          )}
          <PrayerTimeRow
            date={currentDate}
            label={prayerName("dhuhr")}
            start={dhuhr}
            end={asr}
          />
          <PrayerTimeRow
            date={currentDate}
            label={prayerName("asr")}
            start={asr}
            end={maghrib}
          />
          <PrayerTimeRow
            date={currentDate}
            label={prayerName("maghrib")}
            start={maghrib}
            end={isha}
          />
          <PrayerTimeRow
            date={currentDate}
            label={prayerName("isha")}
            start={isha}
          />
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

  const { lang, t } = useI18n();
  const locationText = zone ? getZoneLocationText(zone) : t("home.noLocation");
  const zoneText = zone ? getZoneInfoText(zone, lang) : t("home.noLocation");

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
          subtitle={t("home.today")}
          waktuSolat={waktuSolat}
          failure={failure}
          onRetry={retry}
        />
        <PrayerTimePage
          currentDate={date}
          displayDate={tomorrow}
          subtitle={t("home.tomorrow")}
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
