import type { Stop } from "../types/route";

// Approximate NCR bounding box
const NCR_LAT_MIN = 14.35;
const NCR_LAT_MAX = 14.78;
const NCR_LNG_MIN = 120.9;
const NCR_LNG_MAX = 121.15;

/**
 * Check whether a latitude/longitude pair lies within the predefined National Capital Region bounding box.
 *
 * @param lat - Latitude in decimal degrees
 * @param lng - Longitude in decimal degrees
 * @returns `true` if both coordinates are within the NCR bounding box (inclusive), `false` otherwise
 */
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

/**
 * Determines whether a coordinate is considered a duplicate of any existing stop.
 *
 * @param stops - Array of existing stops to compare against
 * @param lat - Latitude of the candidate stop
 * @param lng - Longitude of the candidate stop
 * @returns `true` if an existing stop is within the duplicate tolerance of `lat` and `lng`, `false` otherwise
 */
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
