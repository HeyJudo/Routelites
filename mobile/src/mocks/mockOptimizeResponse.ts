import type { OptimizeResponse } from "../types/api";

/**
 * Mock response matching the backend /api/optimize contract.
 * Uses the demo store (Pureza, Santa Mesa) and 3 demo stops.
 * The optimized route reorders stops for a shorter closed tour.
 */
export const mockOptimizeResponse: OptimizeResponse = {
  optimized_route: {
    order: ["store", "stop_a", "stop_b", "stop_c", "store"],
    total_distance_m: 4450,
    legs: [
      {
        source: "store",
        target: "stop_a",
        distance_m: 900,
        path: [
          { lat: 14.5995, lng: 120.9842 },
          { lat: 14.6010, lng: 120.9850 },
        ],
      },
      {
        source: "stop_a",
        target: "stop_b",
        distance_m: 700,
        path: [
          { lat: 14.6010, lng: 120.9850 },
          { lat: 14.6030, lng: 120.9870 },
        ],
      },
      {
        source: "stop_b",
        target  : "stop_c",
        distance_m: 600,
        path: [
          { lat: 14.6030, lng: 120.9870 },
          { lat: 14.6050, lng: 120.9890 },
        ],
      },
      {
        source: "stop_c",
        target: "store",
        distance_m: 2250,
        path: [
          { lat: 14.6050, lng: 120.9890 },
          { lat: 14.5995, lng: 120.9842 },
        ],
      },
    ],
  },
  naive_route: {
    order: ["store", "stop_b", "stop_a", "stop_c", "store"],
    total_distance_m: 11350,
    legs: [
      {
        source: "store",
        target: "stop_b",
        distance_m: 1600,
        path: [
          { lat: 14.5995, lng: 120.9842 },
          { lat: 14.6030, lng: 120.9870 },
        ],
      },
      {
        source: "stop_b",
        target: "stop_a",
        distance_m: 2750,
        path: [
          { lat: 14.6030, lng: 120.9870 },
          { lat: 14.6010, lng: 120.9850 },
        ],
      },
      {
        source: "stop_a",
        target: "stop_c",
        distance_m: 3200,
        path: [
          { lat: 14.6010, lng: 120.9850 },
          { lat: 14.6050, lng: 120.9890 },
        ],
      },
      {
        source: "stop_c",
        target: "store",
        distance_m: 3300,
        path: [
          { lat: 14.6050, lng: 120.9890 },
          { lat: 14.5995, lng: 120.9842 },
        ],
      },
    ],
  },
  savings: {
    distance_m: 1400,
    percentage: 23.93,
  },
  metadata: {
    mode: "exact",
    stops_processed: 3,
    dijkstra_runs: 4,
    distance_matrix_size: "4x4",
    branches_explored: 12,
    branches_pruned: 6,
    batches_used: 1,
    exact_global_optimum: true,
    computation_time_ms: 15,
  },
};
