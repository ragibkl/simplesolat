import PolygonLookup from "polygon-lookup";

import { zoneStore, Zone } from "@/lib/data/zoneStore";

import jakimGeoData from "@/assets/geodata/malaysia-district-jakim.json";
import { getLocation } from "./location";

const lookup = new PolygonLookup(jakimGeoData as any);

export function lookupZoneByGps(lat: number, lng: number): Zone | null {
  const result = lookup.search(lng, lat);
  console.log("lookupZoneByGps", lat, lng, result);
  if (!result || !result.properties) {
    return null;
  }

  console.log("lookupZoneByGps - properties", result.properties);
  const zone = result.properties.jakim_code;
  const state = result.properties.state;
  const district = result.properties.name;

  return {
    zone,
    state,
    district,
  };
}

export async function updateZoneViaGps(
  lat: number,
  lng: number,
): Promise<Zone | null> {
  const zone = await zoneStore.load();
  const zoneData = lookupZoneByGps(lat, lng);

  if (zoneData && zoneData.zone !== zone?.zone) {
    await zoneStore.save(zoneData);
    return zoneData;
  }

  return zone;
}

export async function getUpdatedZone(): Promise<Zone | null> {
  const location = await getLocation();
  if (location) {
    const zone = await updateZoneViaGps(
      location.coords.latitude,
      location.coords.longitude,
    );

    return zone;
  }

  return await zoneStore.load();
}
