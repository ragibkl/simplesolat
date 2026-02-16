import * as Location from "expo-location";
import { useState, useEffect, useCallback } from "react";
import { AppState } from "react-native";

import { useCurrentDate } from "@/lib/hooks/date";
import { getLocation } from "@/lib/service/location";

export function useLocation() {
  const { date } = useCurrentDate();
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null,
  );

  const updateLocation = useCallback(async () => {
    const location = await getLocation();
    setLocation(location);

    return location;
  }, []);

  useEffect(() => {
    updateLocation();
  }, [updateLocation, date]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        updateLocation();
      }
    });

    return () => sub.remove();
  }, [updateLocation]);

  return { location, updateLocation };
}
