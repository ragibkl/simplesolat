import { TextWidget, TextWidgetStyle } from "react-native-android-widget";

import { FontWeight, getMonoFontFamily, getMonoStyle } from "./monoui";

type MonoTextProps = {
  children: string;
  fontWeight?: FontWeight;
  style?: TextWidgetStyle;
};

export function MonoTextWidget(props: MonoTextProps) {
  const style = props.style || {};
  const { color } = getMonoStyle();
  const fontFamily = getMonoFontFamily(props.fontWeight);

  return (
    <TextWidget
      style={{
        color,
        fontSize: 11,
        fontFamily,
        ...style,
      }}
      text={props.children}
    />
  );
}
