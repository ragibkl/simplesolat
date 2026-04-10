import { getMonoStyle } from "@/lib/components/monoui";
import { ReactNode } from "react";
import { FlexWidget, FlexWidgetStyle } from "react-native-android-widget";

type WidgetContainerProps = {
  children: ReactNode | ReactNode[];
  style?: FlexWidgetStyle;
  transparent?: boolean;
};

export function WidgetContainer(props: WidgetContainerProps) {
  const { backgroundColor } = getMonoStyle();

  return (
    <FlexWidget
      style={{
        height: "match_parent",
        width: "match_parent",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <FlexWidget
        clickAction="OPEN_APP"
        style={{
          flexDirection: "column",
          width: "match_parent",
          borderRadius: 5,
          padding: 10,
          backgroundColor: props.transparent ? undefined : backgroundColor,
          ...(props.style || {}),
        }}
      >
        {props.children}
      </FlexWidget>
    </FlexWidget>
  );
}
