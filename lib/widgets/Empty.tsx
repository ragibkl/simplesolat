import { FlexWidget } from "react-native-android-widget";
import { MonoTextWidget } from "../components/MonoTextWidget";
import { getMonoStyle } from "../components/monoui";

export function Empty() {
  const { backgroundColor } = getMonoStyle();

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
        backgroundColor,
        borderRadius: 5,
        padding: 10,
      }}
    >
      <MonoTextWidget style={{ fontSize: 20 }}>No data available</MonoTextWidget>
    </FlexWidget>
  );
}
