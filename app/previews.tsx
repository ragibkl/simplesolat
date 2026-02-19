import { View } from "react-native";
import { WidgetPreview } from "react-native-android-widget";

import { MonoScrollPage } from "@/lib/components/MonoScrollPage";

import { useCurrentDate } from "@/lib/hooks/date";
import { useWaktuSolatCurrent } from "@/lib/hooks/waktuSolat";
import { useWaktuSolatWidgetUpdate } from "@/lib/hooks/waktuSolatWidget";
import { useUpdatedZone } from "@/lib/hooks/zone";

import { MonoView } from "@/lib/components/MonoView";
import { WaktuSolat } from "@/lib/widgets/WaktuSolat";
import { WaktuSolatCompact } from "@/lib/widgets/WaktuSolatCompact";
import { WaktuSolatImsak } from "@/lib/widgets/WaktuSolatImsak";
import { WaktuSolatLarge } from "@/lib/widgets/WaktuSolatLarge";
import { WaktuSolatTransparent } from "@/lib/widgets/WaktuSolatTransparent";

export default function Index() {
  useWaktuSolatWidgetUpdate();

  const { date } = useCurrentDate();
  const { zone } = useUpdatedZone();
  const { waktuSolat } = useWaktuSolatCurrent();

  if (!zone || !waktuSolat) {
    return <></>;
  }

  return (
    <MonoScrollPage>
      <View style={{ alignItems: "center" }}>
        <MonoView style={{ borderWidth: 1, margin: 5 }}>
          <WidgetPreview
            renderWidget={() => (
              <WaktuSolat
                date={date}
                zone={zone}
                prayerTime={waktuSolat?.prayerTime}
              />
            )}
            width={350}
            height={80}
          />
        </MonoView>

        <MonoView style={{ backgroundColor: "#8B6F47", margin: 5 }}>
          <WidgetPreview
            renderWidget={() => (
              <WaktuSolatTransparent
                date={date}
                zone={zone}
                prayerTime={waktuSolat?.prayerTime}
              />
            )}
            width={350}
            height={80}
          />
        </MonoView>

        <MonoView style={{ borderWidth: 1, margin: 5 }}>
          <WidgetPreview
            renderWidget={() => (
              <WaktuSolatImsak
                date={date}
                zone={zone}
                prayerTime={waktuSolat?.prayerTime}
              />
            )}
            width={350}
            height={80}
          />
        </MonoView>

        <MonoView style={{ borderWidth: 1, margin: 5 }}>
          <WidgetPreview
            renderWidget={() => (
              <WaktuSolatLarge
                date={date}
                zone={zone}
                prayerTime={waktuSolat?.prayerTime}
              />
            )}
            width={350}
            height={160}
          />
        </MonoView>

        <MonoView style={{ borderWidth: 1, margin: 5 }}>
          <WidgetPreview
            renderWidget={() => (
              <WaktuSolatCompact
                date={date}
                zone={zone}
                prayerTime={waktuSolat?.prayerTime}
              />
            )}
            width={280}
            height={80}
          />
        </MonoView>
      </View>
    </MonoScrollPage>
  );
}
