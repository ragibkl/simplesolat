import type { WidgetTaskHandlerProps } from "react-native-android-widget";

import { waktuSolatWidgetTaskHandler } from "@/lib/widgets/WaktuSolat";
import { waktuSolatCompactTaskHandler } from "@/lib/widgets/WaktuSolatCompact";
import { waktuSolatImsakWidgetTaskHandler } from "@/lib/widgets/WaktuSolatImsak";
import { waktuSolatTransparentTaskHandler } from "@/lib/widgets/WaktuSolatTransparent";

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  switch (props.widgetInfo.widgetName) {
    case "WaktuSolat":
      await waktuSolatWidgetTaskHandler(props);
      break;
    case "WaktuSolatCompact":
      await waktuSolatCompactTaskHandler(props);
      break;
    case "WaktuSolatImsak":
      await waktuSolatImsakWidgetTaskHandler(props);
      break;
    case "WaktuSolatTransparent":
      await waktuSolatTransparentTaskHandler(props);
      break;
    default:
      break;
  }
}
