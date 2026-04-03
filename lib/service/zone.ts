import { zoneStore } from "@/lib/data/zoneStore";
import { Zone } from "@/lib/domain/zone";
import { getLocation } from "./location";
import { lookupZoneByGpsGH } from "./zoneGH";

export async function lookupZoneByGps(lat: number, lng: number): Promise<Zone> {
  return lookupZoneByGpsGH(lat, lng);
}

export async function updateZoneViaGps(
  lat: number,
  lng: number,
): Promise<Zone> {
  const existingZone = await zoneStore.load();
  const newZone = await lookupZoneByGps(lat, lng);

  if (
    existingZone &&
    JSON.stringify(existingZone) === JSON.stringify(newZone)
  ) {
    return existingZone;
  }

  await zoneStore.save(newZone);
  return newZone;
}

export async function getUpdatedZone(): Promise<Zone | null> {
  const location = await getLocation();
  if (location) {
    return await updateZoneViaGps(
      location.coords.latitude,
      location.coords.longitude,
    );
  }

  return await zoneStore.load();
}
