import { ReactNode } from "react";
import { FlexWidget, FlexWidgetStyle } from "react-native-android-widget";
import { getMonoStyle } from "../components/monoui";

type WidgetContainerProps = {
  children: ReactNode | ReactNode[];
  style?: FlexWidgetStyle;
};

export function WidgetContainer(props: WidgetContainerProps) {
  const { backgroundColor } = getMonoStyle();
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        flexDirection: "column",
        height: "match_parent",
        width: "match_parent",
        justifyContent: "flex-start",
        alignItems: "flex-start",
        borderRadius: 5,
        padding: 10,
        backgroundColor,
        ...(props.style || {}),
      }}
    >
      {props.children}
    </FlexWidget>
  );
}
