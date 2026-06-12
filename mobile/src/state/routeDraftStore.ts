import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { demoStops, demoStore } from "../data/demoRoute";
import type { Stop, StoreLocation } from "../types/route";

interface RouteDraftState {
  storeLocation: StoreLocation | null;
  stops: Stop[];
  hasHydrated: boolean;
  optimizeMode: "distance" | "time";
  setStoreLocation: (store: StoreLocation) => void;
  clearStoreLocation: () => void;
  addStop: (stop: Stop) => void;
  removeStop: (id: string) => void;
  reorderStop: (fromIndex: number, toIndex: number) => void;
  clearStops: () => void;
  loadDemoRoute: () => void;
  setHasHydrated: (v: boolean) => void;
  setOptimizeMode: (m: "distance" | "time") => void;
}

export const useRouteDraftStore = create<RouteDraftState>()(
  persist(
    (set) => ({
      storeLocation: null,
      stops: [],
      hasHydrated: false,
      optimizeMode: "distance" as const,

      setStoreLocation: (store) => set({ storeLocation: store }),
      clearStoreLocation: () => set({ storeLocation: null }),

      addStop: (stop) => set((s) => ({ stops: [...s.stops, stop] })),
      removeStop: (id) => set((s) => ({ stops: s.stops.filter((st) => st.id !== id) })),
      reorderStop: (from, to) =>
        set((s) => {
          if (from === to || from < 0 || to < 0 || from >= s.stops.length || to >= s.stops.length) return s;
          const next = [...s.stops];
          const [item] = next.splice(from, 1);
          next.splice(to, 0, item);
          return { stops: next };
        }),
      clearStops: () => set({ stops: [], optimizeMode: "distance" }),
     // loadDemoRoute: () => set({ storeLocation: demoStore, stops: demoStops }),
     loadDemoRoute: () => {
        // Clear any existing cached layout first
        set({ storeLocation: null, stops: [], optimizeMode: "distance" });

          // Set the fresh data directly from your updated demoRoute file
          set({ storeLocation: demoStore, stops: demoStops });
        },
      setHasHydrated: (v) => set({ hasHydrated: v }),
      setOptimizeMode: (m) => set({ optimizeMode: m }),
    }),
    {
      name: "routelite-draft",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        storeLocation: state.storeLocation,
        stops: state.stops,
      }),
      onRehydrateStorage: () => () => {
        useRouteDraftStore.setState({ hasHydrated: true });
      },
    },
  ),
);
