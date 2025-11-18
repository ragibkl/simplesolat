export type FontWeight =
  | "regular"
  | "medium"
  | "semibold"
  | "bold"
  | "extrabold";

export function getMonoFontFamily(fontWeight?: FontWeight): string {
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
