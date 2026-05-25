import type { StoreLocation, Stop } from "../types/route";

export const metroManilaRegion = {
  latitude: 14.5995,
  latitudeDelta: 0.065,
  longitude: 120.9842,
  longitudeDelta: 0.045,
};

export const demoStore: StoreLocation = {
  address: "Pureza, Santa Mesa, Manila",
  label: "Depot Alpha",
  lat: 14.6018,
  lng: 121.0051,
};

export const demoStops: Stop[] = [
  {
    address: "Nicanor Reyes St, Sampaloc, Manila",
    id: "stop_1",
    label: "Stop 1",
    lat: 14.6042,
    lng: 120.9885,
  },
  {
    address: "Pedro Gil St, Ermita, Manila",
    id: "stop_2",
    label: "Stop 2",
    lat: 14.5795,
    lng: 120.9849,
  },
  {
    address: "Shaw Blvd, Mandaluyong",
    id: "stop_3",
    label: "Stop 3",
    lat: 14.5903,
    lng: 121.0339,
  },
];

export function createMapStop(lat: number, lng: number, stopNumber: number): Stop {
  return {
    address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    id: `map_stop_${Date.now()}_${stopNumber}`,
    label: `Map Stop ${stopNumber}`,
    lat,
    lng,
  };
}

