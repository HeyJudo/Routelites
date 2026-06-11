import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import {
  cancelRunRemote,
  completeRunRemote,
  getActiveRunRemote,
  startRunRemote,
  updateStopStatusRemote,
} from "../api/runs";
import type { ActiveDeliveryRun, ActiveDeliveryStop, DeliveryRunStatus, DeliveryStopStatus, StartRunInput } from "../types/delivery";
import { useAuthStore } from "./authStore";

// ---------------------------------------------------------------------------
// Local id helper (guest runs — good enough for runtime-only ids)
// ---------------------------------------------------------------------------

function localId(suffix: string | number): string {
  return `local-${Date.now()}-${suffix}`;
}

// ---------------------------------------------------------------------------
// Store shape
// ---------------------------------------------------------------------------

interface DeliveryRunState {
  activeRun: ActiveDeliveryRun | null;
  hasHydrated: boolean;

  startRun: (input: StartRunInput) => Promise<void>;
  updateStopStatus: (stopId: string, status: DeliveryStopStatus, note?: string) => Promise<void>;
  completeRun: () => Promise<void>;
  cancelRun: () => Promise<void>;
  clearRun: () => void;
  hydrateActiveRun: () => Promise<void>;
  setHasHydrated: (v: boolean) => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useDeliveryRunStore = create<DeliveryRunState>()(
  persist(
    (set, get) => ({
      activeRun: null,
      hasHydrated: false,

      // -----------------------------------------------------------------------
      // startRun
      // -----------------------------------------------------------------------
      startRun: async (input) => {
        const { isGuest, user } = useAuthStore.getState();

        if (!isGuest && user) {
          const run = await startRunRemote(input, user.id);
          set({ activeRun: run });
          return;
        }

        // Guest: build locally
        const runId = localId("run");
        const stops: ActiveDeliveryStop[] = input.stops.map((s, i) => ({
          id: localId(i),
          stopIndex: i,
          label: s.label,
          address: s.address,
          lat: s.lat,
          lng: s.lng,
          status: "pending",
        }));

        const run: ActiveDeliveryRun = {
          id: runId,
          savedRouteId: input.savedRouteId ?? null,
          name: input.name ?? null,
          status: "active",
          optimizedOrder: input.optimizedOrder,
          totalDistanceM: input.totalDistanceM,
          stops,
          startedAt: new Date().toISOString(),
          completedAt: null,
        };

        set({ activeRun: run });
      },

      // -----------------------------------------------------------------------
      // updateStopStatus
      // -----------------------------------------------------------------------
      updateStopStatus: async (stopId, status, note) => {
        const { activeRun } = get();
        if (!activeRun) return;

        // Optimistic update first
        const updatedStops = activeRun.stops.map((s) =>
          s.id === stopId ? { ...s, status, note: note ?? s.note } : s,
        );
        set({ activeRun: { ...activeRun, stops: updatedStops } });

        const { isGuest } = useAuthStore.getState();
        if (!isGuest) {
          try {
            await updateStopStatusRemote(stopId, status, note);
          } catch (err) {
            // Optimistic value kept; log for debugging
            console.warn("[deliveryRunStore] updateStopStatusRemote failed:", err);
          }
        }
      },

      // -----------------------------------------------------------------------
      // completeRun
      // -----------------------------------------------------------------------
      completeRun: async () => {
        const { activeRun } = get();
        if (!activeRun) return;

        const completedAt = new Date().toISOString();
        set({ activeRun: { ...activeRun, status: "completed" as DeliveryRunStatus, completedAt } });

        const { isGuest } = useAuthStore.getState();
        if (!isGuest) {
          await completeRunRemote(activeRun.id);
        }
      },

      // -----------------------------------------------------------------------
      // cancelRun
      // -----------------------------------------------------------------------
      cancelRun: async () => {
        const { activeRun } = get();
        if (!activeRun) return;

        const completedAt = new Date().toISOString();
        set({ activeRun: { ...activeRun, status: "cancelled" as DeliveryRunStatus, completedAt } });

        const { isGuest } = useAuthStore.getState();
        if (!isGuest) {
          await cancelRunRemote(activeRun.id);
        }
      },

      // -----------------------------------------------------------------------
      // clearRun — called after summary dismiss
      // -----------------------------------------------------------------------
      clearRun: () => set({ activeRun: null }),

      // -----------------------------------------------------------------------
      // hydrateActiveRun — called at app start for logged-in users
      // -----------------------------------------------------------------------
      hydrateActiveRun: async () => {
        const { isGuest, user } = useAuthStore.getState();

        if (!isGuest && user) {
          try {
            const run = await getActiveRunRemote(user.id);
            if (run) {
              set({ activeRun: run });
            }
          } catch (err) {
            console.warn("[deliveryRunStore] hydrateActiveRun failed:", err);
          }
        }

        // Guests: AsyncStorage persist already restored activeRun via onRehydrateStorage
        set({ hasHydrated: true });
      },

      setHasHydrated: (v) => set({ hasHydrated: v }),
    }),
    {
      name: "routelite-delivery-run",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        activeRun: state.activeRun,
      }),
      onRehydrateStorage: () => () => {
        useDeliveryRunStore.setState({ hasHydrated: true });
      },
    },
  ),
);

// ---------------------------------------------------------------------------
// Convenience selector
// ---------------------------------------------------------------------------

export function useActiveRun(): ActiveDeliveryRun | null {
  return useDeliveryRunStore((state) => state.activeRun);
}
