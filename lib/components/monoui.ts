import { Appearance, useColorScheme } from "react-native";
import { ColorProp } from "react-native-android-widget";

export type FontWeight =
  | "regular"
  | "medium"
  | "semibold"
  | "bold"
  | "extrabold";

export function getFontFamily(fontWeight?: FontWeight): string {
  if (fontWeight === "regular") {
    return "JetBrainsMono_400Regular";
  }
  if (fontWeight === "medium") {
    return "JetBrainsMono_500Medium";
  }
  if (fontWeight === "semibold") {
    return "JetBrainsMono_600SemiBold";
  }
  if (fontWeight === "bold") {
    return "JetBrainsMono_700Bold";
  }
  if (fontWeight === "extrabold") {
    return "JetBrainsMono_800ExtraBold";
  }

  return "JetBrainsMono_400Regular";
}

export function useMonoStyle() {
  const colorScheme = useColorScheme();

  const color = colorScheme === "dark" ? "#FFB6C1" : "#D5006D";
  const backgroundColor = colorScheme === "dark" ? "#1A0A10" : "#FFF0F5";
  const borderColor = colorScheme === "dark" ? "#FFB6C1" : "#D5006D";

  return {
    color,
    colorScheme,
    backgroundColor,
    borderColor,
    getFontFamily,
  };
}

export function getMonoStyle() {
  const colorScheme = Appearance.getColorScheme();

  const color: ColorProp = colorScheme === "dark" ? "#FFB6C1" : "#D5006D";
  const backgroundColor: ColorProp =
    colorScheme === "dark" ? "#1A0A10" : "#FFF0F5";
  const borderColor: ColorProp = colorScheme === "dark" ? "#FFB6C1" : "#D5006D";

  return {
    color,
    colorScheme,
    backgroundColor,
    borderColor,
    getFontFamily,
  };
}
