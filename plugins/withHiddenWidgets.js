// Hides widgets from the launcher's widget picker (Android 9+) while keeping
// them working for people who already placed them. react-native-android-widget
// only writes widgetFeatures together with its configuration screen, so this
// adds the flag to the generated provider XML after all other mods have run.
const { withFinalizedMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

module.exports = function withHiddenWidgets(config, { widgets = [] } = {}) {
  return withFinalizedMod(config, [
    "android",
    (config) => {
      const xmlDir = path.join(
        config.modRequest.platformProjectRoot,
        "app/src/main/res/xml",
      );
      for (const name of widgets) {
        const file = path.join(
          xmlDir,
          `widgetprovider_${name.toLowerCase()}.xml`,
        );
        let xml = fs.readFileSync(file, "utf8");
        if (!xml.includes("hide_from_picker")) {
          xml = xml.replace(
            'xmlns:android="http://schemas.android.com/apk/res/android"',
            'xmlns:android="http://schemas.android.com/apk/res/android"\n    android:widgetFeatures="hide_from_picker"',
          );
          fs.writeFileSync(file, xml);
        }
      }
      return config;
    },
  ]);
};
