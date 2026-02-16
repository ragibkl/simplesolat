import { FontAwesome6 } from "@expo/vector-icons";
import { Link, Stack } from "expo-router";
import { useEffect } from "react";

import { useMonoStyle } from "@/lib/components/monoui";
import { waktuSolatStore } from "@/lib/data/waktuSolatStore";
import { zoneStore } from "@/lib/data/zoneStore";
import { requestAllPermissions } from "@/lib/service/permissions";

export default function RootLayout() {
  const { backgroundColor, color, getFontFamily } = useMonoStyle();

  useEffect(() => {
    requestAllPermissions();
  }, []);

  return (
    <waktuSolatStore.Provider>
      <zoneStore.Provider>
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
                <Link href="/compass">
                  <FontAwesome6 name="kaaba" size={20} color={color} />
                </Link>
              ),
            }}
          />
          <Stack.Screen name="compass" options={{ title: "Qibla" }} />
          <Stack.Screen
            name="previews"
            options={{ title: "Widget Previews" }}
          />
        </Stack>
      </zoneStore.Provider>
    </waktuSolatStore.Provider>
  );
}
