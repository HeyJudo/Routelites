export type LatLngPoint = { lat: number; lng: number };

export type RouteLeg = {
  from: string;
  to: string;
  distance_m: number;
 // path: LatLngPoint[];
 path: { lat: number; lng: number }[];
  time_min?: number | null;
  congestion?: "low" | "moderate" | "heavy" | null;
};

export type RouteResult = {
  order: string[];
  total_distance_m: number;
  legs: RouteLeg[];
};

export type Savings = {
  distance_m: number;
  percentage: number;
  time_min?: number | null;
};

export type OptimizeMetadata = {
  mode: "exact" | "clustered";
  stops_processed: number;
  dijkstra_runs: number;
  distance_matrix_size: string;
  branches_explored: number;
  branches_pruned: number;
  batches_used: number;
  exact_global_optimum: boolean;
  computation_time_ms: number;
  objective?: "distance" | "time";
  traffic_source?: "none" | "live" | "mock";
  optimized_time_min?: number | null;
  naive_time_min?: number | null;
  traffic_as_of?: string | null;
};

export type PlaceInfo = {
  label: string;
  address: string;
};

export type OptimizeResponse = {
  optimized_route: RouteResult;
  naive_route: RouteResult;
  savings: Savings;
  metadata: OptimizeMetadata;
  places?: Record<string, PlaceInfo>;
};

export type OptimizeRequest = {
  store: { lat: number; lng: number; label: string; address?: string };
  stops: { id: string; lat: number; lng: number; label: string; address?: string }[];
  mode?: "distance" | "time";
};
