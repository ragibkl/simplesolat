// UTC offsets in minutes, for the time-zone hint on the home screen.

// The offset of an IANA time zone at a moment, from Intl (no extra library).
export function zoneOffsetMinutes(timeZone: string, at: Date): number | null {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).formatToParts(at);
    const get = (type: string) =>
      Number(parts.find((p) => p.type === type)?.value);
    const asUtc = Date.UTC(
      get("year"),
      get("month") - 1,
      get("day"),
      get("hour") % 24,
      get("minute"),
    );
    const offset = Math.round(
      (asUtc - Math.floor(at.getTime() / 60000) * 60000) / 60000,
    );
    return Number.isFinite(offset) ? offset : null;
  } catch {
    return null;
  }
}

export function phoneOffsetMinutes(at: Date): number {
  return -at.getTimezoneOffset();
}

// "GMT+8", "GMT+5:30", "GMT-4"
export function gmtLabel(offsetMinutes: number): string {
  const sign = offsetMinutes < 0 ? "-" : "+";
  const abs = Math.abs(offsetMinutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `GMT${sign}${h}${m ? `:${String(m).padStart(2, "0")}` : ""}`;
}
