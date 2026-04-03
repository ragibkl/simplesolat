import { createDataStore } from "./dataStore";
import { WaktuSolat } from "@/lib/domain/prayerTime";

export type WaktuSolatStore = {
  [key: string]: WaktuSolat;
};

export const waktuSolatStore = createDataStore<WaktuSolatStore>(
  "WAKTU_SOLAT_STORE_V3_KEY",
  {},
);
