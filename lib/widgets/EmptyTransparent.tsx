import { MonoTextWidget } from "../components/MonoTextWidget";
import { WidgetContainer } from "./WidgetContainer";

export function EmptyTransparent() {
  return (
    <WidgetContainer style={{ alignItems: "center" }}>
      <MonoTextWidget
        style={{
          fontSize: 20,
          color: "#FFFFFF",
          textShadowColor: "#000000",
          textShadowRadius: 1,
          textShadowOffset: { height: 1, width: 1 },
        }}
      >
        No data available
      </MonoTextWidget>
    </WidgetContainer>
  );
}
