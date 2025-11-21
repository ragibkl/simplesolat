import type { WidgetTaskHandlerProps } from "react-native-android-widget";

import { waktuSolatWidgetTaskHandler } from "@/lib/widgets/WaktuSolat";
import { waktuSolatTransparentTaskHandler } from "@/lib/widgets/WaktuSolatTransparent";


export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  switch (props.widgetInfo.widgetName) {
    case "WaktuSolat":
      await waktuSolatWidgetTaskHandler(props);
      break;
    case "WaktuSolatTransparent":
      await waktuSolatTransparentTaskHandler(props);
      break;
    default:
      break;
  }
}
