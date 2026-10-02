import { useCallback, useEffect, useState } from "react";
import { AppState, Pressable, Switch, View } from "react-native";

import { MonoScrollPage } from "@/lib/components/MonoScrollPage";
import { MonoText } from "@/lib/components/MonoText";
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

const PRAYERS: { key: keyof PrayerTime; label: string; note?: string }[] = [
  { key: "imsak", label: "Imsak" },
  { key: "fajr", label: "Fajr" },
  { key: "syuruk", label: "Syuruk" },
  { key: "dhuha", label: "Dhuha", note: "Malaysia and Brunei only" },
  { key: "dhuhr", label: "Dhuhr" },
  { key: "asr", label: "Asr" },
  { key: "maghrib", label: "Maghrib" },
  { key: "isha", label: "Isha" },
];

const WIDGET_EXTRA_TIMES: { key: WidgetExtraTime; label: string }[] = [
  { key: "none", label: "None" },
  { key: "imsak", label: "Imsak" },
  { key: "syuruk", label: "Syuruk" },
  { key: "dhuha", label: "Dhuha" },
];

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

function PermissionRow(props: { check: PermissionCheck; onFix: () => void }) {
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
        {!check.ok && <Button label="Fix" onPress={props.onFix} />}
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
  const { settings } = useSettings();
  const [checks, setChecks] = useState<PermissionCheck[]>([]);
  const [testSent, setTestSent] = useState(false);

  const refreshChecks = useCallback(async () => {
    setChecks(await getPermissionChecks());
  }, []);

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

  return (
    <MonoScrollPage>
      <View style={{ padding: 20 }}>
        <SectionTitle>Permissions</SectionTitle>
        {checks.map((check) => (
          <PermissionRow
            key={check.key}
            check={check}
            onFix={async () => {
              await check.fix();
              await refreshChecks();
            }}
          />
        ))}
        <View style={{ paddingTop: 8, alignItems: "flex-start" }}>
          <Button
            label={
              testSent ? "Test notification sent" : "Send test notification"
            }
            onPress={async () => {
              await sendTestNotification();
              setTestSent(true);
            }}
          />
        </View>

        <SectionTitle>Notifications</SectionTitle>
        {PRAYERS.map((prayer) => (
          <View
            key={prayer.key}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: 4,
            }}
          >
            <View style={{ flex: 1 }}>
              <MonoText style={{ fontSize: 16 }}>{prayer.label}</MonoText>
              {prayer.note && (
                <MonoText style={{ fontSize: 12 }}>{prayer.note}</MonoText>
              )}
            </View>
            <Switch
              value={settings.notifications[prayer.key]}
              onValueChange={(value) => toggleNotification(prayer.key, value)}
              trackColor={{ true: color, false: offTrackColor }}
              thumbColor={backgroundColor}
            />
          </View>
        ))}

        <SectionTitle>Widget</SectionTitle>
        <MonoText style={{ fontSize: 13, paddingBottom: 8 }}>
          Extra time shown on the Waktu Solat widgets, next to the five prayers.
          None shows only the five prayers. Dhuha is for Malaysia and Brunei
          only; elsewhere the widget shows the five prayers.
        </MonoText>
        {WIDGET_EXTRA_TIMES.map((option) => (
          <Pressable
            key={option.key}
            accessibilityRole="radio"
            accessibilityState={{
              checked: settings.widgetExtraTime === option.key,
            }}
            onPress={() =>
              update({
                ...settings,
                widgetExtraTime: option.key,
                widgetExtraTimeChosen: true,
              })
            }
            style={{ paddingVertical: 8 }}
          >
            <MonoText style={{ fontSize: 16 }}>
              {(settings.widgetExtraTime === option.key ? "● " : "○ ") +
                option.label}
            </MonoText>
          </Pressable>
        ))}
      </View>
    </MonoScrollPage>
  );
}
