declare module "islamic-date" {
  interface HijriResult {
    success: boolean;
    day: number;
    month: number;
    monthName: string;
    year: number;
    fullDate: string;
    hijriDate: string;
    gregorianDate: string;
    weekIndex: number;
    calendarType: string;
  }

  export function gregorianToHijri(
    year: number,
    month: number,
    day: number,
    language?: string,
    calendarType?: string,
  ): HijriResult;
}
