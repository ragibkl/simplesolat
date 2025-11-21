import type { WidgetTaskHandlerProps } from "react-native-android-widget";

import { waktuSolatTransparentTaskHandler } from "@/lib/widgets/WaktuSolatTransparent";
import { waktuSolatWidgetTaskHandler } from "@/lib/widgets/WaktuSolatWidget";


export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  switch (props.widgetInfo.widgetName) {
    case "WaktuSolat":
      await waktuSolatWidgetTaskHandler(props);
    case "WaktuSolatTransparent":
      await waktuSolatTransparentTaskHandler(props);
      break;
    default:
      break;
  }
}
