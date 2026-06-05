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
  lat: 14.5995,
  lng: 120.9842,
};

export const demoStops: Stop[] = [
  {
    address: "Nicanor Reyes St, Sampaloc, Manila",
    id: "stop_a",
    label: "Stop A",
    lat: 14.6010,
    lng: 120.9850,
  },
  {
    address: "Pedro Gil St, Ermita, Manila",
    id: "stop_b",
    label: "Stop B",
    lat: 14.6030,
    lng: 120.9870,
  },
  {
    address: "Shaw Blvd, Mandaluyong",
    id: "stop_c",
    label: "Stop C",
    lat: 14.6050,
    lng: 120.9890,
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

