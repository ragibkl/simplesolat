import { ReactNode } from "react";
import { StyleProp, Text, TextStyle } from "react-native";

import { FontWeight, getMonoFontFamily } from "./monofont";

type MonoTextProps = {
  children: ReactNode | ReactNode[];
  fontWeight?: FontWeight;
  style?: StyleProp<TextStyle>;
};

export function MonoText(props: MonoTextProps) {
  const fontFamily = getMonoFontFamily(props.fontWeight);
  return <Text style={[{ fontFamily }, props.style]}>{props.children}</Text>;
}
