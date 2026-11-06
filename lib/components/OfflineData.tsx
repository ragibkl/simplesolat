import { useCallback, useEffect, useState } from "react";
import { Platform, Switch, View } from "react-native";

import { countryOffline, CountryOffline } from "@/lib/data/countryStore";
import { fileSize } from "@/lib/data/mirror";
import { useSettings } from "@/lib/data/settingsStore";
import { CountryConfig } from "@/lib/remote/simplesolat";
import {
  downloadCountryNow,
  removeOfflineCountry,
} from "@/lib/service/offlineCountries";
import { countryMapFiles, getCountries } from "@/lib/service/zone";
import { shortDateText, useI18n } from "@/lib/i18n";

import { MonoText } from "./MonoText";
import { useMonoStyle } from "./monoui";

// Settings → Offline data: whole countries kept on the phone, so prayer
// times work without internet anywhere in them (e.g. travelling).

function sizeText(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function OfflineData() {
  const { color, backgroundColor, colorScheme } = useMonoStyle();
  const offTrackColor = colorScheme === "dark" ? "#555555" : "#BDBDBD";
  const onTrackColor =
    Platform.OS === "ios" && colorScheme === "dark" ? "#A0A0A0" : color;
  const { settings } = useSettings();
  const { lang, t } = useI18n();
  const kept = new Set(settings.offlineCountries ?? []);

  const [countries, setCountries] = useState<CountryConfig[]>([]);
  const [info, setInfo] = useState<Record<string, CountryOffline>>({});
  const [busy, setBusy] = useState<Record<string, string>>({});

  const refresh = useCallback((list: CountryConfig[]) => {
    setInfo(
      Object.fromEntries(
        list.map((c) => {
          const times = countryOffline(c.code);
          // Count the maps too while the times are here: they come with them.
          const maps = times.months.length
            ? countryMapFiles(c).reduce((sum, f) => sum + fileSize(f), 0)
            : 0;
          return [c.code, { ...times, bytes: times.bytes + maps }];
        }),
      ),
    );
  }, []);

  useEffect(() => {
    getCountries()
      .then((list) => {
        setCountries(list);
        refresh(list);
      })
      .catch(() => {});
  }, [refresh]);

  const toggle = async (cc: string, keep: boolean) => {
    setBusy((b) => ({
      ...b,
      [cc]: keep ? t("offline.downloading") : t("offline.removing"),
    }));
    let message = "";
    try {
      if (keep) await downloadCountryNow(cc);
      else await removeOfflineCountry(cc);
    } catch {
      message = t("offline.failed");
    }
    refresh(countries);
    setBusy((b) => ({ ...b, [cc]: message }));
  };

  return (
    <>
      <MonoText style={{ fontSize: 13, paddingBottom: 8 }}>
        {t("offline.help")}
      </MonoText>
      {countries.map((c) => {
        const on = kept.has(c.code);
        const i = info[c.code];
        const status =
          busy[c.code] ||
          (i?.months.length
            ? i.checkedAt
              ? t("offline.updated", {
                  size: sizeText(i.bytes),
                  date: shortDateText(lang, new Date(i.checkedAt)),
                })
              : sizeText(i.bytes)
            : on
              ? t("offline.waiting")
              : t("offline.notHere"));
        return (
          <View
            key={c.code}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: 4,
            }}
          >
            <View style={{ flex: 1, paddingRight: 12 }}>
              <MonoText style={{ fontSize: 16 }}>{c.name}</MonoText>
              <MonoText style={{ fontSize: 12 }}>{status}</MonoText>
            </View>
            <Switch
              accessibilityLabel={t("offline.keep", { country: c.name })}
              value={on}
              disabled={!!busy[c.code]?.endsWith("…")}
              onValueChange={(value) => toggle(c.code, value)}
              trackColor={{ true: onTrackColor, false: offTrackColor }}
              thumbColor={backgroundColor}
            />
          </View>
        );
      })}
    </>
  );
}
