import PolygonLookup from "polygon-lookup";

import { zoneStore, Zone } from "@/lib/data/zoneStore";

import jakimGeoData from "@/assets/geodata/malaysia-district-jakim.json";
import singaporeGeoData from "@/assets/geodata/singapore-adm0.json";
import indonesiaGeoData from "@/assets/geodata/indonesia-adm2.json";
import indonesiaZoneMapping from "@/assets/geodata/adm2_zone_mapping_id.json";
import bruneiGeoData from "@/assets/geodata/brunei-adm1.json";
import bruneiZoneMapping from "@/assets/geodata/adm1_zone_mapping_bn.json";
import { getLocation } from "./location";

const jakimLookup = new PolygonLookup(jakimGeoData as any);
const singaporeLookup = new PolygonLookup(singaporeGeoData as any);
const indonesiaLookup = new PolygonLookup(indonesiaGeoData as any);
const bruneiLookup = new PolygonLookup(bruneiGeoData as any);

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

function lookupIndonesiaZone(lat: number, lng: number): Zone | null {
  const result = indonesiaLookup.search(lng, lat);
  if (!result || !result.properties) {
    return null;
  }

  const shapeName = result.properties.shapeName;
  const mapping = (
    indonesiaZoneMapping as Record<string, { zone: string; province: string }>
  )[shapeName];
  if (!mapping) {
    return null;
  }

  return {
    zone: mapping.zone,
    country: "ID",
    state: mapping.province,
    district: shapeName,
  };
}

function lookupBruneiZone(lat: number, lng: number): Zone | null {
  const result = bruneiLookup.search(lng, lat);
  if (!result || !result.properties) {
    return null;
  }

  const shapeName = result.properties.shapeName;
  const mapping = (
    bruneiZoneMapping as Record<string, { zone: string; district: string }>
  )[shapeName];
  if (!mapping) {
    return null;
  }

  return {
    zone: mapping.zone,
    country: "BN",
    state: "Brunei",
    district: mapping.district,
  };
}

export function lookupZoneByGps(lat: number, lng: number): Zone | null {
  const myZone = lookupMalaysiaZone(lat, lng);
  if (myZone) return myZone;

  const sgZone = lookupSingaporeZone(lat, lng);
  if (sgZone) return sgZone;

  const bnZone = lookupBruneiZone(lat, lng);
  if (bnZone) return bnZone;

  const idZone = lookupIndonesiaZone(lat, lng);
  if (idZone) return idZone;

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
