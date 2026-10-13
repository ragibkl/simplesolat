import { HStack, Spacer, Text, VStack } from "@expo/ui/swift-ui";
import {
  font,
  foregroundStyle,
  frame,
  lineLimit,
  multilineTextAlignment,
  padding,
  strokeBorder,
} from "@expo/ui/swift-ui/modifiers";
import { createWidget, type WidgetEnvironment } from "expo-widgets";

import type { IosWidgetProps } from "./timeline";

// iOS home screen and Lock Screen widget. Keep it cheap to lay out: iOS
// renders every timeline entry under a CPU budget, and shrink-to-fit text
// (minimumScaleFactor) with flexible columns blew it.
// Runs in the widget's own runtime:
// only @expo/ui/swift-ui, no hooks or module-scope values.
const WaktuSolatWidget = (props: IosWidgetProps, env: WidgetEnvironment) => {
  "widget";
  const mono = (size: number, bold: boolean) =>
    font({ design: "monospaced", size, weight: bold ? "bold" : "regular" });
  const secondary = foregroundStyle({
    type: "hierarchical",
    style: "secondary",
  });

  if (env.widgetFamily === "accessoryRectangular") {
    return (
      <VStack alignment="leading">
        <Text modifiers={[mono(12, false), lineLimit(1)]}>{props.place}</Text>
        <Text modifiers={[mono(15, true), lineLimit(1)]}>{props.next}</Text>
      </VStack>
    );
  }

  if (env.widgetFamily === "systemSmall") {
    return (
      <VStack alignment="leading" spacing={2}>
        <Text modifiers={[mono(10, false), lineLimit(1)]}>{props.place}</Text>
        {props.columns.map((c, i) => (
          <HStack key={c.label}>
            <Text modifiers={[mono(12, i === props.active), lineLimit(1)]}>
              {c.label}
            </Text>
            <Spacer />
            <Text modifiers={[mono(12, i === props.active), lineLimit(1)]}>
              {c.time}
            </Text>
          </HStack>
        ))}
      </VStack>
    );
  }

  // systemMedium: the current prayer in large type with a countdown to the
  // next one, above the Android widget's row of times in a rounded box.
  // Between prayers (after Syuruk, or after midnight) it leads with the next.
  const now = props.nowLabel !== "";
  return (
    <VStack spacing={8}>
      <HStack alignment="top">
        <VStack alignment="leading" spacing={0}>
          <Text modifiers={[mono(11, false), lineLimit(1), secondary]}>
            {now ? "Now" : "Next"}
          </Text>
          <Text modifiers={[mono(26, true), lineLimit(1)]}>
            {now ? props.nowLabel : props.nextLabel}
          </Text>
        </VStack>
        <Spacer />
        <VStack alignment="trailing" spacing={4}>
          <Text modifiers={[mono(11, false), lineLimit(1), secondary]}>
            {props.place}
          </Text>
          {props.nextAt > 0 ? (
            <HStack spacing={0}>
              <Text modifiers={[mono(14, false), lineLimit(1)]}>
                {now ? `${props.nextLabel} in ` : "in "}
              </Text>
              {/* Counts down by itself; iOS redraws it, not the app. A
                  timer takes all the width it's offered, so it gets a fixed
                  one (room for "10:00:00"), right-aligned. */}
              <Text
                date={new Date(props.nextAt)}
                dateStyle="timer"
                modifiers={[
                  mono(14, false),
                  lineLimit(1),
                  multilineTextAlignment("trailing"),
                  frame({ width: 70, alignment: "trailing" }),
                ]}
              />
            </HStack>
          ) : null}
        </VStack>
      </HStack>
      <HStack
        spacing={0}
        modifiers={[
          padding({ vertical: 8 }),
          // The box fills the rest of the widget's height.
          frame({ maxHeight: 1000 }),
          strokeBorder({
            shape: "roundedRectangle",
            cornerRadius: 6,
            style: { lineWidth: 1 },
          }),
        ]}
      >
        {props.columns.map((c, i) => (
          // Equal-width columns: each may grow, so they share the row evenly
          // (a huge max width stands in for .infinity).
          <VStack
            key={c.label}
            spacing={6}
            modifiers={[frame({ maxWidth: 1000 })]}
          >
            <Text modifiers={[mono(11, i === props.active), lineLimit(1)]}>
              {c.label}
            </Text>
            <Text modifiers={[mono(12, i === props.active), lineLimit(1)]}>
              {c.short ?? c.time}
            </Text>
          </VStack>
        ))}
      </HStack>
    </VStack>
  );
};

export default createWidget("WaktuSolat", WaktuSolatWidget);
