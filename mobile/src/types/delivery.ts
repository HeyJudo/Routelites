export type DeliveryStopStatus = "pending" | "delivered" | "failed";
export type DeliveryRunStatus = "active" | "completed" | "cancelled";

export interface ActiveDeliveryStop {
  id: string;
  stopIndex: number;
  label: string;
  address: string;
  lat: number;
  lng: number;
  status: DeliveryStopStatus;
  note?: string;
}

export interface ActiveDeliveryRun {
  id: string;
  savedRouteId: string | null;
  name: string | null;
  status: DeliveryRunStatus;
  optimizedOrder: string[];
  totalDistanceM: number;
  stops: ActiveDeliveryStop[];
  startedAt: string;
  completedAt: string | null;
}

// Normalized input the caller (a screen, later) passes to start a run:
export interface StartRunInput {
  savedRouteId?: string | null;
  name?: string | null;
  optimizedOrder: string[];
  totalDistanceM: number;
  stops: Array<{ label: string; address: string; lat: number; lng: number }>;
}
