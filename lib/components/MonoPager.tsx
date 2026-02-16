import { ReactNode, useRef, useState } from "react";
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  View,
} from "react-native";

import { useMonoStyle } from "./monoui";

const screenWidth = Dimensions.get("window").width;

function DotIndicator(props: { active: boolean }) {
  const { color } = useMonoStyle();
  return (
    <View
      style={{
        width: 8,
        height: 8,
        borderRadius: 4,
        marginHorizontal: 4,
        backgroundColor: props.active ? color : "transparent",
        borderWidth: 1,
        borderColor: color,
      }}
    />
  );
}

type MonoPagerProps = {
  children: ReactNode[];
};

export function MonoPager(props: MonoPagerProps) {
  const [activePage, setActivePage] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const pageCount = props.children.length;

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
    setActivePage(page);
  };

  return (
    <View>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
      >
        {props.children.map((child, index) => (
          <View key={index} style={{ width: screenWidth }}>
            {child}
          </View>
        ))}
      </ScrollView>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          paddingVertical: 10,
        }}
      >
        {Array.from({ length: pageCount }, (_, i) => (
          <DotIndicator key={i} active={activePage === i} />
        ))}
      </View>
    </View>
  );
}
