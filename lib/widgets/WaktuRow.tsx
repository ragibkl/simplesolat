import { FlexWidget, TextWidgetStyle } from "react-native-android-widget";

import { MonoTextWidget } from "@/lib/components/MonoTextWidget";
import { getTimeText } from "./utils";

export type WaktuRowProps = {
  date: Date;
  label: string;
  start: number;
  end?: number;
  textStyle?: TextWidgetStyle;
};

export function WaktuRow(props: WaktuRowProps) {
  const { date, label, start, end = Infinity, textStyle } = props;
  const epoch = date.getTime() / 1000;
  const bold = epoch >= start && epoch < end;
  const fontWeight = bold ? "extrabold" : "regular";

  return (
    <FlexWidget
      style={{
        flex: 1,
        flexDirection: "row",
        width: "match_parent",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 4,
      }}
    >
      <MonoTextWidget style={textStyle} fontWeight={fontWeight}>
        {label}
      </MonoTextWidget>
      <MonoTextWidget style={textStyle} fontWeight={fontWeight}>
        {getTimeText(start)}
      </MonoTextWidget>
    </FlexWidget>
  );
}
