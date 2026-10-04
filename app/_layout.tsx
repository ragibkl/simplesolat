import { FontAwesome6 } from "@expo/vector-icons";
import {
  DarkTheme,
  DefaultTheme,
  Link,
  Stack,
  ThemeProvider,
} from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Pressable, useColorScheme, View } from "react-native";
import * as SystemUI from "expo-system-ui";

import { useMonoStyle } from "@/lib/components/monoui";
import { settingsStore } from "@/lib/data/settingsStore";
import { waktuSolatStore } from "@/lib/data/waktuSolatStore";
import { zoneStore } from "@/lib/data/zoneStore";
import { requestPermissionsOnFirstLaunch } from "@/lib/service/permissions";

export default function RootLayout() {
  const { backgroundColor, color, getFontFamily } = useMonoStyle();
  const scheme = useColorScheme();
  const navTheme = scheme === "dark" ? DarkTheme : DefaultTheme;

  // Root view colour (behind screens and transitions).
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(backgroundColor);
  }, [backgroundColor]);

  useEffect(() => {
    requestPermissionsOnFirstLaunch();
  }, []);

  return (
    // The theme tells the native navigation bar (iOS glass buttons) whether
    // it's light or dark.
    <ThemeProvider
      value={{
        ...navTheme,
        colors: { ...navTheme.colors, background: backgroundColor },
      }}
    >
      <waktuSolatStore.Provider>
        <zoneStore.Provider>
          <settingsStore.Provider>
            {/* Dark icons on the light header, light icons in dark mode. */}
            <StatusBar style="auto" />
            <Stack
              screenOptions={{
                headerTintColor: color,
                headerStyle: { backgroundColor },
                headerTitleStyle: { fontFamily: getFontFamily() },
              }}
            >
              <Stack.Screen
                name="index"
                options={{
                  title: "simplesolat",
                  headerRight: () => (
                    <View style={{ flexDirection: "row", gap: 12 }}>
                      {/* Padding + hitSlop: about 44 points to tap (Apple's minimum); the icon stays 20 points. */}
                      <Link href="/compass" asChild>
                        <Pressable hitSlop={8} style={{ padding: 6 }}>
                          <FontAwesome6 name="kaaba" size={20} color={color} />
                        </Pressable>
                      </Link>
                      <Link href="/settings" asChild>
                        <Pressable hitSlop={8} style={{ padding: 6 }}>
                          <FontAwesome6 name="gear" size={20} color={color} />
                        </Pressable>
                      </Link>
                    </View>
                  ),
                }}
              />
              <Stack.Screen name="compass" options={{ title: "Qibla" }} />
              <Stack.Screen name="settings" options={{ title: "Settings" }} />
              <Stack.Screen
                name="previews"
                options={{ title: "Widget Previews" }}
              />
            </Stack>
          </settingsStore.Provider>
        </zoneStore.Provider>
      </waktuSolatStore.Provider>
    </ThemeProvider>
  );
}
