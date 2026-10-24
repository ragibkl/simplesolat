import { requireOptionalNativeModule } from "expo";

// Android only; null on iOS (expo-location's heading is already smooth there).
type CompassHeadingModule = {
  isAvailable(): boolean;
  setLocation(latitude: number, longitude: number): void;
  start(): boolean;
  stop(): void;
  addListener(
    event: "onHeading",
    listener: (e: { heading: number; accuracy: number }) => void,
  ): { remove(): void };
};

export default requireOptionalNativeModule<CompassHeadingModule>(
  "CompassHeading",
);
