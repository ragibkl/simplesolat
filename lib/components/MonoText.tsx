import { ReactNode } from "react";
import { StyleProp, Text, TextStyle } from "react-native";

import { FontWeight, getMonoFontFamily, useMonoStyle } from "./monoui";

type MonoTextProps = {
  children: ReactNode | ReactNode[];
  fontWeight?: FontWeight;
  style?: StyleProp<TextStyle>;
};

export function MonoText(props: MonoTextProps) {
  const { color } = useMonoStyle();
  const fontFamily = getMonoFontFamily(props.fontWeight);

  return (
    <Text style={[{ fontFamily, color }, props.style]}>{props.children}</Text>
  );
}
