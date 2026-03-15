import { createDataStore } from "./dataStore";

export type Zone = {
  zone: string;
  country: string;
  state: string;
  district: string;
};

export const zoneStore = createDataStore<Zone | null>(
  "ZONE_STORE_V2_KEY",
  null,
);
