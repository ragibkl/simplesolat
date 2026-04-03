import { fromZonedTime } from "date-fns-tz";

/**
 * Convert a local HH:MM time string + date + IANA timezone to Unix epoch seconds.
 */
export function localTimeToEpoch(
  dateStr: string,
  timeStr: string,
  timezone: string,
): number {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = timeStr.split(":").map(Number);

  const utcDate = fromZonedTime(
    new Date(year, month - 1, day, hours, minutes, 0),
    timezone,
  );
  return Math.floor(utcDate.getTime() / 1000);
}
