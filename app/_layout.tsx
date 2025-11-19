import { Stack } from "expo-router";

import { useMonoStyle } from "@/lib/components/monofont";
import { waktuSolatStore } from "@/lib/data/waktuSolatStore";
import { zoneStore } from "@/lib/data/zoneStore";

export default function RootLayout() {
  const { backgroundColor, color } = useMonoStyle()
  return (
    <waktuSolatStore.Provider>
      <zoneStore.Provider>
        <Stack>
          <Stack.Screen
            name="index"
            options={{
              title: "simplesolat",
              headerStyle: { backgroundColor },
              headerTitleStyle: { fontFamily: "JetBrainsMono_400Regular", color },
            }}
          />
        </Stack>
      </zoneStore.Provider>
    </waktuSolatStore.Provider>
  );
}
