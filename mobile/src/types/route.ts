export type LatLng = {
  lat: number;
  lng: number;
};

export type StoreLocation = LatLng & {
  address: string;
  label: string;
};

export type Stop = LatLng & {
  address: string;
  id: string;
  label: string;
};

