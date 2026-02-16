import { ReactNode } from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MonoView } from "./MonoView";

type MonoScrollPageProps = {
  children: ReactNode | ReactNode[];
};

export function MonoScrollPage(props: MonoScrollPageProps) {
  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1 }}>
      <MonoView style={{ flex: 1 }}>
        <ScrollView>{props.children}</ScrollView>
      </MonoView>
    </SafeAreaView>
  );
}
