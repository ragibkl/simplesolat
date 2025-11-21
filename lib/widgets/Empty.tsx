import { MonoTextWidget } from "@/lib/components/MonoTextWidget";
import { getMonoStyle } from "@/lib/components/monoui";

import { WidgetContainer } from "./WidgetContainer";

export function Empty() {
  const { backgroundColor } = getMonoStyle();

  return (
    <WidgetContainer style={{ backgroundColor, alignItems: "center" }}>
      <MonoTextWidget style={{ fontSize: 20 }}>
        No data available
      </MonoTextWidget>
    </WidgetContainer>
  );
}
