import { requireOptionalNativeModule } from "expo";

// Android only; null on iOS.
type WidgetRefreshModule = {
  schedule(times: number[]): Promise<void>;
};

export default requireOptionalNativeModule<WidgetRefreshModule>(
  "WidgetRefresh",
);
