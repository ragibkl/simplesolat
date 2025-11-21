import { TextWidget, TextWidgetStyle } from "react-native-android-widget";

import { FontWeight, getMonoFontFamily } from "./monoui";

type ShadowTextProps = {
  children: string;
  fontWeight?: FontWeight;
  style?: TextWidgetStyle;
};

export function ShadowTextWidget(props: ShadowTextProps) {
  const style = props.style || {};
  const fontFamily = getMonoFontFamily(props.fontWeight);

  return (
    <TextWidget
      style={{
        color: "#FFFFFF",
        fontSize: 11,
        fontFamily,
        textShadowColor: "#000000",
        textShadowRadius: 1,
        textShadowOffset: { height: 1, width: 1},
        ...style,
      }}
      text={props.children}
    />
  );
}
