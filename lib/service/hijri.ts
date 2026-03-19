import { gregorianToHijri } from "@tabby_ai/hijri-converter";

const HIJRI_MONTHS = [
  "Muharram",
  "Safar",
  "Rabi al-Awwal",
  "Rabi al-Thani",
  "Jumada al-Ula",
  "Jumada al-Thani",
  "Rajab",
  "Shaaban",
  "Ramadan",
  "Shawwal",
  "Dhul Qaadah",
  "Dhul Hijjah",
];

export function getHijriDateText(date: Date): string {
  const hijri = gregorianToHijri({
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  });
  return `${hijri.day} ${HIJRI_MONTHS[hijri.month - 1]} ${hijri.year}`;
}
