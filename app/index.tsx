import * as Location from "expo-location";
import { Link } from "expo-router";
import { useState } from "react";
import { Linking, Platform, Pressable, View } from "react-native";

import { getSyurukEnd, getTimeText, WaktuSolat } from "@/lib/domain/prayerTime";
import {
  gmtLabel,
  phoneOffsetMinutes,
  zoneOffsetMinutes,
} from "@/lib/domain/timezone";
import {
  getZoneDisplayName,
  getZoneInfoText,
  getZoneLocationText,
  Zone,
} from "@/lib/domain/zone";
import { getCalculationMethod } from "@/lib/domain/adhanCalculator";
import type { LocationProblem } from "@/lib/service/location";
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
import { dateText as formatDate, shortDateText, useI18n } from "@/lib/i18n";

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

// "3:42 pm" today, "12 Nov" before.
function whenText(lang: "en" | "ms", epochMs: number, now: Date): string {
  const at = new Date(epochMs);
  if (at.toDateString() === now.toDateString()) {
    return at.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return shortDateText(lang, at);
}

// A zone not checked for this long gets a quiet "last checked" line.
const STALE_AFTER_MS = 24 * 60 * 60 * 1000;

async function fixLocation(problem: LocationProblem) {
  if (problem === "off" && Platform.OS === "android") {
    try {
      // Android's own "turn on location" dialog.
      await Location.enableNetworkProviderAsync();
      return;
    } catch {}
  }
  await Linking.openSettings();
}

// Under the place name: why the zone may be out of date, the time-zone hint
// and what "calculated" means. Says nothing when all is well.
function ZoneNotes(props: {
  zone: Zone;
  checkedAt: number | null;
  problem: LocationProblem | null;
  now: Date;
}) {
  const { zone, checkedAt, problem, now } = props;
  const { lang, t } = useI18n();
  const place = getZoneDisplayName(zone);
  const notes: {
    text: string;
    action?: { label: string; onPress: () => void };
  }[] = [];

  if (problem) {
    const checked = checkedAt
      ? t("zone.stale.checked", { when: whenText(lang, checkedAt, now) })
      : "";
    notes.push({
      text: t(problem === "off" ? "zone.stale.off" : "zone.stale.denied", {
        place,
        checked,
      }),
      action: {
        label: t(problem === "off" ? "zone.stale.turnOn" : "zone.stale.allow"),
        onPress: () => fixLocation(problem),
      },
    });
  } else if (checkedAt && now.getTime() - checkedAt > STALE_AFTER_MS) {
    notes.push({
      text: t("zone.stale.old", { when: whenText(lang, checkedAt, now) }),
    });
  }

  if (zone.type === "official") {
    const zoneOffset = zoneOffsetMinutes(zone.timezone, now);
    const phoneOffset = phoneOffsetMinutes(now);
    if (zoneOffset !== null && zoneOffset !== phoneOffset) {
      const diff = Math.abs(zoneOffset - phoneOffset);
      const h = Math.floor(diff / 60);
      const m = diff % 60;
      notes.push({
        text: t("zone.tzHint", {
          phone: gmtLabel(phoneOffset),
          place,
          diff: m
            ? t("zone.tzHint.hoursMinutes", { n: h, m })
            : t("zone.tzHint.hours", { n: h }),
          direction: t(
            zoneOffset > phoneOffset
              ? "zone.tzHint.ahead"
              : "zone.tzHint.behind",
          ),
        }),
      });
    }
  }

  if (notes.length === 0) return null;
  return (
    <View style={{ paddingHorizontal: 5, paddingTop: 6, gap: 8 }}>
      {notes.map((note) => (
        <View key={note.text} style={{ gap: 6 }}>
          <MonoText style={{ fontSize: 13 }}>{note.text}</MonoText>
          {note.action && (
            <Pressable
              onPress={note.action.onPress}
              accessibilityRole="button"
              style={{ alignSelf: "flex-start" }}
            >
              <MonoView style={{ borderWidth: 1, borderRadius: 8, padding: 6 }}>
                <MonoText style={{ fontSize: 13 }}>
                  {note.action.label}
                </MonoText>
              </MonoView>
            </Pressable>
          )}
        </View>
      ))}
    </View>
  );
}

export default function Index() {
  const { date } = useCurrentDate();
  const { zone, checkedAt, problem } = useUpdatedZone();
  const [explainOpen, setExplainOpen] = useState(false);
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
        {zone?.type === "calculated" ? (
          <Pressable
            onPress={() => setExplainOpen(!explainOpen)}
            accessibilityRole="button"
          >
            <MonoText style={{ padding: 5, fontSize: 14 }}>
              {`${zoneText} ⓘ`}
            </MonoText>
            {explainOpen && (
              <MonoText style={{ paddingHorizontal: 5, fontSize: 13 }}>
                {t("zone.calculated.explain", {
                  method: getCalculationMethod(zone.country).label,
                })}
              </MonoText>
            )}
          </Pressable>
        ) : (
          <MonoText style={{ padding: 5, fontSize: 14 }}>{zoneText}</MonoText>
        )}
        {zone && (
          <ZoneNotes
            zone={zone}
            checkedAt={checkedAt}
            problem={problem}
            now={date}
          />
        )}
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
