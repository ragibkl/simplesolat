import { useCallback, useEffect, useState } from "react";
import { AppState, Platform, Pressable, Switch, View } from "react-native";

import { MonoScrollPage } from "@/lib/components/MonoScrollPage";
import { MonoText } from "@/lib/components/MonoText";
import { OfflineData } from "@/lib/components/OfflineData";
import { useMonoStyle } from "@/lib/components/monoui";
import {
  saveSettings,
  Settings,
  useSettings,
  WidgetExtraTime,
} from "@/lib/data/settingsStore";
import { PrayerTime } from "@/lib/domain/prayerTime";
import { sendTestNotification } from "@/lib/service/notifee";
import {
  getPermissionChecks,
  PermissionCheck,
} from "@/lib/service/permissionStatus";
import { updateWaktuSolatAndWidgets } from "@/lib/service/waktuSolatWidget";
import { LANGUAGES, LanguageSetting, useI18n } from "@/lib/i18n";

const PRAYERS: (keyof PrayerTime)[] = [
  "imsak",
  "fajr",
  "syuruk",
  "dhuha",
  "dhuhr",
  "asr",
  "maghrib",
  "isha",
];

const WIDGET_EXTRA_TIMES: WidgetExtraTime[] = [
  "none",
  "imsak",
  "syuruk",
  "dhuha",
];

function RadioRow(props: {
  label: string;
  checked: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: props.checked }}
      onPress={props.onPress}
      style={{ paddingVertical: 8 }}
    >
      <MonoText style={{ fontSize: 16 }}>
        {(props.checked ? "● " : "○ ") + props.label}
      </MonoText>
    </Pressable>
  );
}

function SectionTitle(props: { children: string }) {
  return (
    <MonoText
      fontWeight="bold"
      style={{ fontSize: 18, paddingTop: 24, paddingBottom: 8 }}
    >
      {props.children}
    </MonoText>
  );
}

function Button(props: { label: string; onPress: () => void }) {
  const { borderColor } = useMonoStyle();
  return (
    <Pressable
      onPress={props.onPress}
      style={{
        borderWidth: 1,
        borderColor,
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
      }}
    >
      <MonoText style={{ fontSize: 14 }}>{props.label}</MonoText>
    </Pressable>
  );
}

