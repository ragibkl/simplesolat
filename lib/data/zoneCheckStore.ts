import { createDataStore } from "./dataStore";

// When the zone was last worked out from a fresh location (epoch ms), so the
// home screen can say how current it is when location can't be checked.
export const zoneCheckStore = createDataStore<number | null>(
  "ZONE_CHECKED_AT_V1",
  null,
);
