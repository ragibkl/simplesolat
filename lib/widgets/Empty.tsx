import { MonoTextWidget } from "@/lib/components/MonoTextWidget";

import { WidgetContainer } from "./WidgetContainer";

export function Empty() {
  return (
    <WidgetContainer style={{ alignItems: "center" }}>
      <MonoTextWidget style={{ fontSize: 20 }}>
        No data available
      </MonoTextWidget>
    </WidgetContainer>
  );
}
