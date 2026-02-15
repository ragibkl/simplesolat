import { FlexWidget, WidgetPreview } from "react-native-android-widget";

import { useCurrentDate } from "@/lib/hooks/date";
import { useWaktuSolatCurrent } from "@/lib/hooks/waktuSolat";
import { useUpdatedZone } from "@/lib/hooks/zone";

import { WaktuSolat } from "./WaktuSolat";
import { WaktuSolatCompact } from "./WaktuSolatCompact";
import { WaktuSolatTransparent } from "./WaktuSolatTransparent";

export function WidgetPreviews() {
  const { date } = useCurrentDate();
  const { zone } = useUpdatedZone();
  const { waktuSolat } = useWaktuSolatCurrent();

  if (!zone || !waktuSolat) {
    return <></>;
  }

  return (
    <>
      <WidgetPreview
        renderWidget={() => (
          <FlexWidget
            style={{
              borderWidth: 1,
              width: "match_parent",
              height: "match_parent",
            }}
          >
            <WaktuSolat
              date={date}
              zone={zone}
              prayerTime={waktuSolat?.prayerTime}
            />
          </FlexWidget>
        )}
        width={350}
        height={80}
      />

      <WidgetPreview
        renderWidget={() => (
          <FlexWidget
            style={{
              borderWidth: 1,
              width: "match_parent",
              height: "match_parent",
            }}
          >
            <WaktuSolatTransparent
              date={date}
              zone={zone}
              prayerTime={waktuSolat?.prayerTime}
            />
          </FlexWidget>
        )}
        width={350}
        height={80}
      />

      <WidgetPreview
        renderWidget={() => (
          <FlexWidget
            style={{
              borderWidth: 1,
              width: "match_parent",
              height: "match_parent",
            }}
          >
            <WaktuSolatCompact
              date={date}
              zone={zone}
              prayerTime={waktuSolat?.prayerTime}
            />
          </FlexWidget>
        )}
        width={280}
        height={80}
      />
    </>
  );
}
