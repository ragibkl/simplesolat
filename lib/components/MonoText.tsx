import { ReactNode } from "react";
import { StyleProp, Text, TextStyle } from "react-native";

import { FontWeight, useMonoStyle } from "./monoui";

type MonoTextProps = {
  children: ReactNode | ReactNode[];
  fontWeight?: FontWeight;
  style?: StyleProp<TextStyle>;
};

export function MonoText(props: MonoTextProps) {
  const { color, getFontFamily } = useMonoStyle();
  const fontFamily = getFontFamily(props.fontWeight);

  return (
    // Grow with the system text size, but not so far that the time rows
    // wrap and misalign at the largest accessibility sizes.
    <Text
      style={[{ fontFamily, color }, props.style]}
      maxFontSizeMultiplier={1.5}
    >
      {props.children}
    </Text>
  );
}
