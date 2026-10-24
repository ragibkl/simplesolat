import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

import CompassHeading from "@/modules/compass-heading";

import { useLocation } from "@/lib/hooks/location";

const KAABA_LAT = (21.4225 * Math.PI) / 180;
const KAABA_LNG = (39.8262 * Math.PI) / 180;

// Lower = smoother but slower to respond, higher = more responsive but jittery
const SMOOTHING = 0.9;

function getQiblaBearing(lat: number, lng: number): number {
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;

  const dLng = KAABA_LNG - lngRad;

  const x = Math.sin(dLng) * Math.cos(KAABA_LAT);
  const y =
    Math.cos(latRad) * Math.sin(KAABA_LAT) -
    Math.sin(latRad) * Math.cos(KAABA_LAT) * Math.cos(dLng);

  const angle = Math.atan2(x, y);
  return ((angle * 180) / Math.PI + 360) % 360;
}

function smoothAngle(current: number, target: number): number {
  let diff = target - current;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return (current + diff * SMOOTHING + 360) % 360;
}

export type Accuracy = "high" | "medium" | "low" | "none";

function getAccuracyLabel(level: number): Accuracy {
  if (level >= 3) {
    return "high";
  } else if (level === 2) {
    return "medium";
  } else if (level === 1) {
    return "low";
  } else {
    return "none";
  }
}

type HeadingData = {
  heading: number;
  accuracy: Accuracy;
};

// Android: our own module reads the fused rotation vector sensor (smooth, about
// 30 updates a second). expo-location's Android heading comes a few times a
// second in 2-degree steps; it stays as the fallback and on iOS, where it's
// already smooth.
const nativeCompass =
  Platform.OS === "android" && CompassHeading?.isAvailable()
    ? CompassHeading
    : null;

// Whether headings arrive often and in small steps (the dial can glide quickly).
export const FINE_HEADING = Platform.OS === "ios" || nativeCompass != null;

// Many tablets have no compass sensor: no heading ever arrives.
const NO_COMPASS_AFTER_MS = 6000;

function useHeading(location: Location.LocationObject | null): {
  data: HeadingData | null;
  noCompass: boolean;
} {
  const [data, setData] = useState<HeadingData | null>(null);
  const [noCompass, setNoCompass] = useState(false);
  const smoothed = useRef<number | null>(null);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;
    const timer = setTimeout(() => {
      if (smoothed.current == null) setNoCompass(true);
    }, NO_COMPASS_AFTER_MS);

    if (nativeCompass) {
      const sub = nativeCompass.addListener("onHeading", (update) => {
        smoothed.current = update.heading;
        setNoCompass(false);
        setData({
          heading: update.heading,
          accuracy: getAccuracyLabel(update.accuracy),
        });
      });
      nativeCompass.start();
      return () => {
        clearTimeout(timer);
        nativeCompass.stop();
        sub.remove();
      };
    }

    async function start() {
      subscription = await Location.watchHeadingAsync((update) => {
        const raw =
          update.trueHeading >= 0 ? update.trueHeading : update.magHeading;

        if (smoothed.current == null) {
          smoothed.current = raw;
        } else {
          smoothed.current = smoothAngle(smoothed.current, raw);
        }

        setNoCompass(false);
        setData({
          heading: smoothed.current,
          accuracy: getAccuracyLabel(update.accuracy),
        });
      });
    }

    start().catch(() => setNoCompass(true));

    return () => {
      clearTimeout(timer);
      subscription?.remove();
    };
  }, []);

  // True north needs the declination where the phone is.
  const latitude = location?.coords.latitude;
  const longitude = location?.coords.longitude;
  useEffect(() => {
    if (nativeCompass && latitude != null && longitude != null) {
      nativeCompass.setLocation(latitude, longitude);
    }
  }, [latitude, longitude]);

  return { data, noCompass };
}

export type CompassData =
  | {
      ready: true;
      heading: number;
      accuracy: Accuracy;
      location: Location.LocationObject;
      qiblaBearing: number;
    }
  | {
      ready: false;
      heading: null;
      accuracy: null;
      location: null;
      // Known from the location alone, even without a compass.
      qiblaBearing: number | null;
      noCompass: boolean;
    };

export function useCompass(): CompassData {
  const { location } = useLocation();
  const { data: headingData, noCompass } = useHeading(location);
  const qiblaBearing =
    location == null
      ? null
      : getQiblaBearing(location.coords.latitude, location.coords.longitude);

  if (headingData == null || location == null || qiblaBearing == null) {
    return {
      ready: false,
      heading: null,
      accuracy: null,
      location: null,
      qiblaBearing,
      noCompass,
    };
  }

  return {
    ready: true,
    heading: headingData.heading,
    accuracy: headingData.accuracy,
    location,
    qiblaBearing,
  };
}
