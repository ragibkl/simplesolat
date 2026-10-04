import { WidgetExtraTime } from "@/lib/data/settingsStore";
import { WaktuSolat } from "@/lib/domain/prayerTime";

import { getWidgetColumns } from "../widgetColumns";

// What the iOS widget shows at one moment. The widget itself can't compute
// anything, so the app works out every change ahead of time.
export type IosWidgetProps = {
  dateText: string;
  place: string;
  // time: "5:53 am"; short: "5:53" (the medium widget is too narrow for am/pm)
  columns: { label: string; time: string; short?: string }[];
  // Index of the current prayer in columns, or -1 between prayers.
  active: number;
  // The next prayer, for the Lock Screen widget.
  next: string;
};

export type IosWidgetEntry = { date: Date; props: IosWidgetProps };

function timeText(epochSeconds: number): string {
  return (
    new Date(epochSeconds * 1000)
      .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
      // iOS puts a narrow no-break space (U+202F) before AM/PM.
      .replace(/\s+/g, " ")
      .toLowerCase()
  );
}

function startOfDay(ws: WaktuSolat): number {
  return new Date(ws.year, ws.month - 1, ws.date).getTime();
}

// Timeline entries for the given days: one at midnight and one at every
// moment a prayer starts or ends, from now on.
export function buildTimeline(
  days: WaktuSolat[],
  place: string,
  extraTime: WidgetExtraTime,
  now: number = Date.now(),
): IosWidgetEntry[] {
  const entries: IosWidgetEntry[] = [];

  days.forEach((ws, dayIndex) => {
    const cols = getWidgetColumns(ws.prayerTime, extraTime);
    const dayStart = startOfDay(ws);
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;
    const columns = cols.map((c) => ({
      label: c.label,
      time: timeText(c.start),
      short: timeText(c.start).replace(/\s*[ap]m$/, ""),
    }));
    const dateText = new Date(dayStart).toDateString();
    const tomorrow = days[dayIndex + 1];
    const firstTomorrow = tomorrow
      ? getWidgetColumns(tomorrow.prayerTime, extraTime)[0]
      : undefined;

    const moments = new Set<number>([dayStart]);
    for (const c of cols) {
      moments.add(c.start * 1000);
      if (c.end !== undefined) moments.add(c.end * 1000);
    }

    const sorted = [...moments].filter((t) => t < dayEnd).sort((a, b) => a - b);
    sorted.forEach((t, i) => {
      const nextMoment = sorted[i + 1] ?? dayEnd;
      if (nextMoment <= now) return; // already over

      const active = cols.findIndex(
        (c) => c.start * 1000 <= t && (c.end === undefined || t < c.end * 1000),
      );
      const upcoming = cols.find((c) => c.start * 1000 > t);
      const next = upcoming
        ? `${upcoming.label} ${timeText(upcoming.start)}`
        : firstTomorrow
          ? `${firstTomorrow.label} ${timeText(firstTomorrow.start)}`
          : "";

      entries.push({
        date: new Date(Math.max(t, Math.min(now, nextMoment))),
        props: { dateText, place, columns, active, next },
      });
    });
  });

  return entries;
}
