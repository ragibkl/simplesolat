import { FlexWidget, TextWidgetStyle } from "react-native-android-widget";

import { MonoTextWidget } from "@/lib/components/MonoTextWidget";
import { getTimeText } from "./utils";

function ColumnText(props: {
  children: string;
  bold: boolean;
  textStyle?: TextWidgetStyle;
}) {
  const fontWeight = props.bold ? "extrabold" : "regular";

  return (
    <FlexWidget
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <MonoTextWidget style={props.textStyle} fontWeight={fontWeight}>
        {props.children}
      </MonoTextWidget>
    </FlexWidget>
  );
}

export type WaktuColumnProps = {
  date: Date;
  label: string;
  start: number;
  end?: number;
  textStyle?: TextWidgetStyle;
};

export function WaktuColumn(props: WaktuColumnProps) {
  const { date, label, start, end = Infinity, textStyle } = props;
  const epoch = date.getTime() / 1000;
  const bold = epoch >= start && epoch < end;

  return (
    <FlexWidget
      style={{
        flex: 1,
        flexDirection: "column",
        height: "match_parent",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <ColumnText textStyle={textStyle} bold={bold}>
        {label}
      </ColumnText>
      <ColumnText textStyle={textStyle} bold={bold}>
        {getTimeText(start)}
      </ColumnText>
    </FlexWidget>
  );
}
