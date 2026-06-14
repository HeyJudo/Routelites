import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

import { fetchProfile, updateProfile as apiUpdateProfile } from "../api/profile";
import type { Profile, ProfilePatch } from "../api/profile";
import { useAuthStore } from "./authStore";

const ONBOARDED_PREFIX = "routelite-onboarded";

function onboardedKey(userId: string): string {
  return `${ONBOARDED_PREFIX}:${userId}`;
}

interface ProfileState {
  profile: Profile | null;
  hasLoaded: boolean;
  localOnboarded: boolean;

  loadProfile: () => Promise<void>;
  updateProfile: (patch: ProfilePatch) => Promise<{ error: Error | null }>;
  completeOnboarding: () => Promise<void>;
  clearProfile: () => void;
  isOnboarded: () => boolean;
}

export const useProfileStore = create<ProfileState>()((set, get) => ({
  profile: null,
  hasLoaded: false,
  localOnboarded: false,

  loadProfile: async () => {
    const { isGuest, user } = useAuthStore.getState();

    // Guests have no Supabase session — mark as loaded but leave profile null.
    // Onboarding for guests is tracked locally via routeDraftStore.
    if (isGuest || !user) {
      set({ hasLoaded: true });
      return;
    }

    // Read the per-account local onboarding flag. This is the authoritative,
    // deterministic signal for whether THIS device+account finished onboarding,
    // independent of any server/profile-fetch timing.
    let localOnboarded = false;
    try {
      localOnboarded = Boolean(await AsyncStorage.getItem(onboardedKey(user.id)));
    } catch {
      localOnboarded = false;
    }

    const profile = await fetchProfile();
    set({ profile, hasLoaded: true, localOnboarded });
  },

  updateProfile: async (patch: ProfilePatch) => {
    const { isGuest, user } = useAuthStore.getState();
    if (isGuest || !user) return { error: null };

    const hadProfile = Boolean(get().profile);

    // Optimistic local update (only possible when a profile already exists)
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
    } else if (!hadProfile) {
      // Profile did not exist locally yet (e.g. a brand-new account going
      // through onboarding). Pull the freshly upserted row so the UI — the
      // header greeting, store name, etc. — reflects the new data immediately.
      const fresh = await fetchProfile();
      set({ profile: fresh });
    }

    return result;
  },

  clearProfile: () => set({ profile: null, hasLoaded: false, localOnboarded: false }),

  completeOnboarding: async () => {
    const { user } = useAuthStore.getState();
    set({ localOnboarded: true });
    if (user) {
      try {
        await AsyncStorage.setItem(onboardedKey(user.id), "true");
      } catch {
        // non-blocking
      }
    }
  },

  isOnboarded: () => {
    const { localOnboarded, profile } = get();
    // Two independent signals so re-login reliably skips onboarding:
    //   • localOnboarded  — per-account flag on this device (fast, offline)
    //   • server profile  — store name / completion marker saved on the account
    // A brand-new account has neither → onboarding shows. Any account that has
    // completed onboarding before (on any device / code version) has the server
    // marker → onboarding is skipped.
    return localOnboarded || Boolean(profile?.onboardedAt || profile?.storeName);
  },
}));
