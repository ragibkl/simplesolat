import { HStack, Spacer, Text, VStack } from "@expo/ui/swift-ui";
import {
  font,
  foregroundStyle,
  lineLimit,
  minimumScaleFactor,
  padding,
} from "@expo/ui/swift-ui/modifiers";
import { createWidget, type WidgetEnvironment } from "expo-widgets";

import type { IosWidgetProps } from "./timeline";

// iOS home screen and Lock Screen widget. Runs in the widget's own runtime:
// only @expo/ui/swift-ui, no hooks or module-scope values.
const WaktuSolatWidget = (props: IosWidgetProps, env: WidgetEnvironment) => {
  "widget";
  const mono = (size: number, bold: boolean) =>
    font({ design: "monospaced", size, weight: bold ? "bold" : "regular" });

  if (env.widgetFamily === "accessoryRectangular") {
    return (
      <VStack alignment="leading">
        <Text modifiers={[mono(12, false), lineLimit(1)]}>{props.place}</Text>
        <Text
          modifiers={[mono(15, true), lineLimit(1), minimumScaleFactor(0.7)]}
        >
          {props.next}
        </Text>
      </VStack>
    );
  }

  if (env.widgetFamily === "systemSmall") {
    return (
      <VStack alignment="leading" spacing={2}>
        <Text
          modifiers={[mono(10, false), lineLimit(1), minimumScaleFactor(0.7)]}
        >
          {props.place}
        </Text>
        {props.columns.map((c, i) => (
          <HStack key={c.label}>
            <Text modifiers={[mono(12, i === props.active), lineLimit(1)]}>
              {c.label}
            </Text>
            <Spacer />
            <Text
              modifiers={[
                mono(12, i === props.active),
                lineLimit(1),
                minimumScaleFactor(0.7),
              ]}
            >
              {c.time}
            </Text>
          </HStack>
        ))}
      </VStack>
    );
  }

  // systemMedium: like the Android Waktu Solat widget
  return (
    <VStack spacing={8}>
      <HStack>
        <Text modifiers={[mono(12, false), lineLimit(1)]}>
          {props.dateText}
        </Text>
        <Spacer />
        <Text
          modifiers={[mono(12, false), lineLimit(1), minimumScaleFactor(0.7)]}
        >
          {props.place}
        </Text>
      </HStack>
      <HStack spacing={4}>
        {props.columns.map((c, i) => (
          <VStack key={c.label} spacing={4}>
            <Text
              modifiers={[
                mono(12, i === props.active),
                lineLimit(1),
                minimumScaleFactor(0.6),
              ]}
            >
              {c.label}
            </Text>
            <Text
              modifiers={[
                mono(12, i === props.active),
                lineLimit(1),
                minimumScaleFactor(0.6),
                i === props.active
                  ? foregroundStyle({ type: "hierarchical", style: "primary" })
                  : foregroundStyle({
                      type: "hierarchical",
                      style: "secondary",
                    }),
              ]}
            >
              {c.time}
            </Text>
          </VStack>
        ))}
      </HStack>
    </VStack>
  );
};

export default createWidget("WaktuSolat", WaktuSolatWidget);
