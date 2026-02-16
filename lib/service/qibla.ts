const KAABA_LAT = (21.4225 * Math.PI) / 180;
const KAABA_LNG = (39.8262 * Math.PI) / 180;

export function getQiblaBearing(lat: number, lng: number): number {
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;

  const dLng = KAABA_LNG - lngRad;

  const x = Math.sin(dLng) * Math.cos(KAABA_LAT);
  const y =
    Math.cos(latRad) * Math.sin(KAABA_LAT) -
    Math.sin(latRad) * Math.cos(KAABA_LAT) * Math.cos(dLng);

  const angle = Math.atan2(x, y);
  return ((angle * 180) / Math.PI + 360) % 360;
}
