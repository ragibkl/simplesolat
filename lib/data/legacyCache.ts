import AsyncStorage from "@react-native-async-storage/async-storage";
import { Directory, Paths } from "expo-file-system";

// The caches used before the CDN mirror (app 1.3.6 and older): AsyncStorage
// "CACHE:<key>" entries, files in file-cache/ and the prayer-times store.
// Nothing reads them any more; they're deleted once the mirror works. This
// file can go in a later release, once phones have moved over.

const LEGACY_TIMES_KEY = "WAKTU_SOLAT_STORE_V4_KEY";

export async function removeLegacyCaches() {
  const keys = (await AsyncStorage.getAllKeys()).filter(
    (k) => k.startsWith("CACHE:") || k === LEGACY_TIMES_KEY,
  );
  if (keys.length) await AsyncStorage.multiRemove(keys);
  const dir = new Directory(Paths.document, "file-cache");
  if (dir.exists) dir.delete();
}
