import { ReactNode } from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MonoView } from "./MonoView";

type MonoScrollPageProps = {
  children: ReactNode | ReactNode[];
};

export function MonoScrollPage(props: MonoScrollPageProps) {
  return (
    // The page colour goes behind the home indicator too (no light strip).
    <MonoView style={{ flex: 1 }}>
      <SafeAreaView edges={["bottom"]} style={{ flex: 1 }}>
        <ScrollView>{props.children}</ScrollView>
      </SafeAreaView>
    </MonoView>
  );
}
