import { Appearance, Platform, useColorScheme } from "react-native";
import { ColorProp } from "react-native-android-widget";

export type FontWeight =
  "regular" | "medium" | "semibold" | "bold" | "extrabold";

// Android finds bundled fonts by file name; iOS by the font's PostScript name.
const FONT_FAMILIES: Record<FontWeight, { android: string; ios: string }> = {
  regular: {
    android: "JetBrainsMono_400Regular",
    ios: "JetBrainsMono-Regular",
  },
  medium: { android: "JetBrainsMono_500Medium", ios: "JetBrainsMono-Medium" },
  semibold: {
    android: "JetBrainsMono_600SemiBold",
    ios: "JetBrainsMono-SemiBold",
  },
  bold: { android: "JetBrainsMono_700Bold", ios: "JetBrainsMono-Bold" },
  extrabold: {
    android: "JetBrainsMono_800ExtraBold",
    ios: "JetBrainsMono-ExtraBold",
  },
};

export function getFontFamily(fontWeight?: FontWeight): string {
  const names = FONT_FAMILIES[fontWeight ?? "regular"];
  return Platform.OS === "ios" ? names.ios : names.android;
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
