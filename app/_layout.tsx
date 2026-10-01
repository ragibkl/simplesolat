import { FontAwesome6 } from "@expo/vector-icons";
import { Link, Stack } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";

import { useMonoStyle } from "@/lib/components/monoui";
import { settingsStore } from "@/lib/data/settingsStore";
import { waktuSolatStore } from "@/lib/data/waktuSolatStore";
import { zoneStore } from "@/lib/data/zoneStore";
import { requestPermissionsOnFirstLaunch } from "@/lib/service/permissions";

export default function RootLayout() {
  const { backgroundColor, color, getFontFamily } = useMonoStyle();

  useEffect(() => {
    requestPermissionsOnFirstLaunch();
  }, []);

  return (
    <waktuSolatStore.Provider>
      <zoneStore.Provider>
        <settingsStore.Provider>
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
                  <View style={{ flexDirection: "row", gap: 24 }}>
                    <Link href="/compass">
                      <FontAwesome6 name="kaaba" size={20} color={color} />
                    </Link>
                    <Link href="/settings">
                      <FontAwesome6 name="gear" size={20} color={color} />
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
  );
}
