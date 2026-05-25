export type LatLngPoint = { lat: number; lng: number };

export type RouteLeg = {
  from: string;
  to: string;
  distance_m: number;
  path: LatLngPoint[];
};

export type RouteResult = {
  order: string[];
  total_distance_m: number;
  legs: RouteLeg[];
};

export type Savings = {
  distance_m: number;
  percentage: number;
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
};

export type OptimizeResponse = {
  optimized_route: RouteResult;
  naive_route: RouteResult;
  savings: Savings;
  metadata: OptimizeMetadata;
};

export type OptimizeRequest = {
  store: { lat: number; lng: number; label: string };
  stops: { id: string; lat: number; lng: number; label: string }[];
};
