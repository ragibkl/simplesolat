import { useEffect, useRef } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { MonoScrollPage } from "@/lib/components/MonoScrollPage";
import { MonoText } from "@/lib/components/MonoText";
import { useMonoStyle } from "@/lib/components/monoui";
import { FINE_HEADING, useCompass } from "@/lib/hooks/compass";

function CompassArrow(props: { rotation: number }) {
  const { color } = useMonoStyle();
  return (
    <View
      style={{
        width: 200,
        height: 200,
        justifyContent: "center",
        alignItems: "center",
        transform: [{ rotate: `${props.rotation}deg` }],
      }}
    >
      {/* Arrow head */}
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: 12,
          borderRightWidth: 12,
          borderBottomWidth: 40,
          borderLeftColor: "transparent",
          borderRightColor: "transparent",
          borderBottomColor: color,
        }}
      />
      {/* Tail */}
      <View
        style={{
          width: 6,
          height: 120,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

function CompassRing(props: { children: React.ReactNode }) {
  const { color } = useMonoStyle();
  return (
    <View
      style={{
        width: 260,
        height: 260,
        borderRadius: 130,
        borderWidth: 2,
        borderColor: color,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {props.children}
    </View>
  );
}

// Android reports the heading only a few times a second, in steps of about
// 2 degrees (expo-location), so setting the rotation directly looked jerky.
// Each new heading starts a short glide on the UI thread instead, taking the
// short way round (359 -> 1 turns 2 degrees, not 358).
// Shorter when headings come often in small steps (iOS, our Android module).
const GLIDE_MS = FINE_HEADING ? 80 : 180;

function useSmoothHeading(heading: number | null): SharedValue<number> {
  // Unwrapped (can go past 360) so the glide never spins the long way.
  const target = useRef<number | null>(null);
  const smooth = useSharedValue(0);
  useEffect(() => {
    if (heading == null) return;
    if (target.current == null) {
      // First reading: start there, no glide from 0.
      target.current = heading;
      smooth.value = heading;
      return;
    }
    const delta = ((heading - target.current + 540) % 360) - 180;
    target.current += delta;
    smooth.value = withTiming(target.current, {
      duration: GLIDE_MS,
      easing: Easing.out(Easing.quad),
    });
  }, [heading, smooth]);
  return smooth;
}

function CardinalLabel(props: {
  label: string;
  rotation: number;
  heading: SharedValue<number>;
}) {
  const { color } = useMonoStyle();
  // Counter-rotate so the letter stays upright as the dial turns.
  const upright = useAnimatedStyle(() => ({
    transform: [{ rotate: `${props.heading.value - props.rotation}deg` }],
  }));
  return (
    <View
      style={{
        position: "absolute",
        width: 260,
        height: 260,
        justifyContent: "flex-start",
        alignItems: "center",
        transform: [{ rotate: `${props.rotation}deg` }],
      }}
    >
      <Animated.View style={[{ marginTop: 2 }, upright]}>
        <MonoText style={{ fontSize: 22, color }}>{props.label}</MonoText>
      </Animated.View>
    </View>
  );
}

export default function Compass() {
  const compass = useCompass();
  const smoothHeading = useSmoothHeading(compass.heading);
  const dial = useAnimatedStyle(() => ({
    transform: [{ rotate: `${-smoothHeading.value}deg` }],
  }));

  if (!compass.ready) {
    const { noCompass, qiblaBearing } = compass;
    return (
      <MonoScrollPage>
        <View style={{ flex: 1, padding: 20, paddingTop: 40 }}>
          {noCompass && qiblaBearing == null ? (
            // iOS only reports the heading once location is allowed.
            <MonoText style={{ fontSize: 16 }}>
              Allow location access (Settings) to use the Qibla compass.
            </MonoText>
          ) : noCompass ? (
            <>
              <MonoText style={{ fontSize: 16 }}>
                This device has no compass, so it can't point the way.
              </MonoText>
              {qiblaBearing != null && (
                <MonoText style={{ fontSize: 16, marginTop: 10 }}>
                  {`From where you are, the Kaaba is ${qiblaBearing.toFixed(0)}° clockwise from north.`}
                </MonoText>
              )}
            </>
          ) : (
            <MonoText style={{ fontSize: 16, textAlign: "center" }}>
              Waiting for compass...
            </MonoText>
          )}
        </View>
      </MonoScrollPage>
    );
  }

  const { heading, qiblaBearing, accuracy } = compass;

  const diff = Math.abs(((heading - qiblaBearing + 540) % 360) - 180);
  const aligned = diff <= 2.0;

  return (
    <MonoScrollPage>
      <View style={{ flex: 1, paddingBottom: 40, alignItems: "center" }}>
        <View style={{ padding: 20, alignSelf: "stretch" }}>
          <MonoText style={{ fontSize: 18 }}>
            {`Kaaba direction: ${qiblaBearing.toFixed(0)}°`}
          </MonoText>
          <MonoText style={{ fontSize: 18, marginTop: 5 }}>
            {`You're facing: ${heading.toFixed(0)}°${aligned ? " \u2713" : ""}`}
          </MonoText>
          <MonoText style={{ fontSize: 18, marginTop: 5 }}>
            Accuracy: {accuracy}{" "}
            {(accuracy === "low" || accuracy === "none") &&
              "Low accuracy - wave phone in figure-8"}
          </MonoText>
        </View>

        <Animated.View style={[{ position: "relative", marginTop: 20 }, dial]}>
          <CompassRing>
            <CompassArrow rotation={qiblaBearing} />
          </CompassRing>
          <CardinalLabel label="N" rotation={0} heading={smoothHeading} />
          <CardinalLabel label="E" rotation={90} heading={smoothHeading} />
          <CardinalLabel label="S" rotation={180} heading={smoothHeading} />
          <CardinalLabel label="W" rotation={270} heading={smoothHeading} />
        </Animated.View>
      </View>
    </MonoScrollPage>
  );
}
