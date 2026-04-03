// Currently unused — removed from UI until hijri date accuracy
// can be verified across MABIMS vs Umm al-Qura calendar differences.
import { gregorianToHijri } from "islamic-date";

export function getHijriDateText(date: Date): string {
  const hijri = gregorianToHijri(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
    "en",
    "mabims",
  );
  return hijri.fullDate;
}
