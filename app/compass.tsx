import { View } from "react-native";

import { MonoScrollPage } from "@/lib/components/MonoScrollPage";
import { MonoText } from "@/lib/components/MonoText";
import { useMonoStyle } from "@/lib/components/monoui";
import { useCompass } from "@/lib/hooks/compass";

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

function CardinalLabel(props: {
  label: string;
  rotation: number;
  heading: number;
}) {
  const { color } = useMonoStyle();
  const textRotation = props.heading - props.rotation;
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
      <MonoText
        style={{
          fontSize: 18,
          color,
          marginTop: 2,
          transform: [{ rotate: `${textRotation}deg` }],
        }}
      >
        {props.label}
      </MonoText>
    </View>
  );
}

export default function Compass() {
  const { heading, qiblaBearing, ready } = useCompass();

  const diff = ready
    ? Math.abs(((heading! - qiblaBearing! + 540) % 360) - 180)
    : null;
  const aligned = diff != null && diff <= 1.0;

  return (
    <MonoScrollPage>
      {ready ? (
        <View style={{ flex: 1, alignItems: "center", paddingBottom: 40 }}>
          <View style={{ padding: 20 }}>
            <MonoText style={{ fontSize: 14 }}>
              {`Kaaba direction: ${qiblaBearing!.toFixed(1)}°`}
            </MonoText>
            <MonoText style={{ fontSize: 14, marginTop: 5 }}>
              {`You're facing: ${heading!.toFixed(1)}°${aligned ? " \u2713" : ""}`}
            </MonoText>
          </View>

          <View
            style={{
              position: "relative",
              transform: [{ rotate: `${-heading!}deg` }],
            }}
          >
            <CompassRing>
              <CompassArrow rotation={qiblaBearing!} />
            </CompassRing>
            <CardinalLabel label="N" rotation={0} heading={heading!} />
            <CardinalLabel label="E" rotation={90} heading={heading!} />
            <CardinalLabel label="S" rotation={180} heading={heading!} />
            <CardinalLabel label="W" rotation={270} heading={heading!} />
          </View>
        </View>
      ) : (
        <View style={{ flex: 1, alignItems: "center", paddingTop: 40 }}>
          <MonoText style={{ fontSize: 16 }}>Waiting for compass...</MonoText>
        </View>
      )}
    </MonoScrollPage>
  );
}
