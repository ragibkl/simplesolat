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
