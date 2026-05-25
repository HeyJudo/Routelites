import type { OptimizeResponse } from "../types/api";

/**
 * Mock response matching the backend /api/optimize contract.
 * Uses the demo store (Pureza, Santa Mesa) and 3 demo stops.
 * The optimized route reorders stops for a shorter closed tour.
 */
export const mockOptimizeResponse: OptimizeResponse = {
  optimized_route: {
    order: ["store", "stop_1", "stop_3", "stop_2", "store"],
    total_distance_m: 8420,
    legs: [
      {
        from: "store",
        to: "stop_1",
        distance_m: 2100,
        path: [
          { lat: 14.6018, lng: 121.0051 },
          { lat: 14.6030, lng: 120.9980 },
          { lat: 14.6042, lng: 120.9885 },
        ],
      },
      {
        from: "stop_1",
        to: "stop_3",
        distance_m: 2800,
        path: [
          { lat: 14.6042, lng: 120.9885 },
          { lat: 14.5980, lng: 121.0100 },
          { lat: 14.5903, lng: 121.0339 },
        ],
      },
      {
        from: "stop_3",
        to: "stop_2",
        distance_m: 1920,
        path: [
          { lat: 14.5903, lng: 121.0339 },
          { lat: 14.5850, lng: 121.0100 },
          { lat: 14.5795, lng: 120.9849 },
        ],
      },
      {
        from: "stop_2",
        to: "store",
        distance_m: 1600,
        path: [
          { lat: 14.5795, lng: 120.9849 },
          { lat: 14.5900, lng: 120.9950 },
          { lat: 14.6018, lng: 121.0051 },
        ],
      },
    ],
  },
  naive_route: {
    order: ["store", "stop_1", "stop_2", "stop_3", "store"],
    total_distance_m: 11350,
    legs: [
      {
        from: "store",
        to: "stop_1",
        distance_m: 2100,
        path: [
          { lat: 14.6018, lng: 121.0051 },
          { lat: 14.6030, lng: 120.9980 },
          { lat: 14.6042, lng: 120.9885 },
        ],
      },
      {
        from: "stop_1",
        to: "stop_2",
        distance_m: 2750,
        path: [
          { lat: 14.6042, lng: 120.9885 },
          { lat: 14.5920, lng: 120.9870 },
          { lat: 14.5795, lng: 120.9849 },
        ],
      },
      {
        from: "stop_2",
        to: "stop_3",
        distance_m: 3200,
        path: [
          { lat: 14.5795, lng: 120.9849 },
          { lat: 14.5850, lng: 121.0100 },
          { lat: 14.5903, lng: 121.0339 },
        ],
      },
      {
        from: "stop_3",
        to: "store",
        distance_m: 3300,
        path: [
          { lat: 14.5903, lng: 121.0339 },
          { lat: 14.5960, lng: 121.0200 },
          { lat: 14.6018, lng: 121.0051 },
        ],
      },
    ],
  },
  savings: {
    distance_m: 2930,
    percentage: 25.8,
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
    computation_time_ms: 42,
  },
};
