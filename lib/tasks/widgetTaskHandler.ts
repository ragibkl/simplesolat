import type { WidgetTaskHandlerProps } from "react-native-android-widget";

import { waktuSolatWidgetTaskHandler } from "@/lib/widgets/WaktuSolat";
import { waktuSolatCompactTaskHandler } from "@/lib/widgets/WaktuSolatCompact";
import { waktuSolatLargeTaskHandler } from "@/lib/widgets/WaktuSolatLarge";
import { waktuSolatTransparentTaskHandler } from "@/lib/widgets/WaktuSolatTransparent";

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  switch (props.widgetInfo.widgetName) {
    case "WaktuSolat":
      await waktuSolatWidgetTaskHandler(props);
      break;
    case "WaktuSolatCompact":
      await waktuSolatCompactTaskHandler(props);
      break;
    case "WaktuSolatLarge":
      await waktuSolatLargeTaskHandler(props);
      break;
    case "WaktuSolatTransparent":
      await waktuSolatTransparentTaskHandler(props);
      break;
    default:
      break;
  }
}
