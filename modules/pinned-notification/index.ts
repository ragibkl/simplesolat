import { requireOptionalNativeModule } from "expo";

// Android only; null on iOS.
type PinnedNotificationModule = {
  update(json: string): Promise<void>;
  stop(): Promise<void>;
};

export default requireOptionalNativeModule<PinnedNotificationModule>(
  "PinnedNotification",
);
