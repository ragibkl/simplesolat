import { ReactNode } from "react";
import { StyleProp, View, ViewStyle } from "react-native";

import { FontWeight, useMonoStyle } from "./monoui";

type MonoTextProps = {
  children: ReactNode | ReactNode[];
  fontWeight?: FontWeight;
  style?: StyleProp<ViewStyle>;
};

export function MonoView(props: MonoTextProps) {
  const { backgroundColor } = useMonoStyle();
  return (
    <View style={[{ backgroundColor }, props.style]}>{props.children}</View>
  );
}
