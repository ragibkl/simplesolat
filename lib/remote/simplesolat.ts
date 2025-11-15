import axios from "axios";
import { addYears, endOfYear } from "date-fns";

export type Prayer = {
  date: string;
  zone: string;
  imsak: number;
  fajr: number;
  syuruk: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
};

export type WaktuSolatResponse = {
  data: Prayer[];
};

function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0"); // getMonth() is 0-indexed
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function getWaktuSolatByZone(
  date: Date,
  zone: string,
): Promise<WaktuSolatResponse> {
  console.log(`getWaktuSolatByZone(${date}, ${zone})`);
  const to = endOfYear(addYears(date, 1));
  const params = new URLSearchParams({
    from: toDateString(date),
    to: toDateString(to),
  });
  const url = `https://api.simplesolat.apps.bancuh.net/prayer-times/by-zone/${zone}?${params.toString()}`;
  console.log(`getWaktuSolatByZone - GET ${url}`);
  const response = await axios.get(url);
  return response.data as WaktuSolatResponse;
}
