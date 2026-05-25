import type { Stop } from "../types/route";

// Approximate NCR bounding box
const NCR_LAT_MIN = 14.35;
const NCR_LAT_MAX = 14.78;
const NCR_LNG_MIN = 120.9;
const NCR_LNG_MAX = 121.15;

export function isInsideNCR(lat: number, lng: number): boolean {
  return (
    lat >= NCR_LAT_MIN &&
    lat <= NCR_LAT_MAX &&
    lng >= NCR_LNG_MIN &&
    lng <= NCR_LNG_MAX
  );
}

// ~0.0005° ≈ 55m at NCR latitude
const DUPLICATE_THRESHOLD = 0.0005;

export function isDuplicateStop(
  stops: Stop[],
  lat: number,
  lng: number,
): boolean {
  return stops.some(
    (s) =>
      Math.abs(s.lat - lat) < DUPLICATE_THRESHOLD &&
      Math.abs(s.lng - lng) < DUPLICATE_THRESHOLD,
  );
}
