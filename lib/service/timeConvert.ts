/**
 * Convert a local HH:MM time string + date + IANA timezone to Unix epoch seconds.
 *
 * Uses Intl.DateTimeFormat to resolve the UTC offset for the target timezone
 * on the given date, then computes the epoch.
 */
export function localTimeToEpoch(
  dateStr: string,
  timeStr: string,
  timezone: string,
): number {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = timeStr.split(":").map(Number);

  // Start with a guess: treat the wall-clock time as UTC
  const guessUtc = Date.UTC(year, month - 1, day, hours, minutes, 0);

  // Use Intl.DateTimeFormat to find what wall-clock time this UTC instant
  // corresponds to in the target timezone
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(new Date(guessUtc));

  const localHour = Number(parts.find((p) => p.type === "hour")!.value);
  const localMinute = Number(parts.find((p) => p.type === "minute")!.value);
  const localDay = Number(parts.find((p) => p.type === "day")!.value);

  // Offset = (what the timezone shows) - (what we want)
  let offsetMinutes = localHour * 60 + localMinute - (hours * 60 + minutes);
  offsetMinutes += (localDay - day) * 24 * 60; // handle day boundary

  // Adjust: if timezone shows a later time, our guess was too early (UTC is behind)
  const correctedUtcMs = guessUtc - offsetMinutes * 60_000;
  return Math.floor(correctedUtcMs / 1000);
}
