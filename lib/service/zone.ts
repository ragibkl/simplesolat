import PolygonLookup from "polygon-lookup";

import { zoneStore, Zone } from "@/lib/data/zoneStore";

import jakimGeoData from "@/assets/geodata/malaysia-district-jakim.json";
import singaporeGeoData from "@/assets/geodata/singapore-adm0.json";
import { getLocation } from "./location";

const jakimLookup = new PolygonLookup(jakimGeoData as any);
const singaporeLookup = new PolygonLookup(singaporeGeoData as any);

function lookupMalaysiaZone(lat: number, lng: number): Zone | null {
  const result = jakimLookup.search(lng, lat);
  if (!result || !result.properties) {
    return null;
  }

  return {
    zone: result.properties.jakim_code,
    country: "MY",
    state: result.properties.state,
    district: result.properties.name,
  };
}

function lookupSingaporeZone(lat: number, lng: number): Zone | null {
  const result = singaporeLookup.search(lng, lat);
  if (!result || !result.properties) {
    return null;
  }

  return {
    zone: "SGP01",
    country: "SG",
    state: "Singapore",
    district: "Singapore",
  };
}

export function lookupZoneByGps(lat: number, lng: number): Zone | null {
  const myZone = lookupMalaysiaZone(lat, lng);
  if (myZone) return myZone;

  const sgZone = lookupSingaporeZone(lat, lng);
  if (sgZone) return sgZone;

  return null;
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
