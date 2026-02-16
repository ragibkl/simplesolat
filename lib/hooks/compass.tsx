import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";

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

function useHeading(): HeadingData | null {
  const [data, setData] = useState<HeadingData | null>(null);
  const smoothed = useRef<number | null>(null);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    async function start() {
      subscription = await Location.watchHeadingAsync((update) => {
        const raw =
          update.trueHeading >= 0 ? update.trueHeading : update.magHeading;

        if (smoothed.current == null) {
          smoothed.current = raw;
        } else {
          smoothed.current = smoothAngle(smoothed.current, raw);
        }

        setData({
          heading: smoothed.current,
          accuracy: getAccuracyLabel(update.accuracy),
        });
      });
    }

    start();

    return () => {
      subscription?.remove();
    };
  }, []);

  return data;
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
      qiblaBearing: null;
    };

export function useCompass(): CompassData {
  const { location } = useLocation();
  const headingData = useHeading();

  if (headingData == null || location == null) {
    return {
      ready: false,
      heading: null,
      accuracy: null,
      location: null,
      qiblaBearing: null,
    };
  }

  const qiblaBearing = getQiblaBearing(
    location.coords.latitude,
    location.coords.longitude,
  );

  return {
    ready: true,
    heading: headingData.heading,
    accuracy: headingData.accuracy,
    location,
    qiblaBearing,
  };
}