function PermissionRow(props: {
  check: PermissionCheck;
  fixLabel: string;
  onFix: () => void;
}) {
  const { check } = props;
  return (
    <View style={{ paddingVertical: 8 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <MonoText style={{ fontSize: 16, flex: 1 }}>
          {check.ok ? "✓ " : "✗ "}
          {check.label}
        </MonoText>
        {!check.ok && <Button label={props.fixLabel} onPress={props.onFix} />}
      </View>
      {!check.ok && (
        <MonoText style={{ fontSize: 13, paddingTop: 4 }}>
          {check.help}
        </MonoText>
      )}
    </View>
  );
}

export default function SettingsScreen() {
  const { color, backgroundColor, colorScheme } = useMonoStyle();
  const offTrackColor = colorScheme === "dark" ? "#555555" : "#BDBDBD";
  // iOS 26 ignores thumbColor and always draws a white knob, which vanished
  // on the white "on" track in dark mode: use light grey there instead.
  const onTrackColor =
    Platform.OS === "ios" && colorScheme === "dark" ? "#A0A0A0" : color;
  const { settings } = useSettings();
  const { lang, t, prayerName } = useI18n();
  const [checks, setChecks] = useState<PermissionCheck[]>([]);
  const [testSent, setTestSent] = useState(false);

  const refreshChecks = useCallback(async () => {
    setChecks(await getPermissionChecks(lang));
  }, [lang]);

  // Re-check when coming back from the system settings.
  useEffect(() => {
    refreshChecks();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") refreshChecks();
    });
    return () => sub.remove();
  }, [refreshChecks]);

  const update = async (newSettings: Settings) => {
    await saveSettings(newSettings);
    await updateWaktuSolatAndWidgets(false, true);
  };

  const toggleNotification = (key: keyof PrayerTime, value: boolean) =>
    update({
      ...settings,
      notifications: { ...settings.notifications, [key]: value },
    });

  const needsFix = checks.some((check) => !check.ok);
  const permissions = (
    <>
      <SectionTitle>{t("settings.permissions")}</SectionTitle>
      {!needsFix && checks.length > 0 && (
        <MonoText style={{ fontSize: 13, paddingBottom: 4 }}>
          {t("settings.permissions.allGood")}
        </MonoText>
      )}
      {checks
        .filter((check) => needsFix || check.ok)
        .map((check) => (
          <PermissionRow
            key={check.key}
            check={check}
            fixLabel={t("settings.fix")}
            onFix={async () => {
              await check.fix();
              await refreshChecks();
            }}
          />
        ))}
      <View style={{ paddingTop: 8, alignItems: "flex-start" }}>
        <Button
          label={
            testSent
              ? t("settings.testNotificationSent")
              : t("settings.testNotification")
          }
          onPress={async () => {
            await sendTestNotification();
            setTestSent(true);
          }}
        />
      </View>
    </>
  );

  // Order: a permission problem first (it's why reminders go missing), then
  // the settings people come for, then the long country list; permissions
  // that are all fine go last.
  return (
    <MonoScrollPage>
      <View style={{ padding: 20 }}>
        {needsFix && permissions}

        <SectionTitle>{t("settings.language")}</SectionTitle>
        {LANGUAGES.map((option) => (
          <RadioRow
            key={option.key}
            label={option.label ?? t("settings.language.system")}
            checked={(settings.language ?? "system") === option.key}
            onPress={() =>
              update({
                ...settings,
                language: option.key as LanguageSetting,
              })
            }
          />
        ))}

        <SectionTitle>{t("settings.notifications")}</SectionTitle>
        {PRAYERS.map((prayer) => (
          <View
            key={prayer}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: 4,
            }}
          >
            <View style={{ flex: 1 }}>
              <MonoText style={{ fontSize: 16 }}>{prayerName(prayer)}</MonoText>
              {prayer === "dhuha" && (
                <MonoText style={{ fontSize: 12 }}>
                  {t("settings.dhuhaNote")}
                </MonoText>
              )}
            </View>
            <Switch
              value={settings.notifications[prayer]}
              onValueChange={(value) => toggleNotification(prayer, value)}
              trackColor={{ true: onTrackColor, false: offTrackColor }}
              thumbColor={backgroundColor}
            />
          </View>
        ))}

        {Platform.OS === "android" && (
          <>
            <SectionTitle>{t("settings.pinned")}</SectionTitle>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingVertical: 4,
              }}
            >
              <View style={{ flex: 1, paddingRight: 12 }}>
                <MonoText style={{ fontSize: 16 }}>
                  {t("settings.pinned.label")}
                </MonoText>
                <MonoText style={{ fontSize: 12 }}>
                  {t("settings.pinned.help")}
                </MonoText>
              </View>
              <Switch
                value={!!settings.pinnedNotification}
                onValueChange={(value) =>
                  update({ ...settings, pinnedNotification: value })
                }
                trackColor={{ true: onTrackColor, false: offTrackColor }}
                thumbColor={backgroundColor}
              />
            </View>
          </>
        )}

        <SectionTitle>{t("settings.widget")}</SectionTitle>
        <MonoText style={{ fontSize: 13, paddingBottom: 8 }}>
          {t("settings.widget.help")}
        </MonoText>
        {WIDGET_EXTRA_TIMES.map((option) => (
          <RadioRow
            key={option}
            label={
              option === "none" ? t("settings.widget.none") : prayerName(option)
            }
            checked={settings.widgetExtraTime === option}
            onPress={() =>
              update({
                ...settings,
                widgetExtraTime: option,
                widgetExtraTimeChosen: true,
              })
            }
          />
        ))}

        <SectionTitle>{t("settings.offlineData")}</SectionTitle>
        <OfflineData />

        {!needsFix && permissions}
      </View>
    </MonoScrollPage>
  );
}
