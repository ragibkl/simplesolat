import { createDataStore } from "./dataStore";
import { Zone } from "@/lib/domain/zone";

export const zoneStore = createDataStore<Zone | null>(
  "ZONE_STORE_V4_KEY",
  null,
);
