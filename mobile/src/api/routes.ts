//import type { OptimizeRequest, OptimizeResponse } from "../types/api";
 import { apiFetch } from "./clients";

export interface OptimizeRequest {
  store: {
    lat: number;
    lng: number;
    lon: number;
    label: string;
    address?: string;
  };
  stops: Array<{
    id: string;
    lat: number;
    lng: number;
    lon: number;
    label: string;
    address?: string;
  }>;
}

export interface OptimizeResponse {
  [key: string]: any; // Allows any JSON shape returned from your Python backend optimizer
}

 export function getHealth() {
   return apiFetch<{ status: string; graph_loaded: boolean; graph_mode: string }>("/health");
 }

 export function optimizeRoute(request: OptimizeRequest): Promise<OptimizeResponse> {
   return apiFetch<OptimizeResponse>("/api/optimize", {
 	method: "POST",
 	body: JSON.stringify(request),
   });
   
 }
