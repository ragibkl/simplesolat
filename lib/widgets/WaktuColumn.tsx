import {
  FlexWidget,
  FlexWidgetStyle,
  TextWidgetStyle,
} from "react-native-android-widget";

import { MonoTextWidget } from "@/lib/components/MonoTextWidget";
import { getTimeText } from "@/lib/domain/prayerTime";

type ColumnTextProps = {
  children: string;
  bold: boolean;
  textStyle?: TextWidgetStyle;
  wrapperStyle?: FlexWidgetStyle;
};

function ColumnText(props: ColumnTextProps) {
  const fontWeight = props.bold ? "extrabold" : "regular";

  return (
    <FlexWidget
      style={{
        justifyContent: "center",
        alignItems: "center",
        marginVertical: 2,
        ...(props.wrapperStyle || {}),
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
  wrapperStyle?: FlexWidgetStyle;
};

export function WaktuColumn(props: WaktuColumnProps) {
  const { date, label, start, end = Infinity, textStyle, wrapperStyle } = props;
  const epoch = date.getTime() / 1000;
  const bold = epoch >= start && epoch < end;

  return (
    <FlexWidget
      style={{
        flex: 1,
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <ColumnText textStyle={textStyle} wrapperStyle={wrapperStyle} bold={bold}>
        {label}
      </ColumnText>
      <ColumnText textStyle={textStyle} wrapperStyle={wrapperStyle} bold={bold}>
        {getTimeText(start)}
      </ColumnText>
    </FlexWidget>
  );
}
