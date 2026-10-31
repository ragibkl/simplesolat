import { DAILY, getYaml } from "@/lib/data/mirror";
import { setMethods } from "@/lib/domain/methods";

let loading: Promise<void> | null = null;

// Loads methods.yaml from the CDN mirror once per run (the mirror checks it
// daily). Never throws: until it loads, or if it can't, the copy bundled
// with the app is used.
export function loadMethods(): Promise<void> {
  loading ??= getYaml<unknown>("methods.yaml", DAILY)
    .then(setMethods)
    .catch((error) => console.log("methods.yaml not loaded:", error));
  return loading;
}
