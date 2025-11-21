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

  const color = colorScheme === "dark" ? "#FFFFFF" : "#000000";
  const backgroundColor = colorScheme === "dark" ? "#000000" : "#FFFFFF";
  const borderColor = colorScheme === "dark" ? "#ffffff" : "#000000";

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

  const color: ColorProp = colorScheme === "dark" ? "#FFFFFF" : "#000000";
  const backgroundColor: ColorProp =
    colorScheme === "dark" ? "#000000" : "#FFFFFF";
  const borderColor: ColorProp = colorScheme === "dark" ? "#ffffff" : "#000000";

  return {
    color,
    colorScheme,
    backgroundColor,
    borderColor,
    getFontFamily,
  };
}
