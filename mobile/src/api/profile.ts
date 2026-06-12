import { supabase } from "../lib/supabase";
import { useAuthStore } from "../state/authStore";
import type { StoreLocation } from "../types/route";

// ---------------------------------------------------------------------------
// Row shape (snake_case — matches DB column names)
// ---------------------------------------------------------------------------

export interface ProfileRow {
  id: string;
  display_name: string | null;
  default_store: StoreLocation | null;
  store_name: string | null;
  vehicle_type: string | null;
  typical_daily_stops: string | null;
  onboarded_at: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// App-side type (camelCase)
// ---------------------------------------------------------------------------

export interface Profile {
  id: string;
  displayName: string | null;
  defaultStore: StoreLocation | null;
  storeName: string | null;
  vehicleType: string | null;
  typicalDailyStops: string | null;
  onboardedAt: string | null;
  createdAt: string;
}

export type ProfilePatch = Partial<{
  display_name: string | null;
  default_store: StoreLocation | null;
  store_name: string | null;
  vehicle_type: string | null;
  typical_daily_stops: string | null;
  onboarded_at: string | null;
}>;

// ---------------------------------------------------------------------------
// Mapper
// ---------------------------------------------------------------------------

export function rowToProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    displayName: row.display_name,
    defaultStore: row.default_store,
    storeName: row.store_name,
    vehicleType: row.vehicle_type,
    typicalDailyStops: row.typical_daily_stops,
    onboardedAt: row.onboarded_at,
    createdAt: row.created_at,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function fetchProfile(): Promise<Profile | null> {
  const user = useAuthStore.getState().user;
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, default_store, store_name, vehicle_type, typical_daily_stops, onboarded_at, created_at")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();

  if (error) {
    console.warn("[profile] fetchProfile error:", error.message);
    return null;
  }
  return data ? rowToProfile(data) : null;
}

export async function updateProfile(patch: ProfilePatch): Promise<{ error: Error | null }> {
  const user = useAuthStore.getState().user;
  if (!user) return { error: new Error("Not authenticated") };

  const { error } = await supabase
    .from("profiles")
    .upsert({ id: user.id, ...patch })
    .eq("id", user.id);

  return { error: error as Error | null };
}
