import AsyncStorage from "@react-native-async-storage/async-storage";

import { supabase } from "../lib/supabase";
import { useAuthStore } from "../state/authStore";
import type { Stop, StoreLocation } from "../types/route";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SavedRoute {
  id: string;
  name: string;
  store: StoreLocation;
  stops: Stop[];
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Guest helpers (AsyncStorage)
// ---------------------------------------------------------------------------

const GUEST_KEY = "routelite-saved-routes";

async function guestList(): Promise<SavedRoute[]> {
  const raw = await AsyncStorage.getItem(GUEST_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as SavedRoute[];
  } catch {
    return [];
  }
}

async function guestWrite(routes: SavedRoute[]): Promise<void> {
  await AsyncStorage.setItem(GUEST_KEY, JSON.stringify(routes));
}

// ---------------------------------------------------------------------------
// Public API — mirrors the same shape for both guest and logged-in paths
// ---------------------------------------------------------------------------

export async function listRoutes(): Promise<SavedRoute[]> {
  const { isGuest, user } = useAuthStore.getState();

  if (isGuest || !user) {
    return guestList();
  }

  const { data, error } = await supabase
    .from("saved_routes")
    .select("id, name, store, stops, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as SavedRoute[];
}

export async function createRoute(
  name: string,
  store: StoreLocation,
  stops: Stop[],
): Promise<SavedRoute> {
  const { isGuest, user } = useAuthStore.getState();
  const now = new Date().toISOString();

  if (isGuest || !user) {
    const routes = await guestList();
    const newRoute: SavedRoute = {
      id: `local-${Date.now()}`,
      name,
      store,
      stops,
      updated_at: now,
    };
    await guestWrite([newRoute, ...routes]);
    return newRoute;
  }

  const { data, error } = await supabase
    .from("saved_routes")
    .insert({ user_id: user.id, name, store, stops, updated_at: now })
    .select("id, name, store, stops, updated_at")
    .single<SavedRoute>();

  if (error || !data) throw error ?? new Error("Failed to save route");
  return data;
}

export async function updateRoute(
  id: string,
  patch: Partial<Pick<SavedRoute, "name" | "store" | "stops">>,
): Promise<void> {
  const { isGuest, user } = useAuthStore.getState();
  const now = new Date().toISOString();

  if (isGuest || !user) {
    const routes = await guestList();
    await guestWrite(
      routes.map((r) => (r.id === id ? { ...r, ...patch, updated_at: now } : r)),
    );
    return;
  }

  const { error } = await supabase
    .from("saved_routes")
    .update({ ...patch, updated_at: now })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw error;
}

export async function deleteRoute(id: string): Promise<void> {
  const { isGuest, user } = useAuthStore.getState();

  if (isGuest || !user) {
    const routes = await guestList();
    await guestWrite(routes.filter((r) => r.id !== id));
    return;
  }

  const { error } = await supabase
    .from("saved_routes")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw error;
}
