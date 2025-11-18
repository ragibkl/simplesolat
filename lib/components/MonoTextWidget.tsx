import { TextWidget, TextWidgetStyle } from "react-native-android-widget";

import { FontWeight, getMonoFontFamily } from "./monofont";

type MonoTextProps = {
  children: string;
  fontWeight?: FontWeight;
  style?: TextWidgetStyle;
};

export function MonoTextWidget(props: MonoTextProps) {
  const style = props.style || {};

  return (
    <TextWidget
      style={{
        color: "#000000",
        fontSize: 11,
        fontFamily: getMonoFontFamily(props.fontWeight),
        ...style,
      }}
      text={props.children}
    />
  );
}
