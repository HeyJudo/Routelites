import { create } from "zustand";

import { fetchProfile, updateProfile as apiUpdateProfile } from "../api/profile";
import type { Profile, ProfilePatch } from "../api/profile";
import { useAuthStore } from "./authStore";

interface ProfileState {
  profile: Profile | null;
  hasLoaded: boolean;

  loadProfile: () => Promise<void>;
  updateProfile: (patch: ProfilePatch) => Promise<{ error: Error | null }>;
  clearProfile: () => void;
  isOnboarded: () => boolean;
}

export const useProfileStore = create<ProfileState>()((set, get) => ({
  profile: null,
  hasLoaded: false,

  loadProfile: async () => {
    const { isGuest, user } = useAuthStore.getState();

    // Guests have no Supabase session — mark as loaded but leave profile null.
    // Onboarding for guests is tracked locally via routeDraftStore.
    if (isGuest || !user) {
      set({ hasLoaded: true });
      return;
    }

    const profile = await fetchProfile();
    set({ profile, hasLoaded: true });
  },

  updateProfile: async (patch: ProfilePatch) => {
    const { isGuest, user } = useAuthStore.getState();
    if (isGuest || !user) return { error: null };

    // Optimistic local update
    set((s) => {
      if (!s.profile) return s;
      return {
        profile: {
          ...s.profile,
          ...(patch.display_name !== undefined && { displayName: patch.display_name }),
          ...(patch.default_store !== undefined && { defaultStore: patch.default_store }),
          ...(patch.store_name !== undefined && { storeName: patch.store_name }),
          ...(patch.vehicle_type !== undefined && { vehicleType: patch.vehicle_type }),
          ...(patch.typical_daily_stops !== undefined && { typicalDailyStops: patch.typical_daily_stops }),
          ...(patch.onboarded_at !== undefined && { onboardedAt: patch.onboarded_at }),
        },
      };
    });

    const result = await apiUpdateProfile(patch);
    if (result.error) {
      // Revert by re-fetching on error
      const fresh = await fetchProfile();
      set({ profile: fresh });
    }
    return result;
  },

  clearProfile: () => set({ profile: null, hasLoaded: false }),

  isOnboarded: () => Boolean(get().profile?.storeName),
}));
