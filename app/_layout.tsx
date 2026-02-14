import { useEffect } from "react";
import { Stack } from "expo-router";

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
        <Stack>
          <Stack.Screen
            name="index"
            options={{
              title: "simplesolat",
              headerStyle: { backgroundColor },
              headerTitleStyle: {
                fontFamily: getFontFamily(),
                color,
              },
            }}
          />
        </Stack>
      </zoneStore.Provider>
    </waktuSolatStore.Provider>
  );
}
