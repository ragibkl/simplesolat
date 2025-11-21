import { FlexWidget } from "react-native-android-widget";
import { ShadowTextWidget } from "../components/ShadowTextWidget";

export function EmptyTransparent() {
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        flex: 1,
        flexDirection: "column",
        height: "match_parent",
        width: "match_parent",
        justifyContent: "center",
        alignItems: "flex-start",
        borderRadius: 5,
        padding: 10,
      }}
    >
      <ShadowTextWidget style={{ fontSize: 20 }}>No data available</ShadowTextWidget>
    </FlexWidget>
  );
}
